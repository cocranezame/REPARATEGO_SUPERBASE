import type { DbClient } from "@kallpasoft/db";
import {
  caja as cajaTable,
  cliente as clienteTable,
  costoRevision as costoRevisionTable,
  instancia as instanciaTable,
  ordenServicio as osTable,
  producto as productoTable,
  tarifaDistrito as tarifaTable,
  usuario as usuarioTable,
  ventaItem as ventaItemTable,
  venta as ventaTable,
  visitaDomicilio as visitaTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { TarifaDistrito, VisitaDomicilio } from "../../domain/entities/domicilio.js";
import type {
  CreateTarifaData,
  CreateVisitaData,
  GenerarOsData,
  IDomicilioRepository,
  ListTarifasParams,
  ListVisitasParams,
  ListVisitasResult,
  TecnicoDisponibilidad,
  UpdateEstadoData,
  UpdateTarifaData,
} from "../../domain/ports/domicilio.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

const TRANSICIONES: Record<string, string[]> = {
  POR_VALIDAR: ["VALIDADA", "CANCELADA"],
  VALIDADA: ["ASIGNADA", "CANCELADA"],
  ASIGNADA: ["EN_CAMINO", "CANCELADA"],
  EN_CAMINO: ["EN_SITIO", "CANCELADA"],
  EN_SITIO: ["TERMINADA", "CANCELADA"],
  TERMINADA: [],
  CANCELADA: [],
};

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigoVisita(tx: any, tenantId: string): Promise<string> {
  const rows = await tx
    .select({ total: count() })
    .from(visitaTable)
    .where(eq(visitaTable.tenant_id, tenantId));
  const n = (rows[0]?.total ?? 0) + 1;
  return `VD-${String(n).padStart(4, "0")}`;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigoOS(tx: any, tenantId: string): Promise<string> {
  const rows = await tx
    .select({ total: count() })
    .from(osTable)
    .where(eq(osTable.tenant_id, tenantId));
  const n = (rows[0]?.total ?? 0) + 1;
  return `OS-${String(n).padStart(4, "0")}`;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigoVenta(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM venta WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `V-${String(n).padStart(4, "0")}`;
}

type VisitaRow = {
  visita: typeof visitaTable.$inferSelect;
  cliente_nombres: string | null;
  cliente_apellidos: string | null;
  cliente_razon_social: string | null;
  tecnico_nombres: string | null;
  tecnico_apellidos: string | null;
};

function mapVisita(r: VisitaRow): VisitaDomicilio {
  const v = r.visita;
  const clienteNombre =
    r.cliente_razon_social ??
    (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined);
  const tecnicoNombre =
    r.tecnico_nombres != null
      ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
      : undefined;

  return {
    id: v.id,
    tenant_id: v.tenant_id,
    codigo: v.codigo,
    cliente_id: v.cliente_id,
    ...(clienteNombre !== undefined ? { cliente_nombre: clienteNombre } : {}),
    ...(v.direccion_id != null ? { direccion_id: v.direccion_id } : {}),
    direccion_texto: v.direccion_texto,
    distrito: v.distrito,
    ...(v.tecnico_id != null ? { tecnico_id: v.tecnico_id } : {}),
    ...(tecnicoNombre !== undefined ? { tecnico_nombre: tecnicoNombre } : {}),
    fecha_programada: v.fecha_programada,
    ...(v.hora_inicio != null ? { hora_inicio: v.hora_inicio } : {}),
    ...(v.hora_fin != null ? { hora_fin: v.hora_fin } : {}),
    estado: v.estado,
    tarifa: v.tarifa,
    ...(v.motivo_visita != null ? { motivo_visita: v.motivo_visita } : {}),
    ...(v.diagnostico_campo != null ? { diagnostico_campo: v.diagnostico_campo } : {}),
    ...(v.orden_servicio_id != null ? { orden_servicio_id: v.orden_servicio_id } : {}),
    ...(v.venta_id != null ? { venta_id: v.venta_id } : {}),
    ...(v.motivo_cancelacion != null ? { motivo_cancelacion: v.motivo_cancelacion } : {}),
    ...(v.notas != null ? { notas: v.notas } : {}),
    activo: v.activo,
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

function mapVisitaSimple(v: typeof visitaTable.$inferSelect): VisitaDomicilio {
  return {
    id: v.id,
    tenant_id: v.tenant_id,
    codigo: v.codigo,
    cliente_id: v.cliente_id,
    ...(v.direccion_id != null ? { direccion_id: v.direccion_id } : {}),
    direccion_texto: v.direccion_texto,
    distrito: v.distrito,
    ...(v.tecnico_id != null ? { tecnico_id: v.tecnico_id } : {}),
    fecha_programada: v.fecha_programada,
    ...(v.hora_inicio != null ? { hora_inicio: v.hora_inicio } : {}),
    ...(v.hora_fin != null ? { hora_fin: v.hora_fin } : {}),
    estado: v.estado,
    tarifa: v.tarifa,
    ...(v.motivo_visita != null ? { motivo_visita: v.motivo_visita } : {}),
    ...(v.diagnostico_campo != null ? { diagnostico_campo: v.diagnostico_campo } : {}),
    ...(v.orden_servicio_id != null ? { orden_servicio_id: v.orden_servicio_id } : {}),
    ...(v.venta_id != null ? { venta_id: v.venta_id } : {}),
    ...(v.motivo_cancelacion != null ? { motivo_cancelacion: v.motivo_cancelacion } : {}),
    ...(v.notas != null ? { notas: v.notas } : {}),
    activo: v.activo,
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

export class DomicilioDrizzleRepository implements IDomicilioRepository {
  constructor(private readonly db: DbClient) {}

  async listTarifas(tenantId: string, params: ListTarifasParams): Promise<TarifaDistrito[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(tarifaTable.tenant_id, tenantId)];
      if (params.activo !== undefined) conditions.push(eq(tarifaTable.activo, params.activo));
      if (params.search) {
        const term = `%${params.search}%`;
        const cond = or(ilike(tarifaTable.distrito, term), ilike(tarifaTable.provincia, term));
        if (cond) conditions.push(cond);
      }

      return tx
        .select()
        .from(tarifaTable)
        .where(and(...conditions))
        .orderBy(tarifaTable.distrito) as Promise<TarifaDistrito[]>;
    });
  }

  async createTarifa(tenantId: string, data: CreateTarifaData): Promise<TarifaDistrito> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .insert(tarifaTable)
        .values({
          tenant_id: tenantId,
          distrito: data.distrito,
          provincia: data.provincia ?? "Lima",
          tarifa: String(data.tarifa),
        })
        .returning();

      return row as TarifaDistrito;
    });
  }

  async updateTarifa(
    tenantId: string,
    id: string,
    data: UpdateTarifaData
  ): Promise<TarifaDistrito | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const updates: Partial<typeof tarifaTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.distrito !== undefined) updates.distrito = data.distrito;
      if (data.provincia !== undefined) updates.provincia = data.provincia;
      if (data.tarifa !== undefined) updates.tarifa = String(data.tarifa);
      if (data.activo !== undefined) updates.activo = data.activo;

      const [row] = await tx
        .update(tarifaTable)
        .set(updates)
        .where(and(eq(tarifaTable.id, id), eq(tarifaTable.tenant_id, tenantId)))
        .returning();

      return (row as TarifaDistrito | undefined) ?? null;
    });
  }

  async deleteTarifa(tenantId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .update(tarifaTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(tarifaTable.id, id), eq(tarifaTable.tenant_id, tenantId)))
        .returning({ id: tarifaTable.id });

      return row != null;
    });
  }

  async listVisitas(tenantId: string, params: ListVisitasParams): Promise<ListVisitasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(visitaTable.tenant_id, tenantId), eq(visitaTable.activo, true)];

      if (params.estado) {
        conditions.push(
          eq(visitaTable.estado, params.estado as (typeof visitaTable.estado)["_"]["data"])
        );
      }
      if (params.tecnico_id) conditions.push(eq(visitaTable.tecnico_id, params.tecnico_id));
      if (params.desde) conditions.push(gte(visitaTable.fecha_programada, params.desde));
      if (params.hasta) conditions.push(lte(visitaTable.fecha_programada, params.hasta));

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(visitaTable).where(where),
        tx
          .select({
            visita: visitaTable,
            cliente_nombres: clienteTable.nombres,
            cliente_apellidos: clienteTable.apellidos,
            cliente_razon_social: clienteTable.razon_social,
            tecnico_nombres: usuarioTable.nombres,
            tecnico_apellidos: usuarioTable.apellidos,
          })
          .from(visitaTable)
          .leftJoin(clienteTable, eq(visitaTable.cliente_id, clienteTable.id))
          .leftJoin(usuarioTable, eq(visitaTable.tecnico_id, usuarioTable.id))
          .where(where)
          .orderBy(visitaTable.fecha_programada)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return {
        items: rows.map((r) => mapVisita(r as VisitaRow)),
        total: countRows[0]?.total ?? 0,
      };
    });
  }

  async findVisitaById(tenantId: string, id: string): Promise<VisitaDomicilio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          visita: visitaTable,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
          tecnico_nombres: usuarioTable.nombres,
          tecnico_apellidos: usuarioTable.apellidos,
        })
        .from(visitaTable)
        .leftJoin(clienteTable, eq(visitaTable.cliente_id, clienteTable.id))
        .leftJoin(usuarioTable, eq(visitaTable.tecnico_id, usuarioTable.id))
        .where(and(eq(visitaTable.id, id), eq(visitaTable.tenant_id, tenantId)))
        .limit(1);

      const r = rows[0];
      if (!r) return null;

      return mapVisita(r as VisitaRow);
    });
  }

  async createVisita(tenantId: string, data: CreateVisitaData): Promise<VisitaDomicilio> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await generarCodigoVisita(tx, tenantId);

      const tarifaRows = await tx
        .select({ tarifa: tarifaTable.tarifa })
        .from(tarifaTable)
        .where(
          and(
            eq(tarifaTable.tenant_id, tenantId),
            eq(tarifaTable.distrito, data.distrito),
            eq(tarifaTable.activo, true)
          )
        )
        .limit(1);

      const tarifa = tarifaRows[0]?.tarifa ?? "0";

      const [inserted] = await tx
        .insert(visitaTable)
        .values({
          tenant_id: tenantId,
          codigo,
          cliente_id: data.cliente_id,
          ...(data.direccion_id !== undefined ? { direccion_id: data.direccion_id } : {}),
          direccion_texto: data.direccion_texto,
          distrito: data.distrito,
          ...(data.tecnico_id !== undefined ? { tecnico_id: data.tecnico_id } : {}),
          fecha_programada: data.fecha_programada,
          ...(data.hora_inicio !== undefined ? { hora_inicio: data.hora_inicio } : {}),
          ...(data.hora_fin !== undefined ? { hora_fin: data.hora_fin } : {}),
          tarifa,
          ...(data.motivo_visita !== undefined ? { motivo_visita: data.motivo_visita } : {}),
          ...(data.notas !== undefined ? { notas: data.notas } : {}),
        })
        .returning();

      return mapVisitaSimple(inserted as typeof visitaTable.$inferSelect);
    });
  }

  async updateEstado(
    tenantId: string,
    id: string,
    data: UpdateEstadoData
  ): Promise<VisitaDomicilio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select()
        .from(visitaTable)
        .where(and(eq(visitaTable.id, id), eq(visitaTable.tenant_id, tenantId)))
        .limit(1);

      const visita = rows[0];
      if (!visita) return null;

      const permitidos = TRANSICIONES[visita.estado] ?? [];
      if (!permitidos.includes(data.estado)) {
        throw new Error(`Transición inválida: ${visita.estado} → ${data.estado}`);
      }

      const updates: Partial<typeof visitaTable.$inferInsert> = {
        estado: data.estado as (typeof visitaTable.estado)["_"]["data"],
        updated_at: new Date(),
      };

      if (data.diagnostico_campo !== undefined) updates.diagnostico_campo = data.diagnostico_campo;
      if (data.motivo_cancelacion !== undefined)
        updates.motivo_cancelacion = data.motivo_cancelacion;
      if (data.tecnico_id !== undefined) updates.tecnico_id = data.tecnico_id;

      if (
        data.estado === "CANCELADA" &&
        data.cobrar === true &&
        data.caja_id !== undefined &&
        data.sucursal_id !== undefined
      ) {
        const cajaRows = await tx
          .select({ sucursal_id: cajaTable.sucursal_id })
          .from(cajaTable)
          .where(and(eq(cajaTable.id, data.caja_id), eq(cajaTable.estado, "ABIERTA")))
          .limit(1);

        if (cajaRows.length > 0) {
          const ventaCodigo = await generarCodigoVenta(tx, tenantId);
          const tarifa = Number(visita.tarifa);
          const igv = Math.round(tarifa * 0.18 * 100) / 100;
          const total = Math.round((tarifa + igv) * 100) / 100;

          const [nuevaVenta] = await tx
            .insert(ventaTable)
            .values({
              tenant_id: tenantId,
              codigo: ventaCodigo,
              caja_id: data.caja_id,
              sucursal_id: data.sucursal_id,
              cliente_id: visita.cliente_id,
              tipo_venta: "REVISION_DOMICILIO",
              subtotal: String(tarifa),
              igv: String(igv),
              total: String(total),
              estado: "PENDIENTE",
              usuario_id: data.userId,
            })
            .returning({ id: ventaTable.id });

          if (nuevaVenta) {
            await tx.insert(ventaItemTable).values({
              tenant_id: tenantId,
              venta_id: nuevaVenta.id,
              descripcion: "Visita a domicilio",
              cantidad: 1,
              precio_unitario: String(tarifa),
              subtotal: String(tarifa),
            });

            updates.venta_id = nuevaVenta.id;
          }
        }
      }

      const [updated] = await tx
        .update(visitaTable)
        .set(updates)
        .where(and(eq(visitaTable.id, id), eq(visitaTable.tenant_id, tenantId)))
        .returning();

      if (!updated) return null;

      return mapVisitaSimple(updated as typeof visitaTable.$inferSelect);
    });
  }

  async generarOrdenServicio(
    tenantId: string,
    visitaId: string,
    data: GenerarOsData
  ): Promise<VisitaDomicilio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select()
        .from(visitaTable)
        .where(and(eq(visitaTable.id, visitaId), eq(visitaTable.tenant_id, tenantId)))
        .limit(1);

      const visita = rows[0];
      if (!visita) return null;

      if (visita.estado !== "TERMINADA") {
        throw new Error("Solo se puede generar OS desde una visita TERMINADA");
      }

      if (visita.orden_servicio_id != null) {
        throw new Error("Esta visita ya tiene una orden de servicio asociada");
      }

      const codigoOS = await generarCodigoOS(tx, tenantId);

      // Resolve costo_revision via instancia → producto → categoria
      const instRows = await tx
        .select({ cat_id: productoTable.categoria_id })
        .from(instanciaTable)
        .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
        .where(
          and(eq(instanciaTable.id, data.instancia_id), eq(instanciaTable.tenant_id, tenantId))
        )
        .limit(1);

      let costoRevision = "0";
      const categoriaId = instRows[0]?.cat_id;
      if (categoriaId) {
        const costoRows = await tx
          .select({ monto: costoRevisionTable.monto })
          .from(costoRevisionTable)
          .where(
            and(
              eq(costoRevisionTable.tenant_id, tenantId),
              eq(costoRevisionTable.categoria_id, categoriaId),
              eq(costoRevisionTable.activo, true)
            )
          )
          .limit(1);
        costoRevision = costoRows[0]?.monto ?? "0";
      }

      const [nuevaOS] = await tx
        .insert(osTable)
        .values({
          tenant_id: tenantId,
          codigo: codigoOS,
          instancia_id: data.instancia_id,
          sucursal_id: data.sucursal_id,
          canal: "DOMICILIO",
          tipo_servicio: (data.tipo_servicio ??
            "REPARACION") as (typeof osTable.tipo_servicio)["_"]["data"],
          falla_ingreso: data.falla_ingreso,
          costo_revision: costoRevision,
          visita_domicilio_id: visitaId,
        })
        .returning({ id: osTable.id });

      if (!nuevaOS) return null;

      const [updated] = await tx
        .update(visitaTable)
        .set({ orden_servicio_id: nuevaOS.id, updated_at: new Date() })
        .where(and(eq(visitaTable.id, visitaId), eq(visitaTable.tenant_id, tenantId)))
        .returning();

      if (!updated) return null;

      return mapVisitaSimple(updated as typeof visitaTable.$inferSelect);
    });
  }

  async getDisponibilidad(
    tenantId: string,
    fecha: string,
    tecnicoId?: string
  ): Promise<TecnicoDisponibilidad[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(visitaTable.tenant_id, tenantId),
        eq(visitaTable.fecha_programada, fecha),
        eq(visitaTable.activo, true),
      ];

      if (tecnicoId) conditions.push(eq(visitaTable.tecnico_id, tecnicoId));

      const rows = await tx
        .select({
          visita_id: visitaTable.id,
          visita_codigo: visitaTable.codigo,
          hora_inicio: visitaTable.hora_inicio,
          hora_fin: visitaTable.hora_fin,
          estado: visitaTable.estado,
          tecnico_id: visitaTable.tecnico_id,
          tecnico_nombres: usuarioTable.nombres,
          tecnico_apellidos: usuarioTable.apellidos,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
        })
        .from(visitaTable)
        .leftJoin(usuarioTable, eq(visitaTable.tecnico_id, usuarioTable.id))
        .leftJoin(clienteTable, eq(visitaTable.cliente_id, clienteTable.id))
        .where(and(...conditions))
        .orderBy(visitaTable.hora_inicio);

      const tecnicosMap = new Map<string, TecnicoDisponibilidad>();

      for (const r of rows) {
        if (!r.tecnico_id) continue;

        if (!tecnicosMap.has(r.tecnico_id)) {
          const nombre =
            r.tecnico_nombres != null
              ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
              : r.tecnico_id;
          tecnicosMap.set(r.tecnico_id, {
            tecnico_id: r.tecnico_id,
            tecnico_nombre: nombre,
            visitas: [],
          });
        }

        const clienteNombre =
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined);

        tecnicosMap.get(r.tecnico_id)?.visitas.push({
          id: r.visita_id,
          codigo: r.visita_codigo,
          ...(clienteNombre !== undefined ? { cliente_nombre: clienteNombre } : {}),
          ...(r.hora_inicio != null ? { hora_inicio: r.hora_inicio } : {}),
          ...(r.hora_fin != null ? { hora_fin: r.hora_fin } : {}),
          estado: r.estado,
        });
      }

      return Array.from(tecnicosMap.values());
    });
  }
}
