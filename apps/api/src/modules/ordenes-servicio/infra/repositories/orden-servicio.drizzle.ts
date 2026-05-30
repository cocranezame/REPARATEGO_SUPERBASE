import type { DbClient } from "@kallpasoft/db";
import {
  categoria as categoriaTable,
  cliente as clienteTable,
  componente as componenteTable,
  marca as marcaTable,
  modelo as modeloTable,
  ordenServicioCotizacion as oscotTable,
  ordenServicioComponente as oscTable,
  ordenServicioEvidencia as osevTable,
  ordenServicio as osTable,
  usuario as usuarioTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type {
  OrdenServicio,
  OrdenServicioComponente,
  OrdenServicioCotizacion,
  OrdenServicioDetalle,
  OrdenServicioEvidencia,
} from "../../domain/entities/orden-servicio.js";
import type {
  AddComponenteItem,
  AddEvidenciaData,
  CotizacionItem,
  CreateOrdenServicioData,
  IOrdenServicioRepository,
  ListOrdenesServicioParams,
  ListOrdenesServicioResult,
  UpdateEstadoData,
  UpdateOrdenServicioData,
} from "../../domain/ports/orden-servicio.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

const TRANSICIONES: Record<string, string[]> = {
  RECEPCION: ["EN_DIAGNOSTICO", "CANCELADO"],
  EN_DIAGNOSTICO: ["DIAGNOSTICADO", "CANCELADO"],
  DIAGNOSTICADO: ["COTIZADO", "EN_REPARACION", "CANCELADO"],
  COTIZADO: ["APROBADO", "CANCELADO"],
  APROBADO: ["EN_REPARACION", "CANCELADO"],
  EN_REPARACION: ["REPARADO", "CANCELADO"],
  REPARADO: ["LISTO_ENTREGA", "CANCELADO"],
  LISTO_ENTREGA: ["ENTREGADO", "DEVOLUCION", "CANCELADO"],
  ENTREGADO: [],
  DEVOLUCION: ["CANCELADO"],
  CANCELADO: [],
};

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigo(tx: any, tenantId: string): Promise<string> {
  const rows = await tx
    .select({ total: count() })
    .from(osTable)
    .where(eq(osTable.tenant_id, tenantId));
  const n = (rows[0]?.total ?? 0) + 1;
  return `OS-${String(n).padStart(4, "0")}`;
}

export class OrdenServicioDrizzleRepository implements IOrdenServicioRepository {
  constructor(private readonly db: DbClient) {}

  async list(
    tenantId: string,
    params: ListOrdenesServicioParams
  ): Promise<ListOrdenesServicioResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(osTable.tenant_id, tenantId)];

      if (params.estado) {
        conditions.push(eq(osTable.estado, params.estado as (typeof osTable.estado)["_"]["data"]));
      }
      if (params.tecnico_id) conditions.push(eq(osTable.tecnico_id, params.tecnico_id));
      if (params.sucursal_id) conditions.push(eq(osTable.sucursal_id, params.sucursal_id));
      if (params.cliente_id) conditions.push(eq(osTable.cliente_id, params.cliente_id));
      if (params.desde) conditions.push(gte(osTable.fecha_recepcion, new Date(params.desde)));
      if (params.hasta) conditions.push(lte(osTable.fecha_recepcion, new Date(params.hasta)));
      if (params.search) {
        const term = `%${params.search}%`;
        const cond = or(
          ilike(osTable.codigo, term),
          ilike(osTable.problema_reportado, term),
          ilike(osTable.serie_equipo, term)
        );
        if (cond) conditions.push(cond);
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(osTable).where(where),
        tx
          .select({
            os: osTable,
            cliente_nombres: clienteTable.nombres,
            cliente_apellidos: clienteTable.apellidos,
            cliente_razon_social: clienteTable.razon_social,
            tecnico_nombres: usuarioTable.nombres,
            tecnico_apellidos: usuarioTable.apellidos,
            categoria_nombre: categoriaTable.nombre,
            marca_nombre: marcaTable.nombre,
            modelo_nombre: modeloTable.nombre,
          })
          .from(osTable)
          .leftJoin(clienteTable, eq(osTable.cliente_id, clienteTable.id))
          .leftJoin(usuarioTable, eq(osTable.tecnico_id, usuarioTable.id))
          .leftJoin(categoriaTable, eq(osTable.categoria_id, categoriaTable.id))
          .leftJoin(marcaTable, eq(osTable.marca_id, marcaTable.id))
          .leftJoin(modeloTable, eq(osTable.modelo_id, modeloTable.id))
          .where(where)
          .orderBy(osTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: OrdenServicio[] = rows.map((r) => ({
        ...(r.os as OrdenServicio),
        cliente_nombre:
          r.cliente_razon_social ??
          `${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() ??
          undefined,
        tecnico_nombre: r.tecnico_nombres
          ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
          : undefined,
        categoria_nombre: r.categoria_nombre ?? undefined,
        marca_nombre: r.marca_nombre ?? undefined,
        modelo_nombre: r.modelo_nombre ?? undefined,
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<OrdenServicioDetalle | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          os: osTable,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
          tecnico_nombres: usuarioTable.nombres,
          tecnico_apellidos: usuarioTable.apellidos,
          categoria_nombre: categoriaTable.nombre,
          marca_nombre: marcaTable.nombre,
          modelo_nombre: modeloTable.nombre,
        })
        .from(osTable)
        .leftJoin(clienteTable, eq(osTable.cliente_id, clienteTable.id))
        .leftJoin(usuarioTable, eq(osTable.tecnico_id, usuarioTable.id))
        .leftJoin(categoriaTable, eq(osTable.categoria_id, categoriaTable.id))
        .leftJoin(marcaTable, eq(osTable.marca_id, marcaTable.id))
        .leftJoin(modeloTable, eq(osTable.modelo_id, modeloTable.id))
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)));

      if (!rows[0]) return null;
      const r = rows[0];

      const [componentes, cotizacion, evidencias] = await Promise.all([
        tx
          .select({ comp: oscTable, componente_nombre: componenteTable.nombre })
          .from(oscTable)
          .leftJoin(componenteTable, eq(oscTable.componente_id, componenteTable.id))
          .where(eq(oscTable.orden_servicio_id, id)),
        tx
          .select()
          .from(oscotTable)
          .where(eq(oscotTable.orden_servicio_id, id))
          .orderBy(oscotTable.created_at),
        tx
          .select()
          .from(osevTable)
          .where(eq(osevTable.orden_servicio_id, id))
          .orderBy(osevTable.created_at),
      ]);

      return {
        ...(r.os as OrdenServicio),
        cliente_nombre:
          r.cliente_razon_social ??
          `${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() ??
          undefined,
        tecnico_nombre: r.tecnico_nombres
          ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
          : undefined,
        categoria_nombre: r.categoria_nombre ?? undefined,
        marca_nombre: r.marca_nombre ?? undefined,
        modelo_nombre: r.modelo_nombre ?? undefined,
        componentes: componentes.map((c) => ({
          ...(c.comp as OrdenServicioComponente),
          componente_nombre: c.componente_nombre ?? undefined,
        })),
        cotizacion: cotizacion as OrdenServicioCotizacion[],
        evidencias: evidencias as OrdenServicioEvidencia[],
      };
    });
  }

  async create(tenantId: string, data: CreateOrdenServicioData): Promise<OrdenServicio> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const codigo = await generarCodigo(tx, tenantId);
      return tx
        .insert(osTable)
        .values({
          tenant_id: tenantId,
          codigo,
          sucursal_id: data.sucursal_id,
          cliente_id: data.cliente_id,
          recibido_por_id: data.recibido_por_id,
          categoria_id: data.categoria_id,
          marca_id: data.marca_id ?? null,
          modelo_id: data.modelo_id ?? null,
          serie_equipo: data.serie_equipo ?? null,
          color_equipo: data.color_equipo ?? null,
          problema_reportado: data.problema_reportado,
          tipo_servicio: (data.tipo_servicio ??
            "CORRECTIVO") as (typeof osTable.tipo_servicio)["_"]["data"],
          prioridad: data.prioridad ?? "NORMAL",
          notas_internas: data.notas_internas ?? null,
        })
        .returning();
    });
    return rows[0] as OrdenServicio;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateOrdenServicioData
  ): Promise<OrdenServicio | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const setValues: Partial<typeof osTable.$inferInsert> = { updated_at: new Date() };
      if (data.tecnico_id !== undefined) setValues.tecnico_id = data.tecnico_id;
      if (data.diagnostico_tecnico !== undefined)
        setValues.diagnostico_tecnico = data.diagnostico_tecnico;
      if (data.solucion_aplicada !== undefined)
        setValues.solucion_aplicada = data.solucion_aplicada;
      if (data.notas_internas !== undefined) setValues.notas_internas = data.notas_internas;
      if (data.prioridad !== undefined) setValues.prioridad = data.prioridad;
      return tx
        .update(osTable)
        .set(setValues)
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as OrdenServicio) ?? null;
  }

  async updateEstado(
    tenantId: string,
    id: string,
    data: UpdateEstadoData
  ): Promise<OrdenServicio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const current = await tx
        .select({ estado: osTable.estado })
        .from(osTable)
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)));
      if (!current[0]) return null;

      const allowed = TRANSICIONES[current[0].estado] ?? [];
      if (!allowed.includes(data.estado)) {
        throw new Error(`Transición no permitida: ${current[0].estado} → ${data.estado}`);
      }

      const setValues: Partial<typeof osTable.$inferInsert> = {
        estado: data.estado as (typeof osTable.estado)["_"]["data"],
        updated_at: new Date(),
      };

      if (data.estado === "EN_DIAGNOSTICO") setValues.fecha_diagnostico = new Date();
      if (data.estado === "EN_REPARACION") setValues.fecha_inicio_reparacion = new Date();
      if (data.estado === "REPARADO") setValues.fecha_terminado = new Date();
      if (data.estado === "ENTREGADO") setValues.fecha_entrega = new Date();

      const rows = await tx
        .update(osTable)
        .set(setValues)
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)))
        .returning();
      return (rows[0] as OrdenServicio) ?? null;
    });
  }

  async addComponentes(
    tenantId: string,
    ordenId: string,
    items: AddComponenteItem[]
  ): Promise<OrdenServicioComponente[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .insert(oscTable)
        .values(
          items.map((it) => ({
            tenant_id: tenantId,
            orden_servicio_id: ordenId,
            componente_id: it.componente_id,
            es_preliminar: it.es_preliminar,
            estado_componente: it.estado_componente,
            notas: it.notas ?? null,
          }))
        )
        .returning();
      return rows as OrdenServicioComponente[];
    });
  }

  async listComponentes(tenantId: string, ordenId: string): Promise<OrdenServicioComponente[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select({ comp: oscTable, componente_nombre: componenteTable.nombre })
        .from(oscTable)
        .leftJoin(componenteTable, eq(oscTable.componente_id, componenteTable.id))
        .where(and(eq(oscTable.orden_servicio_id, ordenId), eq(oscTable.tenant_id, tenantId)));
      return rows.map((r) => ({
        ...(r.comp as OrdenServicioComponente),
        componente_nombre: r.componente_nombre ?? undefined,
      }));
    });
  }

  async listCotizacion(tenantId: string, ordenId: string): Promise<OrdenServicioCotizacion[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select()
        .from(oscotTable)
        .where(and(eq(oscotTable.orden_servicio_id, ordenId), eq(oscotTable.tenant_id, tenantId)))
        .orderBy(oscotTable.created_at);
      return rows as OrdenServicioCotizacion[];
    });
  }

  async addCotizacion(
    tenantId: string,
    ordenId: string,
    items: CotizacionItem[]
  ): Promise<OrdenServicioCotizacion[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const subtotales = items.map((it) => ({
        ...it,
        subtotal: (it.cantidad * it.precio_unitario).toFixed(2),
      }));

      const rows = await tx
        .insert(oscotTable)
        .values(
          subtotales.map((it) => ({
            tenant_id: tenantId,
            orden_servicio_id: ordenId,
            producto_id: it.producto_id ?? null,
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precio_unitario: String(it.precio_unitario),
            subtotal: it.subtotal,
            tipo: it.tipo,
          }))
        )
        .returning();

      await tx
        .update(osTable)
        .set({
          estado: "COTIZADO" as (typeof osTable.estado)["_"]["data"],
          updated_at: new Date(),
        })
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)));

      return rows as OrdenServicioCotizacion[];
    });
  }

  async aprobarCotizacion(
    tenantId: string,
    ordenId: string,
    aprobado: boolean
  ): Promise<OrdenServicio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      await tx
        .update(oscotTable)
        .set({ aprobado_cliente: aprobado, updated_at: new Date() })
        .where(and(eq(oscotTable.orden_servicio_id, ordenId), eq(oscotTable.tenant_id, tenantId)));

      if (aprobado) {
        const rows = await tx
          .update(osTable)
          .set({
            estado: "APROBADO" as (typeof osTable.estado)["_"]["data"],
            updated_at: new Date(),
          })
          .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)))
          .returning();
        return (rows[0] as OrdenServicio) ?? null;
      }

      const rows = await tx
        .select()
        .from(osTable)
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)));
      return (rows[0] as OrdenServicio) ?? null;
    });
  }

  async listEvidencias(tenantId: string, ordenId: string): Promise<OrdenServicioEvidencia[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select()
        .from(osevTable)
        .where(and(eq(osevTable.orden_servicio_id, ordenId), eq(osevTable.tenant_id, tenantId)))
        .orderBy(osevTable.created_at);
      return rows as OrdenServicioEvidencia[];
    });
  }

  async addEvidencia(
    tenantId: string,
    ordenId: string,
    data: AddEvidenciaData
  ): Promise<OrdenServicioEvidencia> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(osevTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          url: data.url,
          tipo_archivo: data.tipo_archivo,
          momento: data.momento as (typeof osevTable.momento)["_"]["data"],
          descripcion: data.descripcion ?? null,
          usuario_id: data.usuario_id,
        })
        .returning();
    });
    return rows[0] as OrdenServicioEvidencia;
  }

  async deleteEvidencia(tenantId: string, ordenId: string, evidenciaId: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .delete(osevTable)
        .where(
          and(
            eq(osevTable.id, evidenciaId),
            eq(osevTable.orden_servicio_id, ordenId),
            eq(osevTable.tenant_id, tenantId)
          )
        )
        .returning({ id: osevTable.id });
    });
    return rows.length > 0;
  }
}
