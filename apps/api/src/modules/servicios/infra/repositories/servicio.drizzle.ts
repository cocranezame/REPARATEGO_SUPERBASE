import type { DbClient } from "@kallpasoft/db";
import {
  caja as cajaTable,
  categoria as categoriaTable,
  cliente as clienteTable,
  componente as componenteTable,
  costoRevision as costoRevisionTable,
  instanciaImagen as instanciaImagenTable,
  instancia as instanciaTable,
  movimientoInventario as movimientoTable,
  ordenServicioAceptacion as osAceptacionTable,
  ordenServicioComponente as osComponenteTable,
  ordenServicioCotizacion as osCotizacionTable,
  ordenServicioEvidencia as osEvidenciaTable,
  ordenServicioHistorial as osHistorialTable,
  ordenServicioObservacion as osObservacionTable,
  ordenServicioPeriferico as osPerifericoTable,
  ordenServicioRequerimiento as osRequerimientoTable,
  ordenServicioSkuAsignado as osSkuTable,
  ordenServicio as osTable,
  periferico as perifericoTable,
  productoCompatibilidad as productoCompatTable,
  producto as productoTable,
  usuario as usuarioTable,
  ventaItem as ventaItemTable,
  venta as ventaTable,
} from "@kallpasoft/db";
import bcrypt from "bcryptjs";
import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, sum } from "drizzle-orm";
import type {
  ComponenteOrden,
  CostoRevision,
  CotizacionItemOrden,
  CotizacionOrden,
  EvidenciaOrden,
  HistorialOrden,
  Instancia,
  InstanciaImagen,
  ObservacionOrden,
  OrdenServicioDetalle,
  OrdenServicioResumen,
  Periferico,
  PresupuestoBusquedaResult,
  PresupuestoItem,
  RequerimientoOrden,
  SkuAsignadoOrden,
} from "../../domain/entities/servicio.js";
import type {
  AddEvidenciaData,
  AddInstanciaImagenData,
  AddObservacionData,
  AsignarSkuData,
  BuscarPresupuestoParams,
  CreateCostoRevisionData,
  CreateInstanciaData,
  CreateOrdenData,
  CreatePerifericoData,
  CreateRequerimientoData,
  IServicioRepository,
  ListInstanciasParams,
  ListInstanciasResult,
  ListOrdenesParams,
  ListOrdenesResult,
  ListPerifericosParams,
  RegistrarAceptacionData,
  RegistrarAceptacionResult,
  RegistrarCotizacionData,
  UpdateCostoRevisionData,
  UpdateEstadoOrdenData,
  UpdateEstadoResult,
  UpdateOrdenData,
  UpdatePerifericoData,
  UpdateRequerimientoEstadoData,
  UpsertComponentesData,
} from "../../domain/ports/servicio.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
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
  const rows = await tx
    .select({ total: count() })
    .from(ventaTable)
    .where(eq(ventaTable.tenant_id, tenantId));
  const n = (rows[0]?.total ?? 0) + 1;
  return `V-${String(n).padStart(4, "0")}`;
}

const TRANSICIONES: Record<string, string[]> = {
  VALIDACION: ["REVISION"],
  REVISION: ["DIAG_PRELIMINAR", "DIAG_FINAL"],
  DIAG_PRELIMINAR: ["DIAG_FINAL"],
  DIAG_FINAL: ["COTIZADO", "DEVOLUCION", "DIAG_PRELIMINAR"],
  COTIZADO: ["APROBADO", "DIAG_FINAL"],
  APROBADO: ["AGREGAR_SKU", "COTIZADO"],
  AGREGAR_SKU: ["PRIORIDAD", "REPARADO", "APROBADO"],
  PRIORIDAD: ["REPARADO", "AGREGAR_SKU"],
  REPARADO: ["AVISADO"],
  AVISADO: ["ENTREGADO", "REPARADO"],
  ENTREGADO: ["GARANTIA"],
  GARANTIA: ["REPARADO"],
  DEVOLUCION: ["ENTREGADO"],
};

function clienteNombre(
  nombres: string | null,
  apellidos: string | null,
  razon_social: string | null
): string | undefined {
  return razon_social ?? (`${nombres ?? ""} ${apellidos ?? ""}`.trim() || undefined);
}

function mapInstanciaImagen(r: typeof instanciaImagenTable.$inferSelect): InstanciaImagen {
  return {
    id: r.id,
    instancia_id: r.instancia_id,
    url: r.url,
    ...(r.descripcion != null ? { descripcion: r.descripcion } : {}),
    orden: r.orden,
    created_at: r.created_at,
  };
}

function mapCostoRevision(
  r: typeof costoRevisionTable.$inferSelect,
  categoriaNombre: string | null
): CostoRevision {
  return {
    id: r.id,
    tenant_id: r.tenant_id,
    categoria_id: r.categoria_id,
    ...(categoriaNombre != null ? { categoria_nombre: categoriaNombre } : {}),
    monto: r.monto,
    activo: r.activo,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export class ServicioDrizzleRepository implements IServicioRepository {
  constructor(private readonly db: DbClient) {}

  // ─── Instancias ─────────────────────────────────────────────────────────────

  async createInstancia(
    tenantId: string,
    data: CreateInstanciaData,
    userId: string
  ): Promise<Instancia> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // C008: solo equipos (componente_id IS NULL) pueden ser instancias
      const [prodCheck] = await tx
        .select({ componente_id: productoTable.componente_id })
        .from(productoTable)
        .where(and(eq(productoTable.id, data.producto_id), eq(productoTable.tenant_id, tenantId)))
        .limit(1);

      if (!prodCheck) throw new Error("Producto no encontrado");
      if (prodCheck.componente_id !== null) {
        throw new Error("Solo se pueden crear instancias de equipos, no de repuestos");
      }

      const [row] = await tx
        .insert(instanciaTable)
        .values({
          tenant_id: tenantId,
          cliente_id: data.cliente_id,
          producto_id: data.producto_id,
          ...(data.numero_serie !== undefined ? { numero_serie: data.numero_serie } : {}),
          created_by: userId,
        })
        .returning();

      const inst = row as typeof instanciaTable.$inferSelect;

      const prodRows = await tx
        .select({ nombre: productoTable.nombre, categoria_id: productoTable.categoria_id })
        .from(productoTable)
        .where(eq(productoTable.id, inst.producto_id))
        .limit(1);

      const prod = prodRows[0];

      return {
        id: inst.id,
        tenant_id: inst.tenant_id,
        cliente_id: inst.cliente_id,
        producto_id: inst.producto_id,
        ...(prod ? { producto_nombre: prod.nombre, categoria_id: prod.categoria_id } : {}),
        ...(inst.numero_serie != null ? { numero_serie: inst.numero_serie } : {}),
        activo: inst.activo,
        imagenes: [],
        created_at: inst.created_at,
        updated_at: inst.updated_at,
      };
    });
  }

  async listInstancias(
    tenantId: string,
    params: ListInstanciasParams
  ): Promise<ListInstanciasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(instanciaTable.tenant_id, tenantId),
        eq(instanciaTable.activo, true),
        // C008: solo equipos (componente_id IS NULL) deben aparecer en listado
        isNull(productoTable.componente_id),
      ];
      if (params.cliente_id) conditions.push(eq(instanciaTable.cliente_id, params.cliente_id));
      if (params.producto_id) conditions.push(eq(instanciaTable.producto_id, params.producto_id));

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx
          .select({ total: count() })
          .from(instanciaTable)
          .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
          .where(where),
        tx
          .select({
            instancia: instanciaTable,
            cliente_nombres: clienteTable.nombres,
            cliente_apellidos: clienteTable.apellidos,
            cliente_razon_social: clienteTable.razon_social,
            producto_nombre: productoTable.nombre,
            categoria_id: productoTable.categoria_id,
          })
          .from(instanciaTable)
          .leftJoin(clienteTable, eq(instanciaTable.cliente_id, clienteTable.id))
          .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
          .where(where)
          .orderBy(desc(instanciaTable.created_at))
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const instanciaIds = rows.map((r) => r.instancia.id);
      const imagenesRows =
        instanciaIds.length > 0
          ? await tx
              .select()
              .from(instanciaImagenTable)
              .where(inArray(instanciaImagenTable.instancia_id, instanciaIds))
          : [];

      const imagenesMap = new Map<string, InstanciaImagen[]>();
      for (const img of imagenesRows) {
        const list = imagenesMap.get(img.instancia_id) ?? [];
        list.push(mapInstanciaImagen(img));
        imagenesMap.set(img.instancia_id, list);
      }

      const items: Instancia[] = rows.map((r) => ({
        id: r.instancia.id,
        tenant_id: r.instancia.tenant_id,
        cliente_id: r.instancia.cliente_id,
        ...(clienteNombre(r.cliente_nombres, r.cliente_apellidos, r.cliente_razon_social) !==
        undefined
          ? {
              cliente_nombre: clienteNombre(
                r.cliente_nombres,
                r.cliente_apellidos,
                r.cliente_razon_social
              ),
            }
          : {}),
        producto_id: r.instancia.producto_id,
        ...(r.producto_nombre != null ? { producto_nombre: r.producto_nombre } : {}),
        ...(r.categoria_id != null ? { categoria_id: r.categoria_id } : {}),
        ...(r.instancia.numero_serie != null ? { numero_serie: r.instancia.numero_serie } : {}),
        activo: r.instancia.activo,
        imagenes: imagenesMap.get(r.instancia.id) ?? [],
        created_at: r.instancia.created_at,
        updated_at: r.instancia.updated_at,
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async addInstanciaImagen(
    tenantId: string,
    instanciaId: string,
    data: AddInstanciaImagenData
  ): Promise<InstanciaImagen> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const countRows = await tx
        .select({ total: count() })
        .from(instanciaImagenTable)
        .where(eq(instanciaImagenTable.instancia_id, instanciaId));

      if ((countRows[0]?.total ?? 0) >= 3) {
        throw new Error("Máximo 3 imágenes por instancia");
      }

      const orden = data.orden ?? (countRows[0]?.total ?? 0) + 1;

      const [row] = await tx
        .insert(instanciaImagenTable)
        .values({
          tenant_id: tenantId,
          instancia_id: instanciaId,
          url: data.url,
          ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
          orden,
        })
        .returning();

      return mapInstanciaImagen(row as typeof instanciaImagenTable.$inferSelect);
    });
  }

  // ─── Periféricos ─────────────────────────────────────────────────────────────

  async listPerifericos(tenantId: string, params: ListPerifericosParams): Promise<Periferico[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(perifericoTable.tenant_id, tenantId)];
      if (params.categoria_id)
        conditions.push(eq(perifericoTable.categoria_id, params.categoria_id));
      if (params.activo !== undefined) conditions.push(eq(perifericoTable.activo, params.activo));

      return tx
        .select()
        .from(perifericoTable)
        .where(and(...conditions))
        .orderBy(perifericoTable.nombre) as Promise<Periferico[]>;
    });
  }

  async createPeriferico(tenantId: string, data: CreatePerifericoData): Promise<Periferico> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .insert(perifericoTable)
        .values({ tenant_id: tenantId, categoria_id: data.categoria_id, nombre: data.nombre })
        .returning();

      return row as Periferico;
    });
  }

  async updatePeriferico(
    tenantId: string,
    id: string,
    data: UpdatePerifericoData
  ): Promise<Periferico | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const updates: Partial<typeof perifericoTable.$inferInsert> = {};
      if (data.nombre !== undefined) updates.nombre = data.nombre;
      if (data.activo !== undefined) updates.activo = data.activo;

      const [row] = await tx
        .update(perifericoTable)
        .set(updates)
        .where(and(eq(perifericoTable.id, id), eq(perifericoTable.tenant_id, tenantId)))
        .returning();

      return (row as Periferico | undefined) ?? null;
    });
  }

  // ─── Costos de revisión ───────────────────────────────────────────────────────

  async listCostosRevision(tenantId: string): Promise<CostoRevision[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          costo: costoRevisionTable,
          categoria_nombre: categoriaTable.nombre,
        })
        .from(costoRevisionTable)
        .leftJoin(categoriaTable, eq(costoRevisionTable.categoria_id, categoriaTable.id))
        .where(eq(costoRevisionTable.tenant_id, tenantId))
        .orderBy(categoriaTable.nombre);

      return rows.map((r) => mapCostoRevision(r.costo, r.categoria_nombre));
    });
  }

  async createCostoRevision(
    tenantId: string,
    data: CreateCostoRevisionData,
    userId: string
  ): Promise<CostoRevision> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .insert(costoRevisionTable)
        .values({
          tenant_id: tenantId,
          categoria_id: data.categoria_id,
          monto: String(data.monto),
          created_by: userId,
        })
        .returning();

      const catRows = await tx
        .select({ nombre: categoriaTable.nombre })
        .from(categoriaTable)
        .where(eq(categoriaTable.id, data.categoria_id))
        .limit(1);

      return mapCostoRevision(
        row as typeof costoRevisionTable.$inferSelect,
        catRows[0]?.nombre ?? null
      );
    });
  }

  async updateCostoRevision(
    tenantId: string,
    id: string,
    data: UpdateCostoRevisionData
  ): Promise<CostoRevision | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const updates: Partial<typeof costoRevisionTable.$inferInsert> = { updated_at: new Date() };
      if (data.monto !== undefined) updates.monto = String(data.monto);
      if (data.activo !== undefined) updates.activo = data.activo;

      const [row] = await tx
        .update(costoRevisionTable)
        .set(updates)
        .where(and(eq(costoRevisionTable.id, id), eq(costoRevisionTable.tenant_id, tenantId)))
        .returning();

      if (!row) return null;

      const catRows = await tx
        .select({ nombre: categoriaTable.nombre })
        .from(categoriaTable)
        .where(eq(categoriaTable.id, (row as typeof costoRevisionTable.$inferSelect).categoria_id))
        .limit(1);

      return mapCostoRevision(
        row as typeof costoRevisionTable.$inferSelect,
        catRows[0]?.nombre ?? null
      );
    });
  }

  // ─── Órdenes ──────────────────────────────────────────────────────────────────

  async createOrden(
    tenantId: string,
    data: CreateOrdenData,
    userId: string
  ): Promise<OrdenServicioResumen> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Get instancia → producto → categoria → costo_revision
      const instRows = await tx
        .select({
          inst: instanciaTable,
          prod_nombre: productoTable.nombre,
          prod_id: productoTable.id,
          cat_id: productoTable.categoria_id,
        })
        .from(instanciaTable)
        .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
        .where(
          and(eq(instanciaTable.id, data.instancia_id), eq(instanciaTable.tenant_id, tenantId))
        )
        .limit(1);

      const instRow = instRows[0];
      if (!instRow) throw new Error("Instancia no encontrada");

      const categoriaId = instRow.cat_id;
      let costoRevision = "0";

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

      const codigo = await generarCodigoOS(tx, tenantId);

      const [inserted] = await tx
        .insert(osTable)
        .values({
          tenant_id: tenantId,
          codigo,
          instancia_id: data.instancia_id,
          ...(data.sucursal_id !== undefined ? { sucursal_id: data.sucursal_id } : {}),
          canal: data.canal as (typeof osTable.canal)["_"]["data"],
          tipo_servicio: data.tipo_servicio as (typeof osTable.tipo_servicio)["_"]["data"],
          falla_ingreso: data.falla_ingreso,
          costo_revision: costoRevision,
          ...(data.visita_domicilio_id !== undefined
            ? { visita_domicilio_id: data.visita_domicilio_id }
            : {}),
          ...(data.lead_id !== undefined ? { lead_id: data.lead_id } : {}),
          created_by: userId,
        })
        .returning();

      const os = inserted as typeof osTable.$inferSelect;

      if (data.perifericos?.length) {
        await tx.insert(osPerifericoTable).values(
          data.perifericos.map((pid) => ({
            tenant_id: tenantId,
            orden_servicio_id: os.id,
            periferico_id: pid,
          }))
        );
      }

      // Get cliente info via instancia
      const clienteRows = await tx
        .select({
          nombres: clienteTable.nombres,
          apellidos: clienteTable.apellidos,
          razon_social: clienteTable.razon_social,
        })
        .from(clienteTable)
        .where(eq(clienteTable.id, instRow.inst.cliente_id))
        .limit(1);
      const cli = clienteRows[0];

      const nombre = cli ? clienteNombre(cli.nombres, cli.apellidos, cli.razon_social) : undefined;

      return {
        id: os.id,
        tenant_id: os.tenant_id,
        codigo: os.codigo,
        instancia_id: os.instancia_id,
        cliente_id: instRow.inst.cliente_id,
        ...(nombre !== undefined ? { cliente_nombre: nombre } : {}),
        producto_id: instRow.prod_id ?? data.instancia_id,
        ...(instRow.prod_nombre != null ? { producto_nombre: instRow.prod_nombre } : {}),
        ...(instRow.inst.numero_serie != null ? { numero_serie: instRow.inst.numero_serie } : {}),
        ...(os.sucursal_id != null ? { sucursal_id: os.sucursal_id } : {}),
        canal: os.canal,
        tipo_servicio: os.tipo_servicio,
        falla_ingreso: os.falla_ingreso,
        costo_revision: os.costo_revision,
        estado: os.estado,
        activo: os.activo,
        created_at: os.created_at,
        updated_at: os.updated_at,
      };
    });
  }

  async listOrdenes(tenantId: string, params: ListOrdenesParams): Promise<ListOrdenesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(osTable.tenant_id, tenantId), eq(osTable.activo, true)];

      if (params.estado)
        conditions.push(eq(osTable.estado, params.estado as (typeof osTable.estado)["_"]["data"]));
      if (params.canal)
        conditions.push(eq(osTable.canal, params.canal as (typeof osTable.canal)["_"]["data"]));
      if (params.tipo_servicio)
        conditions.push(
          eq(
            osTable.tipo_servicio,
            params.tipo_servicio as (typeof osTable.tipo_servicio)["_"]["data"]
          )
        );
      if (params.tecnico_id) conditions.push(eq(osTable.tecnico_id, params.tecnico_id));
      if (params.sucursal_id) conditions.push(eq(osTable.sucursal_id, params.sucursal_id));
      if (params.desde) conditions.push(gte(osTable.created_at, new Date(params.desde)));
      if (params.hasta) conditions.push(lte(osTable.created_at, new Date(params.hasta)));

      // Filter by cliente_id via instancia
      if (params.cliente_id) {
        const instanciaIds = await tx
          .select({ id: instanciaTable.id })
          .from(instanciaTable)
          .where(
            and(
              eq(instanciaTable.tenant_id, tenantId),
              eq(instanciaTable.cliente_id, params.cliente_id)
            )
          );
        const ids = instanciaIds.map((r) => r.id);
        if (ids.length === 0) return { items: [], total: 0 };
        conditions.push(inArray(osTable.instancia_id, ids));
      }

      if (params.search) {
        const term = `%${params.search}%`;
        const sc = or(ilike(osTable.codigo, term), ilike(osTable.falla_ingreso, term));
        if (sc) conditions.push(sc);
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
            producto_nombre: productoTable.nombre,
            numero_serie: instanciaTable.numero_serie,
            cliente_id: instanciaTable.cliente_id,
            producto_id: instanciaTable.producto_id,
            tecnico_nombres: usuarioTable.nombres,
            tecnico_apellidos: usuarioTable.apellidos,
            venta_estado: ventaTable.estado_pago,
          })
          .from(osTable)
          .leftJoin(instanciaTable, eq(osTable.instancia_id, instanciaTable.id))
          .leftJoin(clienteTable, eq(instanciaTable.cliente_id, clienteTable.id))
          .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
          .leftJoin(usuarioTable, eq(osTable.tecnico_id, usuarioTable.id))
          .leftJoin(ventaTable, eq(osTable.venta_id, ventaTable.id))
          .where(where)
          .orderBy(desc(osTable.created_at))
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: OrdenServicioResumen[] = rows.map((r) => {
        const nombre = clienteNombre(
          r.cliente_nombres,
          r.cliente_apellidos,
          r.cliente_razon_social
        );
        const tecNombre =
          r.tecnico_nombres != null
            ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
            : undefined;

        return {
          id: r.os.id,
          tenant_id: r.os.tenant_id,
          codigo: r.os.codigo,
          instancia_id: r.os.instancia_id,
          cliente_id: r.cliente_id ?? r.os.instancia_id,
          ...(nombre !== undefined ? { cliente_nombre: nombre } : {}),
          producto_id: r.producto_id ?? r.os.instancia_id,
          ...(r.producto_nombre != null ? { producto_nombre: r.producto_nombre } : {}),
          ...(r.numero_serie != null ? { numero_serie: r.numero_serie } : {}),
          ...(r.os.sucursal_id != null ? { sucursal_id: r.os.sucursal_id } : {}),
          canal: r.os.canal,
          tipo_servicio: r.os.tipo_servicio,
          falla_ingreso: r.os.falla_ingreso,
          costo_revision: r.os.costo_revision,
          estado: r.os.estado,
          ...(r.os.motivo_devolucion != null ? { motivo_devolucion: r.os.motivo_devolucion } : {}),
          ...(r.os.tecnico_id != null ? { tecnico_id: r.os.tecnico_id } : {}),
          ...(tecNombre !== undefined ? { tecnico_nombre: tecNombre } : {}),
          ...(r.os.venta_id != null ? { venta_id: r.os.venta_id } : {}),
          ...(r.venta_estado != null ? { venta_estado: r.venta_estado } : {}),
          activo: r.os.activo,
          created_at: r.os.created_at,
          updated_at: r.os.updated_at,
        };
      });

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async findOrdenById(tenantId: string, id: string): Promise<OrdenServicioDetalle | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          os: osTable,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
          cliente_id: instanciaTable.cliente_id,
          producto_id: instanciaTable.producto_id,
          producto_nombre: productoTable.nombre,
          numero_serie: instanciaTable.numero_serie,
          tecnico_nombres: usuarioTable.nombres,
          tecnico_apellidos: usuarioTable.apellidos,
          venta_estado: ventaTable.estado_pago,
        })
        .from(osTable)
        .leftJoin(instanciaTable, eq(osTable.instancia_id, instanciaTable.id))
        .leftJoin(clienteTable, eq(instanciaTable.cliente_id, clienteTable.id))
        .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
        .leftJoin(usuarioTable, eq(osTable.tecnico_id, usuarioTable.id))
        .leftJoin(ventaTable, eq(osTable.venta_id, ventaTable.id))
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      const r = rows[0];
      if (!r) return null;

      const [
        imagenes,
        componentesRows,
        cotizacionRows,
        evidenciasRows,
        skusRows,
        requerimientosRows,
        aceptacionesRows,
        historialRows,
        observacionesRows,
      ] = await Promise.all([
        tx
          .select()
          .from(instanciaImagenTable)
          .where(eq(instanciaImagenTable.instancia_id, r.os.instancia_id))
          .orderBy(instanciaImagenTable.orden),
        tx
          .select({ comp: osComponenteTable, nombre: componenteTable.nombre })
          .from(osComponenteTable)
          .leftJoin(componenteTable, eq(osComponenteTable.componente_id, componenteTable.id))
          .where(eq(osComponenteTable.orden_servicio_id, id))
          .orderBy(osComponenteTable.etapa),
        tx
          .select({
            item: osCotizacionTable,
            prod_nombre: productoTable.nombre,
            comp_nombre: componenteTable.nombre,
          })
          .from(osCotizacionTable)
          .leftJoin(productoTable, eq(osCotizacionTable.producto_id, productoTable.id))
          .leftJoin(componenteTable, eq(osCotizacionTable.componente_id, componenteTable.id))
          .where(eq(osCotizacionTable.orden_servicio_id, id)),
        tx
          .select()
          .from(osEvidenciaTable)
          .where(eq(osEvidenciaTable.orden_servicio_id, id))
          .orderBy(desc(osEvidenciaTable.created_at)),
        tx
          .select({ sku: osSkuTable, prod_nombre: productoTable.nombre })
          .from(osSkuTable)
          .leftJoin(productoTable, eq(osSkuTable.producto_id, productoTable.id))
          .where(eq(osSkuTable.orden_servicio_id, id))
          .orderBy(desc(osSkuTable.created_at)),
        tx
          .select({ req: osRequerimientoTable, prod_nombre: productoTable.nombre })
          .from(osRequerimientoTable)
          .leftJoin(productoTable, eq(osRequerimientoTable.producto_id, productoTable.id))
          .where(eq(osRequerimientoTable.orden_servicio_id, id))
          .orderBy(desc(osRequerimientoTable.created_at)),
        tx
          .select()
          .from(osAceptacionTable)
          .where(eq(osAceptacionTable.orden_servicio_id, id))
          .orderBy(osAceptacionTable.created_at),
        tx
          .select({
            h: osHistorialTable,
            u_nombres: usuarioTable.nombres,
            u_apellidos: usuarioTable.apellidos,
          })
          .from(osHistorialTable)
          .leftJoin(usuarioTable, eq(osHistorialTable.usuario_id, usuarioTable.id))
          .where(eq(osHistorialTable.orden_servicio_id, id))
          .orderBy(osHistorialTable.created_at),
        tx
          .select({
            ob: osObservacionTable,
            u_nombres: usuarioTable.nombres,
            u_apellidos: usuarioTable.apellidos,
          })
          .from(osObservacionTable)
          .leftJoin(usuarioTable, eq(osObservacionTable.usuario_id, usuarioTable.id))
          .where(eq(osObservacionTable.orden_servicio_id, id))
          .orderBy(osObservacionTable.created_at),
      ]);

      const nombre = clienteNombre(r.cliente_nombres, r.cliente_apellidos, r.cliente_razon_social);
      const tecNombre =
        r.tecnico_nombres != null
          ? `${r.tecnico_nombres} ${r.tecnico_apellidos ?? ""}`.trim()
          : undefined;

      const cotItems: CotizacionItemOrden[] = cotizacionRows.map((ci) => ({
        id: ci.item.id,
        orden_servicio_id: ci.item.orden_servicio_id,
        tipo_item: ci.item.tipo_item,
        ...(ci.item.producto_id != null ? { producto_id: ci.item.producto_id } : {}),
        ...(ci.prod_nombre != null ? { producto_nombre: ci.prod_nombre } : {}),
        ...(ci.item.componente_id != null ? { componente_id: ci.item.componente_id } : {}),
        ...(ci.comp_nombre != null ? { componente_nombre: ci.comp_nombre } : {}),
        ...(ci.item.descripcion_manual != null
          ? { descripcion_manual: ci.item.descripcion_manual }
          : {}),
        cantidad: ci.item.cantidad,
        precio_unitario: ci.item.precio_unitario,
        subtotal: ci.item.subtotal,
        es_preventivo: ci.item.es_preventivo,
        created_at: ci.item.created_at,
      }));

      const totalCorrectivo = cotItems
        .filter((i) => !i.es_preventivo)
        .reduce((acc, i) => acc + Number(i.subtotal), 0);
      const totalPreventivo = cotItems
        .filter((i) => i.es_preventivo)
        .reduce((acc, i) => acc + Number(i.subtotal), 0);

      return {
        id: r.os.id,
        tenant_id: r.os.tenant_id,
        codigo: r.os.codigo,
        instancia_id: r.os.instancia_id,
        cliente_id: r.cliente_id ?? r.os.instancia_id,
        ...(nombre !== undefined ? { cliente_nombre: nombre } : {}),
        producto_id: r.producto_id ?? r.os.instancia_id,
        ...(r.producto_nombre != null ? { producto_nombre: r.producto_nombre } : {}),
        ...(r.numero_serie != null ? { numero_serie: r.numero_serie } : {}),
        ...(r.os.sucursal_id != null ? { sucursal_id: r.os.sucursal_id } : {}),
        canal: r.os.canal,
        tipo_servicio: r.os.tipo_servicio,
        falla_ingreso: r.os.falla_ingreso,
        costo_revision: r.os.costo_revision,
        estado: r.os.estado,
        ...(r.os.motivo_devolucion != null ? { motivo_devolucion: r.os.motivo_devolucion } : {}),
        ...(r.os.tecnico_id != null ? { tecnico_id: r.os.tecnico_id } : {}),
        ...(tecNombre !== undefined ? { tecnico_nombre: tecNombre } : {}),
        ...(r.os.venta_id != null ? { venta_id: r.os.venta_id } : {}),
        ...(r.venta_estado != null ? { venta_estado: r.venta_estado } : {}),
        activo: r.os.activo,
        created_at: r.os.created_at,
        updated_at: r.os.updated_at,
        // Detail-only fields
        ...(r.os.diagnostico_tecnico != null
          ? { diagnostico_tecnico: r.os.diagnostico_tecnico }
          : {}),
        ...(r.os.solucion != null ? { solucion: r.os.solucion } : {}),
        ...(r.os.vendedor_id != null ? { vendedor_id: r.os.vendedor_id } : {}),
        ...(r.os.preventivo_accepted != null
          ? { preventivo_accepted: r.os.preventivo_accepted }
          : {}),
        ...(r.os.orden_padre_id != null ? { orden_padre_id: r.os.orden_padre_id } : {}),
        ...(r.os.visita_domicilio_id != null
          ? { visita_domicilio_id: r.os.visita_domicilio_id }
          : {}),
        ...(r.os.lead_id != null ? { lead_id: r.os.lead_id } : {}),
        imagenes_instancia: imagenes.map(mapInstanciaImagen),
        componentes: componentesRows.map((c) => ({
          id: c.comp.id,
          orden_servicio_id: c.comp.orden_servicio_id,
          componente_id: c.comp.componente_id,
          ...(c.nombre != null ? { componente_nombre: c.nombre } : {}),
          tipo_afectacion: c.comp.tipo_afectacion,
          tipo_accion: c.comp.tipo_accion,
          etapa: c.comp.etapa,
          created_at: c.comp.created_at,
        })),
        cotizacion: {
          items: cotItems,
          total_correctivo: totalCorrectivo.toFixed(2),
          total_preventivo: totalPreventivo.toFixed(2),
          total: (totalCorrectivo + totalPreventivo).toFixed(2),
        },
        evidencias: evidenciasRows.map((ev) => ({
          id: ev.id,
          orden_servicio_id: ev.orden_servicio_id,
          url: ev.url,
          ...(ev.etapa != null ? { etapa: ev.etapa } : {}),
          ...(ev.descripcion != null ? { descripcion: ev.descripcion } : {}),
          ...(ev.created_by != null ? { created_by: ev.created_by } : {}),
          created_at: ev.created_at,
        })),
        skus: skusRows.map((s) => ({
          id: s.sku.id,
          orden_servicio_id: s.sku.orden_servicio_id,
          lote_id: s.sku.lote_id,
          producto_id: s.sku.producto_id,
          ...(s.prod_nombre != null ? { producto_nombre: s.prod_nombre } : {}),
          cantidad: s.sku.cantidad,
          precio_presupuesto: s.sku.precio_presupuesto,
          estado: s.sku.estado,
          created_at: s.sku.created_at,
          updated_at: s.sku.updated_at,
        })),
        requerimientos: requerimientosRows.map((rq) => ({
          id: rq.req.id,
          orden_servicio_id: rq.req.orden_servicio_id,
          ...(rq.req.producto_id != null ? { producto_id: rq.req.producto_id } : {}),
          ...(rq.prod_nombre != null ? { producto_nombre: rq.prod_nombre } : {}),
          ...(rq.req.imagen_url != null ? { imagen_url: rq.req.imagen_url } : {}),
          descripcion: rq.req.descripcion,
          cantidad: rq.req.cantidad,
          ...(rq.req.observacion != null ? { observacion: rq.req.observacion } : {}),
          estado: rq.req.estado,
          created_at: rq.req.created_at,
          updated_at: rq.req.updated_at,
        })),
        aceptaciones: aceptacionesRows.map((ac) => ({
          id: ac.id,
          orden_servicio_id: ac.orden_servicio_id,
          tipo: ac.tipo,
          canal_aceptacion: ac.canal_aceptacion,
          accepted_at: ac.accepted_at,
          ...(ac.ip_address != null ? { ip_address: ac.ip_address } : {}),
          ...(ac.metodo_aceptacion != null ? { metodo_aceptacion: ac.metodo_aceptacion } : {}),
          ...(ac.approved_by != null ? { approved_by: ac.approved_by } : {}),
          ...(ac.preventivo_accepted != null
            ? { preventivo_accepted: ac.preventivo_accepted }
            : {}),
          created_at: ac.created_at,
        })),
        historial: historialRows.map((h) => ({
          id: h.h.id,
          orden_servicio_id: h.h.orden_servicio_id,
          estado_anterior: h.h.estado_anterior,
          estado_nuevo: h.h.estado_nuevo,
          usuario_id: h.h.usuario_id,
          ...(h.u_nombres != null
            ? {
                usuario_nombre: `${h.u_nombres} ${h.u_apellidos ?? ""}`.trim(),
              }
            : {}),
          ...(h.h.observacion != null ? { observacion: h.h.observacion } : {}),
          created_at: h.h.created_at,
        })),
        observaciones: observacionesRows.map((ob) => ({
          id: ob.ob.id,
          orden_servicio_id: ob.ob.orden_servicio_id,
          etapa: ob.ob.etapa,
          texto: ob.ob.texto,
          usuario_id: ob.ob.usuario_id,
          ...(ob.u_nombres != null
            ? {
                usuario_nombre: `${ob.u_nombres} ${ob.u_apellidos ?? ""}`.trim(),
              }
            : {}),
          created_at: ob.ob.created_at,
        })),
      };
    });
  }

  async updateOrden(
    tenantId: string,
    id: string,
    data: UpdateOrdenData
  ): Promise<OrdenServicioResumen | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const updates: Partial<typeof osTable.$inferInsert> = { updated_at: new Date() };
      if (data.tecnico_id !== undefined) updates.tecnico_id = data.tecnico_id;
      if (data.vendedor_id !== undefined) updates.vendedor_id = data.vendedor_id;
      if (data.diagnostico_tecnico !== undefined)
        updates.diagnostico_tecnico = data.diagnostico_tecnico;
      if (data.solucion !== undefined) updates.solucion = data.solucion;
      if (data.sucursal_id !== undefined) updates.sucursal_id = data.sucursal_id;

      const [updated] = await tx
        .update(osTable)
        .set(updates)
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)))
        .returning();

      if (!updated) return null;

      const detalle = await this.findOrdenById(tenantId, id);
      if (!detalle) return null;

      const {
        imagenes_instancia: _im,
        componentes: _co,
        cotizacion: _cot,
        evidencias: _ev,
        skus: _sk,
        requerimientos: _rq,
        aceptaciones: _ac,
        historial: _hi,
        observaciones: _ob,
        ...resumen
      } = detalle;
      return resumen;
    });
  }

  async updateEstadoOrden(
    tenantId: string,
    id: string,
    data: UpdateEstadoOrdenData
  ): Promise<UpdateEstadoResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Get current OS
      const osRows = await tx
        .select({
          os: osTable,
          cliente_id: instanciaTable.cliente_id,
          cat_id: productoTable.categoria_id,
        })
        .from(osTable)
        .leftJoin(instanciaTable, eq(osTable.instancia_id, instanciaTable.id))
        .leftJoin(productoTable, eq(instanciaTable.producto_id, productoTable.id))
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      const osRow = osRows[0];
      if (!osRow) throw new Error("Orden de servicio no encontrada");

      const os = osRow.os;
      const estadoActual = os.estado;

      // Validate transition
      const permitidas = TRANSICIONES[estadoActual] ?? [];
      if (!permitidas.includes(data.estado)) {
        throw new Error(`Transición inválida: ${estadoActual} → ${data.estado}`);
      }

      // R1: image required before leaving VALIDACION
      if (data.estado === "REVISION") {
        const imgCount = await tx
          .select({ total: count() })
          .from(instanciaImagenTable)
          .where(eq(instanciaImagenTable.instancia_id, os.instancia_id));
        if ((imgCount[0]?.total ?? 0) === 0) {
          throw new Error(
            "R1: La instancia debe tener al menos 1 imagen antes de pasar a REVISIÓN"
          );
        }

        // R2: aceptacion VALIDACION required
        const acpRows = await tx
          .select({ id: osAceptacionTable.id })
          .from(osAceptacionTable)
          .where(
            and(
              eq(osAceptacionTable.orden_servicio_id, id),
              eq(osAceptacionTable.tipo, "VALIDACION")
            )
          )
          .limit(1);
        if (acpRows.length === 0) {
          throw new Error("R2: Se requiere aceptación del cliente antes de pasar a REVISIÓN");
        }
      }

      // R12: venta pagada before ENTREGADO
      if (data.estado === "ENTREGADO") {
        if (!os.venta_id) {
          throw new Error("R12: No hay venta asociada a esta orden");
        }
        const ventaRows = await tx
          .select({ estado: ventaTable.estado_pago })
          .from(ventaTable)
          .where(eq(ventaTable.id, os.venta_id))
          .limit(1);
        if (ventaRows[0]?.estado !== "COMPLETADA") {
          throw new Error("R12: La venta debe estar PAGADA antes de entregar el equipo");
        }
      }

      let ventaId = os.venta_id;

      // R11: auto-create venta when AGREGAR_SKU → REPARADO/PRIORIDAD
      if (
        estadoActual === "AGREGAR_SKU" &&
        (data.estado === "REPARADO" || data.estado === "PRIORIDAD")
      ) {
        ventaId = await this._autoCrearVenta(tx, tenantId, id, os, osRow.cliente_id, data.userId);
      }

      // R13: auto-create venta for costo_revision when → DEVOLUCION
      if (data.estado === "DEVOLUCION") {
        ventaId = await this._autoCrearVentaDevolucion(
          tx,
          tenantId,
          id,
          os,
          osRow.cliente_id,
          data.userId
        );
      }

      const updates: Partial<typeof osTable.$inferInsert> = {
        estado: data.estado as (typeof osTable.estado)["_"]["data"],
        updated_at: new Date(),
      };
      if (ventaId !== null && ventaId !== os.venta_id) updates.venta_id = ventaId;
      if (data.motivo_devolucion !== undefined)
        updates.motivo_devolucion =
          data.motivo_devolucion as (typeof osTable.motivo_devolucion)["_"]["data"];

      await tx
        .update(osTable)
        .set(updates)
        .where(and(eq(osTable.id, id), eq(osTable.tenant_id, tenantId)));

      // Record in historial
      await tx.insert(osHistorialTable).values({
        tenant_id: tenantId,
        orden_servicio_id: id,
        estado_anterior: estadoActual,
        estado_nuevo: data.estado,
        usuario_id: data.userId,
        ...(data.observacion !== undefined ? { observacion: data.observacion } : {}),
      });

      return {
        estado_anterior: estadoActual,
        estado_nuevo: data.estado,
        orden_id: id,
        ...(ventaId !== null && ventaId !== os.venta_id && ventaId !== undefined
          ? { venta_id: ventaId }
          : {}),
      };
    });
  }

  private async _autoCrearVenta(
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
    tx: any,
    tenantId: string,
    ordenId: string,
    os: typeof osTable.$inferSelect,
    clienteId: string | null,
    userId: string
  ): Promise<string | null> {
    if (!os.sucursal_id) throw new Error("La orden requiere sucursal para generar la venta");

    const cajaRows = await tx
      .select({ id: cajaTable.id })
      .from(cajaTable)
      .where(
        and(
          eq(cajaTable.tenant_id, tenantId),
          eq(cajaTable.sucursal_id, os.sucursal_id),
          eq(cajaTable.estado, "ABIERTA")
        )
      )
      .limit(1);

    if (cajaRows.length === 0) {
      throw new Error("No hay caja abierta para la sucursal de esta orden");
    }
    const cajaId = cajaRows[0].id as string;

    // Get cotizacion items
    type CotRow = { item: typeof osCotizacionTable.$inferSelect; prod_nombre: string | null };
    const cotRows: CotRow[] = await tx
      .select({ item: osCotizacionTable, prod_nombre: productoTable.nombre })
      .from(osCotizacionTable)
      .leftJoin(productoTable, eq(osCotizacionTable.producto_id, productoTable.id))
      .where(eq(osCotizacionTable.orden_servicio_id, ordenId));

    const subtotal = cotRows.reduce((acc: number, r) => acc + Number(r.item.subtotal), 0);
    const igv = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + igv) * 100) / 100;

    const codigo = await generarCodigoVenta(tx, tenantId);

    const [nuevaVenta] = await tx
      .insert(ventaTable)
      .values({
        tenant_id: tenantId,
        codigo,
        caja_id: cajaId,
        sucursal_id: os.sucursal_id,
        ...(clienteId != null ? { cliente_id: clienteId } : {}),
        tipo_venta: "SERVICIO",
        orden_servicio_id: ordenId,
        subtotal: subtotal.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
        estado: "PENDIENTE",
        usuario_id: userId,
      })
      .returning({ id: ventaTable.id });

    if (!nuevaVenta) throw new Error("Error al crear la venta");

    const ventaId = (nuevaVenta as { id: string }).id;

    // Create venta items from cotizacion
    if (cotRows.length > 0) {
      await tx.insert(ventaItemTable).values(
        cotRows.map((r) => ({
          tenant_id: tenantId,
          venta_id: ventaId,
          ...(r.item.producto_id != null ? { producto_id: r.item.producto_id } : {}),
          descripcion:
            r.item.descripcion_manual ??
            (r.prod_nombre != null ? r.prod_nombre : "Servicio/Repuesto"),
          cantidad: r.item.cantidad,
          precio_unitario: r.item.precio_unitario,
          subtotal: r.item.subtotal,
        }))
      );
    }

    // Mark assigned SKUs as CONSUMIDO and create movimientos
    const skusRows: Array<typeof osSkuTable.$inferSelect> = await tx
      .select()
      .from(osSkuTable)
      .where(and(eq(osSkuTable.orden_servicio_id, ordenId), eq(osSkuTable.estado, "ASIGNADO")));

    if (skusRows.length > 0) {
      // Mark as consumed
      await tx
        .update(osSkuTable)
        .set({ estado: "CONSUMIDO", updated_at: new Date() })
        .where(and(eq(osSkuTable.orden_servicio_id, ordenId), eq(osSkuTable.estado, "ASIGNADO")));

      // Create SERVICIO movements
      await tx.insert(movimientoTable).values(
        skusRows.map((sku) => ({
          tenant_id: tenantId,
          producto_id: sku.producto_id,
          lote_id: sku.lote_id,
          sucursal_id: os.sucursal_id,
          tipo: "SERVICIO" as const,
          cantidad: -sku.cantidad,
          referencia_tipo: "orden_servicio",
          referencia_id: ordenId,
          usuario_id: userId,
        }))
      );
    }

    return ventaId;
  }

  private async _autoCrearVentaDevolucion(
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
    tx: any,
    tenantId: string,
    ordenId: string,
    os: typeof osTable.$inferSelect,
    clienteId: string | null,
    userId: string
  ): Promise<string | null> {
    if (!os.sucursal_id) return null;

    const cajaRows = await tx
      .select({ id: cajaTable.id })
      .from(cajaTable)
      .where(
        and(
          eq(cajaTable.tenant_id, tenantId),
          eq(cajaTable.sucursal_id, os.sucursal_id),
          eq(cajaTable.estado, "ABIERTA")
        )
      )
      .limit(1);

    if (cajaRows.length === 0) return null;
    const cajaId = cajaRows[0].id as string;

    const costoRevision = Number(os.costo_revision);
    const igv = Math.round(costoRevision * 0.18 * 100) / 100;
    const total = Math.round((costoRevision + igv) * 100) / 100;
    const codigo = await generarCodigoVenta(tx, tenantId);

    const [nuevaVenta] = await tx
      .insert(ventaTable)
      .values({
        tenant_id: tenantId,
        codigo,
        caja_id: cajaId,
        sucursal_id: os.sucursal_id,
        ...(clienteId != null ? { cliente_id: clienteId } : {}),
        tipo_venta: "REVISION_DEVOLUCION",
        orden_servicio_id: ordenId,
        subtotal: costoRevision.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
        estado: "PENDIENTE",
        usuario_id: userId,
      })
      .returning({ id: ventaTable.id });

    if (!nuevaVenta) return null;
    const ventaId = (nuevaVenta as { id: string }).id;

    await tx.insert(ventaItemTable).values({
      tenant_id: tenantId,
      venta_id: ventaId,
      descripcion: "Costo de revisión / diagnóstico",
      cantidad: 1,
      precio_unitario: costoRevision.toFixed(2),
      subtotal: costoRevision.toFixed(2),
    });

    return ventaId;
  }

  // ─── Componentes ──────────────────────────────────────────────────────────────

  async upsertComponentes(
    tenantId: string,
    ordenId: string,
    data: UpsertComponentesData,
    userId: string
  ): Promise<ComponenteOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Validate OS state
      const osRows = await tx
        .select({ estado: osTable.estado })
        .from(osTable)
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      const os = osRows[0];
      if (!os) throw new Error("Orden de servicio no encontrada");

      const estadosPermitidos = ["REVISION", "DIAG_PRELIMINAR", "DIAG_FINAL"];
      if (!estadosPermitidos.includes(os.estado)) {
        throw new Error(
          `Componentes solo pueden editarse en: ${estadosPermitidos.join(", ")}. Estado actual: ${os.estado}`
        );
      }

      // If in DIAG_FINAL and there's a cotizacion → invalidate it (PR2)
      if (os.estado === "DIAG_FINAL") {
        await tx.delete(osCotizacionTable).where(eq(osCotizacionTable.orden_servicio_id, ordenId));
      }

      // Delete existing components for this etapa and re-insert
      await tx
        .delete(osComponenteTable)
        .where(
          and(
            eq(osComponenteTable.orden_servicio_id, ordenId),
            eq(osComponenteTable.etapa, data.etapa as (typeof osComponenteTable.etapa)["_"]["data"])
          )
        );

      if (data.items.length > 0) {
        await tx.insert(osComponenteTable).values(
          data.items.map((item) => ({
            tenant_id: tenantId,
            orden_servicio_id: ordenId,
            componente_id: item.componente_id,
            tipo_afectacion:
              item.tipo_afectacion as (typeof osComponenteTable.tipo_afectacion)["_"]["data"],
            tipo_accion: item.tipo_accion as (typeof osComponenteTable.tipo_accion)["_"]["data"],
            etapa: item.etapa as (typeof osComponenteTable.etapa)["_"]["data"],
            created_by: userId,
          }))
        );
      }

      return this.listComponentes(tenantId, ordenId);
    });
  }

  async listComponentes(tenantId: string, ordenId: string): Promise<ComponenteOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({ comp: osComponenteTable, nombre: componenteTable.nombre })
        .from(osComponenteTable)
        .leftJoin(componenteTable, eq(osComponenteTable.componente_id, componenteTable.id))
        .where(eq(osComponenteTable.orden_servicio_id, ordenId))
        .orderBy(osComponenteTable.etapa);

      return rows.map((r) => ({
        id: r.comp.id,
        orden_servicio_id: r.comp.orden_servicio_id,
        componente_id: r.comp.componente_id,
        ...(r.nombre != null ? { componente_nombre: r.nombre } : {}),
        tipo_afectacion: r.comp.tipo_afectacion,
        tipo_accion: r.comp.tipo_accion,
        etapa: r.comp.etapa,
        created_at: r.comp.created_at,
      }));
    });
  }

  // ─── Cotización / Presupuesto ────────────────────────────────────────────────

  async buscarPresupuesto(
    tenantId: string,
    params: BuscarPresupuestoParams
  ): Promise<PresupuestoBusquedaResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Base filters: tenant, activo, tipo mapping, búsqueda libre, componente
      const tipoDb =
        params.tipo === "REPUESTO" ? "PRODUCTO" : params.tipo === "SERVICIO" ? "SERVICIO" : null;
      const baseConditions: Parameters<typeof and>[0][] = [
        eq(productoTable.tenant_id, tenantId),
        eq(productoTable.activo, true),
        ...(tipoDb
          ? [eq(productoTable.tipo, tipoDb as (typeof productoTable.tipo)["_"]["data"])]
          : []),
        ...(params.busqueda ? [ilike(productoTable.nombre, `%${params.busqueda}%`)] : []),
        ...(params.componente_id ? [eq(productoTable.componente_id, params.componente_id)] : []),
      ];

      // Alcance conditions: products are APPLICABLE to the device when their
      // alcance matches one of the device's attributes.
      const globalCond = or(isNull(productoTable.alcance), eq(productoTable.alcance, "GLOBAL"));
      const catCond = params.categoria_id
        ? and(
            eq(productoTable.alcance, "CATEGORIA"),
            eq(productoTable.categoria_id, params.categoria_id)
          )
        : undefined;
      const marcaCond = params.marca_id
        ? and(eq(productoTable.alcance, "MARCA"), eq(productoTable.marca_id, params.marca_id))
        : undefined;

      // Compat subquery: producto_ids compatible with the given modelo
      const compatSubq = params.modelo_id
        ? tx
            .select({ id: productoCompatTable.producto_id })
            .from(productoCompatTable)
            .where(eq(productoCompatTable.modelo_id, params.modelo_id))
        : null;
      const compatCond = compatSubq
        ? and(eq(productoTable.alcance, "COMPATIBILIDAD"), inArray(productoTable.id, compatSubq))
        : undefined;

      // Count per alcance type for the tabs
      const countWhere = (extra: Parameters<typeof and>[0]) =>
        tx
          .select({ n: count() })
          .from(productoTable)
          .leftJoin(componenteTable, eq(productoTable.componente_id, componenteTable.id))
          .where(and(...baseConditions, extra))
          .then((r) => r[0]?.n ?? 0);

      const [countComp, countMarca, countCat, countGlobal] = await Promise.all([
        compatCond ? countWhere(compatCond) : Promise.resolve(0),
        marcaCond ? countWhere(marcaCond) : Promise.resolve(0),
        catCond ? countWhere(catCond) : Promise.resolve(0),
        globalCond ? countWhere(globalCond) : Promise.resolve(0),
      ]);

      // Determine which tab/nivel to show
      const nivel =
        params.nivel ??
        (countComp > 0
          ? "COMPAT"
          : countMarca > 0
            ? "MARCA"
            : countCat > 0
              ? "CATEGORIA"
              : "GLOBAL");

      // Build WHERE for the selected nivel
      const nivelCond =
        nivel === "COMPAT" && compatCond
          ? compatCond
          : nivel === "MARCA" && marcaCond
            ? marcaCond
            : nivel === "CATEGORIA" && catCond
              ? catCond
              : globalCond;

      const pageSize = params.pageSize > 50 ? 50 : params.pageSize;
      const offset = (params.page - 1) * pageSize;

      type PresupuestoRow = {
        producto: typeof productoTable.$inferSelect;
        comp_nombre: string | null;
      };

      const buildItems = async (rows: PresupuestoRow[]): Promise<PresupuestoItem[]> => {
        if (rows.length === 0) return [];
        const productIds = rows.map((r) => r.producto.id);
        const stockRows = await tx
          .select({
            producto_id: movimientoTable.producto_id,
            stock: sum(movimientoTable.cantidad),
          })
          .from(movimientoTable)
          .where(
            and(
              eq(movimientoTable.tenant_id, tenantId),
              inArray(movimientoTable.producto_id, productIds)
            )
          )
          .groupBy(movimientoTable.producto_id);
        const stockMap = new Map<string, number>();
        for (const s of stockRows) stockMap.set(s.producto_id, Number(s.stock ?? 0));

        return rows.map((r) => {
          const stockTotal = stockMap.get(r.producto.id) ?? 0;
          return {
            id: r.producto.id,
            codigo: r.producto.codigo,
            nombre: r.producto.nombre,
            tipo: r.producto.tipo,
            categoria_id: r.producto.categoria_id,
            ...(r.producto.componente_id != null
              ? { componente_id: r.producto.componente_id }
              : {}),
            ...(r.comp_nombre != null ? { componente_nombre: r.comp_nombre } : {}),
            precio_venta: r.producto.precio_venta,
            stock_disponible: r.producto.tipo === "SERVICIO" || stockTotal > 0,
            stock_total: r.producto.tipo === "SERVICIO" ? 0 : stockTotal,
            nivel_alcance: r.producto.alcance ?? "GLOBAL",
          };
        });
      };

      const selectFields = { producto: productoTable, comp_nombre: componenteTable.nombre };
      const whereAll = and(...baseConditions, nivelCond);

      const [totalRows, rows] = await Promise.all([
        tx
          .select({ n: count() })
          .from(productoTable)
          .leftJoin(componenteTable, eq(productoTable.componente_id, componenteTable.id))
          .where(whereAll)
          .then((r) => r[0]?.n ?? 0),
        tx
          .select(selectFields)
          .from(productoTable)
          .leftJoin(componenteTable, eq(productoTable.componente_id, componenteTable.id))
          .where(whereAll)
          .orderBy(productoTable.nombre)
          .limit(pageSize)
          .offset(offset),
      ]);

      const items = await buildItems(rows);

      return {
        items,
        total: totalRows,
        counts: {
          compatibilidad: countComp,
          marca: countMarca,
          categoria: countCat,
          global: countGlobal,
        },
      };
    });
  }

  async registrarCotizacion(
    tenantId: string,
    ordenId: string,
    data: RegistrarCotizacionData
  ): Promise<CotizacionOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const osRows = await tx
        .select({ estado: osTable.estado })
        .from(osTable)
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      const os = osRows[0];
      if (!os) throw new Error("Orden no encontrada");
      if (os.estado !== "DIAG_FINAL") {
        throw new Error(`Cotización solo se registra en DIAG_FINAL. Estado actual: ${os.estado}`);
      }

      // Invalidate previous cotizacion (PR2)
      await tx.delete(osCotizacionTable).where(eq(osCotizacionTable.orden_servicio_id, ordenId));

      // Insert new items
      await tx.insert(osCotizacionTable).values(
        data.items.map((item) => ({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          tipo_item: item.tipo_item as (typeof osCotizacionTable.tipo_item)["_"]["data"],
          ...(item.producto_id !== undefined ? { producto_id: item.producto_id } : {}),
          ...(item.componente_id !== undefined ? { componente_id: item.componente_id } : {}),
          ...(item.descripcion_manual !== undefined
            ? { descripcion_manual: item.descripcion_manual }
            : {}),
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario.toFixed(2),
          subtotal: (item.cantidad * item.precio_unitario).toFixed(2),
          es_preventivo: item.es_preventivo,
        }))
      );

      // Advance estado to COTIZADO
      await tx
        .update(osTable)
        .set({ estado: "COTIZADO", updated_at: new Date() })
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)));

      await tx.insert(osHistorialTable).values({
        tenant_id: tenantId,
        orden_servicio_id: ordenId,
        estado_anterior: "DIAG_FINAL",
        estado_nuevo: "COTIZADO",
        usuario_id: "system",
      });

      return this.getOrdenCotizacion(tenantId, ordenId);
    });
  }

  async getOrdenCotizacion(tenantId: string, ordenId: string): Promise<CotizacionOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          item: osCotizacionTable,
          prod_nombre: productoTable.nombre,
          comp_nombre: componenteTable.nombre,
        })
        .from(osCotizacionTable)
        .leftJoin(productoTable, eq(osCotizacionTable.producto_id, productoTable.id))
        .leftJoin(componenteTable, eq(osCotizacionTable.componente_id, componenteTable.id))
        .where(eq(osCotizacionTable.orden_servicio_id, ordenId));

      const items: CotizacionItemOrden[] = rows.map((r) => ({
        id: r.item.id,
        orden_servicio_id: r.item.orden_servicio_id,
        tipo_item: r.item.tipo_item,
        ...(r.item.producto_id != null ? { producto_id: r.item.producto_id } : {}),
        ...(r.prod_nombre != null ? { producto_nombre: r.prod_nombre } : {}),
        ...(r.item.componente_id != null ? { componente_id: r.item.componente_id } : {}),
        ...(r.comp_nombre != null ? { componente_nombre: r.comp_nombre } : {}),
        ...(r.item.descripcion_manual != null
          ? { descripcion_manual: r.item.descripcion_manual }
          : {}),
        cantidad: r.item.cantidad,
        precio_unitario: r.item.precio_unitario,
        subtotal: r.item.subtotal,
        es_preventivo: r.item.es_preventivo,
        created_at: r.item.created_at,
      }));

      const totalCorrectivo = items
        .filter((i) => !i.es_preventivo)
        .reduce((acc, i) => acc + Number(i.subtotal), 0);
      const totalPreventivo = items
        .filter((i) => i.es_preventivo)
        .reduce((acc, i) => acc + Number(i.subtotal), 0);

      return {
        items,
        total_correctivo: totalCorrectivo.toFixed(2),
        total_preventivo: totalPreventivo.toFixed(2),
        total: (totalCorrectivo + totalPreventivo).toFixed(2),
      };
    });
  }

  // ─── Evidencias ───────────────────────────────────────────────────────────────

  async addEvidencia(
    tenantId: string,
    ordenId: string,
    data: AddEvidenciaData,
    userId: string
  ): Promise<EvidenciaOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const countRows = await tx
        .select({ total: count() })
        .from(osEvidenciaTable)
        .where(eq(osEvidenciaTable.orden_servicio_id, ordenId));

      if ((countRows[0]?.total ?? 0) >= 5) {
        throw new Error("Máximo 5 evidencias por orden de servicio");
      }

      const [row] = await tx
        .insert(osEvidenciaTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          url: data.url,
          ...(data.etapa !== undefined ? { etapa: data.etapa } : {}),
          ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
          created_by: userId,
        })
        .returning();

      const ev = row as typeof osEvidenciaTable.$inferSelect;
      return {
        id: ev.id,
        orden_servicio_id: ev.orden_servicio_id,
        url: ev.url,
        ...(ev.etapa != null ? { etapa: ev.etapa } : {}),
        ...(ev.descripcion != null ? { descripcion: ev.descripcion } : {}),
        created_by: userId,
        created_at: ev.created_at,
      };
    });
  }

  async listEvidencias(tenantId: string, ordenId: string): Promise<EvidenciaOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select()
        .from(osEvidenciaTable)
        .where(eq(osEvidenciaTable.orden_servicio_id, ordenId))
        .orderBy(desc(osEvidenciaTable.created_at));

      return rows.map((ev) => ({
        id: ev.id,
        orden_servicio_id: ev.orden_servicio_id,
        url: ev.url,
        ...(ev.etapa != null ? { etapa: ev.etapa } : {}),
        ...(ev.descripcion != null ? { descripcion: ev.descripcion } : {}),
        ...(ev.created_by != null ? { created_by: ev.created_by } : {}),
        created_at: ev.created_at,
      }));
    });
  }

  // ─── SKUs asignados ────────────────────────────────────────────────────────────

  async asignarSku(
    tenantId: string,
    ordenId: string,
    data: AsignarSkuData,
    userId: string
  ): Promise<SkuAsignadoOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Check OS state
      const osRows = await tx
        .select({ estado: osTable.estado })
        .from(osTable)
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      if (osRows[0]?.estado !== "AGREGAR_SKU") {
        throw new Error("SKUs solo pueden asignarse en estado AGREGAR_SKU");
      }

      // Check stock
      const stockRows = await tx
        .select({ stock: sum(movimientoTable.cantidad) })
        .from(movimientoTable)
        .where(
          and(eq(movimientoTable.tenant_id, tenantId), eq(movimientoTable.lote_id, data.lote_id))
        );

      const stock = Number(stockRows[0]?.stock ?? 0);
      if (stock < data.cantidad) {
        throw new Error(
          `Stock insuficiente en el lote. Disponible: ${stock}, requerido: ${data.cantidad}`
        );
      }

      const [row] = await tx
        .insert(osSkuTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          lote_id: data.lote_id,
          producto_id: data.producto_id,
          cantidad: data.cantidad,
          precio_presupuesto: data.precio_presupuesto.toFixed(2),
          created_by: userId,
        })
        .returning();

      const sku = row as typeof osSkuTable.$inferSelect;

      const prodRows = await tx
        .select({ nombre: productoTable.nombre })
        .from(productoTable)
        .where(eq(productoTable.id, data.producto_id))
        .limit(1);

      return {
        id: sku.id,
        orden_servicio_id: sku.orden_servicio_id,
        lote_id: sku.lote_id,
        producto_id: sku.producto_id,
        ...(prodRows[0]?.nombre != null ? { producto_nombre: prodRows[0].nombre } : {}),
        cantidad: sku.cantidad,
        precio_presupuesto: sku.precio_presupuesto,
        estado: sku.estado,
        created_at: sku.created_at,
        updated_at: sku.updated_at,
      };
    });
  }

  async deleteSku(tenantId: string, ordenId: string, skuId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const skuRows = await tx
        .select({ estado: osSkuTable.estado })
        .from(osSkuTable)
        .where(
          and(
            eq(osSkuTable.id, skuId),
            eq(osSkuTable.orden_servicio_id, ordenId),
            eq(osSkuTable.tenant_id, tenantId)
          )
        )
        .limit(1);

      const sku = skuRows[0];
      if (!sku) return false;

      if (sku.estado !== "ASIGNADO") {
        throw new Error("Solo se pueden eliminar SKUs en estado ASIGNADO");
      }

      await tx.delete(osSkuTable).where(eq(osSkuTable.id, skuId));
      return true;
    });
  }

  async listSkus(tenantId: string, ordenId: string): Promise<SkuAsignadoOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({ sku: osSkuTable, prod_nombre: productoTable.nombre })
        .from(osSkuTable)
        .leftJoin(productoTable, eq(osSkuTable.producto_id, productoTable.id))
        .where(eq(osSkuTable.orden_servicio_id, ordenId))
        .orderBy(desc(osSkuTable.created_at));

      return rows.map((r) => ({
        id: r.sku.id,
        orden_servicio_id: r.sku.orden_servicio_id,
        lote_id: r.sku.lote_id,
        producto_id: r.sku.producto_id,
        ...(r.prod_nombre != null ? { producto_nombre: r.prod_nombre } : {}),
        cantidad: r.sku.cantidad,
        precio_presupuesto: r.sku.precio_presupuesto,
        estado: r.sku.estado,
        created_at: r.sku.created_at,
        updated_at: r.sku.updated_at,
      }));
    });
  }

  // ─── Requerimientos ────────────────────────────────────────────────────────────

  async createRequerimiento(
    tenantId: string,
    ordenId: string,
    data: CreateRequerimientoData,
    userId: string
  ): Promise<RequerimientoOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Auto-determine estado based on stock
      let estadoInicial: "PENDIENTE" | "ATENDIDO" = "PENDIENTE";

      if (data.producto_id) {
        const stockRows = await tx
          .select({ stock: sum(movimientoTable.cantidad) })
          .from(movimientoTable)
          .where(
            and(
              eq(movimientoTable.tenant_id, tenantId),
              eq(movimientoTable.producto_id, data.producto_id)
            )
          );
        const stock = Number(stockRows[0]?.stock ?? 0);
        if (stock >= data.cantidad) {
          estadoInicial = "ATENDIDO";
        }
      }

      const [row] = await tx
        .insert(osRequerimientoTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          ...(data.producto_id !== undefined ? { producto_id: data.producto_id } : {}),
          ...(data.imagen_url !== undefined ? { imagen_url: data.imagen_url } : {}),
          descripcion: data.descripcion,
          cantidad: data.cantidad,
          ...(data.observacion !== undefined ? { observacion: data.observacion } : {}),
          estado: estadoInicial,
          created_by: userId,
        })
        .returning();

      const req = row as typeof osRequerimientoTable.$inferSelect;

      let prodNombre: string | undefined;
      if (data.producto_id) {
        const prodRows = await tx
          .select({ nombre: productoTable.nombre })
          .from(productoTable)
          .where(eq(productoTable.id, data.producto_id))
          .limit(1);
        prodNombre = prodRows[0]?.nombre;
      }

      return {
        id: req.id,
        orden_servicio_id: req.orden_servicio_id,
        ...(req.producto_id != null ? { producto_id: req.producto_id } : {}),
        ...(prodNombre !== undefined ? { producto_nombre: prodNombre } : {}),
        ...(req.imagen_url != null ? { imagen_url: req.imagen_url } : {}),
        descripcion: req.descripcion,
        cantidad: req.cantidad,
        ...(req.observacion != null ? { observacion: req.observacion } : {}),
        estado: req.estado,
        created_at: req.created_at,
        updated_at: req.updated_at,
      };
    });
  }

  async listRequerimientos(tenantId: string, ordenId: string): Promise<RequerimientoOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({ req: osRequerimientoTable, prod_nombre: productoTable.nombre })
        .from(osRequerimientoTable)
        .leftJoin(productoTable, eq(osRequerimientoTable.producto_id, productoTable.id))
        .where(eq(osRequerimientoTable.orden_servicio_id, ordenId))
        .orderBy(desc(osRequerimientoTable.created_at));

      return rows.map((r) => ({
        id: r.req.id,
        orden_servicio_id: r.req.orden_servicio_id,
        ...(r.req.producto_id != null ? { producto_id: r.req.producto_id } : {}),
        ...(r.prod_nombre != null ? { producto_nombre: r.prod_nombre } : {}),
        ...(r.req.imagen_url != null ? { imagen_url: r.req.imagen_url } : {}),
        descripcion: r.req.descripcion,
        cantidad: r.req.cantidad,
        ...(r.req.observacion != null ? { observacion: r.req.observacion } : {}),
        estado: r.req.estado,
        created_at: r.req.created_at,
        updated_at: r.req.updated_at,
      }));
    });
  }

  async updateRequerimientoEstado(
    tenantId: string,
    id: string,
    data: UpdateRequerimientoEstadoData
  ): Promise<RequerimientoOrden | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .update(osRequerimientoTable)
        .set({
          estado: data.estado as (typeof osRequerimientoTable.estado)["_"]["data"],
          updated_at: new Date(),
        })
        .where(and(eq(osRequerimientoTable.id, id), eq(osRequerimientoTable.tenant_id, tenantId)))
        .returning();

      if (!row) return null;

      const req = row as typeof osRequerimientoTable.$inferSelect;
      let prodNombre: string | undefined;

      if (req.producto_id) {
        const prodRows = await tx
          .select({ nombre: productoTable.nombre })
          .from(productoTable)
          .where(eq(productoTable.id, req.producto_id))
          .limit(1);
        prodNombre = prodRows[0]?.nombre;
      }

      return {
        id: req.id,
        orden_servicio_id: req.orden_servicio_id,
        ...(req.producto_id != null ? { producto_id: req.producto_id } : {}),
        ...(prodNombre !== undefined ? { producto_nombre: prodNombre } : {}),
        ...(req.imagen_url != null ? { imagen_url: req.imagen_url } : {}),
        descripcion: req.descripcion,
        cantidad: req.cantidad,
        ...(req.observacion != null ? { observacion: req.observacion } : {}),
        estado: req.estado,
        created_at: req.created_at,
        updated_at: req.updated_at,
      };
    });
  }

  // ─── Aceptaciones ──────────────────────────────────────────────────────────────

  async registrarAceptacion(
    tenantId: string,
    ordenId: string,
    data: RegistrarAceptacionData
  ): Promise<RegistrarAceptacionResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const osRows = await tx
        .select({ estado: osTable.estado, instancia_id: osTable.instancia_id })
        .from(osTable)
        .where(and(eq(osTable.id, ordenId), eq(osTable.tenant_id, tenantId)))
        .limit(1);

      const os = osRows[0];
      if (!os) throw new Error("Orden de servicio no encontrada");

      // Validate password for manual channels
      const isManual =
        data.canal_aceptacion === "MANUAL_TIENDA" || data.canal_aceptacion === "MANUAL_WHATSAPP";

      if (isManual) {
        if (!data.password) throw new Error("Contraseña requerida para aceptación manual");

        if (data.canal_aceptacion === "MANUAL_WHATSAPP" && !data.evidence_image_url) {
          throw new Error("R16: La aceptación por WhatsApp requiere imagen de evidencia");
        }

        // Validate vendedor password
        const userRows = await tx
          .select({ password_hash: usuarioTable.password_hash })
          .from(usuarioTable)
          .where(and(eq(usuarioTable.id, data.userId), eq(usuarioTable.tenant_id, tenantId)))
          .limit(1);

        const userRow = userRows[0] as { password_hash: string } | undefined;
        if (!userRow) throw new Error("Usuario no encontrado");

        const valid = await bcrypt.compare(data.password, userRow.password_hash);
        if (!valid) throw new Error("R15: Contraseña incorrecta");
      }

      // Check for R1 if tipo is VALIDACION
      if (data.tipo === "VALIDACION") {
        const imgCount = await tx
          .select({ total: count() })
          .from(instanciaImagenTable)
          .where(eq(instanciaImagenTable.instancia_id, os.instancia_id));

        if ((imgCount[0]?.total ?? 0) === 0) {
          throw new Error("R1: La instancia debe tener al menos 1 imagen antes de validar");
        }
      }

      const [row] = await tx
        .insert(osAceptacionTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          tipo: data.tipo as (typeof osAceptacionTable.tipo)["_"]["data"],
          canal_aceptacion:
            data.canal_aceptacion as (typeof osAceptacionTable.canal_aceptacion)["_"]["data"],
          accepted_at: new Date(),
          ...(data.ip_address !== undefined ? { ip_address: data.ip_address } : {}),
          ...(data.documento_version !== undefined
            ? { documento_version: data.documento_version }
            : {}),
          ...(data.texto_mostrado !== undefined ? { texto_mostrado: data.texto_mostrado } : {}),
          ...(data.metodo_aceptacion !== undefined
            ? {
                metodo_aceptacion:
                  data.metodo_aceptacion as (typeof osAceptacionTable.metodo_aceptacion)["_"]["data"],
              }
            : {}),
          ...(isManual ? { approved_by: data.userId } : {}),
          ...(data.manual_reason !== undefined ? { manual_reason: data.manual_reason } : {}),
          ...(data.evidence_image_url !== undefined
            ? { evidence_image_url: data.evidence_image_url }
            : {}),
          ...(data.preventivo_accepted !== undefined
            ? { preventivo_accepted: data.preventivo_accepted }
            : {}),
        })
        .returning({ id: osAceptacionTable.id });

      const aceptacionId = (row as { id: string }).id;

      // Auto-advance state
      let estadoNuevo = os.estado;

      if (data.tipo === "VALIDACION" && os.estado === "VALIDACION") {
        estadoNuevo = "REVISION";
      } else if (data.tipo === "PRESUPUESTO" && os.estado === "COTIZADO") {
        estadoNuevo = "APROBADO";
        if (data.preventivo_accepted !== undefined) {
          await tx
            .update(osTable)
            .set({ preventivo_accepted: data.preventivo_accepted })
            .where(eq(osTable.id, ordenId));
        }
      }

      if (estadoNuevo !== os.estado) {
        await tx
          .update(osTable)
          .set({
            estado: estadoNuevo as (typeof osTable.estado)["_"]["data"],
            updated_at: new Date(),
          })
          .where(eq(osTable.id, ordenId));

        await tx.insert(osHistorialTable).values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          estado_anterior: os.estado,
          estado_nuevo: estadoNuevo,
          usuario_id: data.userId,
          observacion: `Aceptación ${data.tipo} via ${data.canal_aceptacion}`,
        });
      }

      return { aceptacion_id: aceptacionId, estado_nuevo: estadoNuevo };
    });
  }

  // ─── Historial ─────────────────────────────────────────────────────────────────

  async listHistorial(tenantId: string, ordenId: string): Promise<HistorialOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          h: osHistorialTable,
          u_nombres: usuarioTable.nombres,
          u_apellidos: usuarioTable.apellidos,
        })
        .from(osHistorialTable)
        .leftJoin(usuarioTable, eq(osHistorialTable.usuario_id, usuarioTable.id))
        .where(eq(osHistorialTable.orden_servicio_id, ordenId))
        .orderBy(osHistorialTable.created_at);

      return rows.map((r) => ({
        id: r.h.id,
        orden_servicio_id: r.h.orden_servicio_id,
        estado_anterior: r.h.estado_anterior,
        estado_nuevo: r.h.estado_nuevo,
        usuario_id: r.h.usuario_id,
        ...(r.u_nombres != null
          ? { usuario_nombre: `${r.u_nombres} ${r.u_apellidos ?? ""}`.trim() }
          : {}),
        ...(r.h.observacion != null ? { observacion: r.h.observacion } : {}),
        created_at: r.h.created_at,
      }));
    });
  }

  // ─── Observaciones ──────────────────────────────────────────────────────────────

  async addObservacion(
    tenantId: string,
    ordenId: string,
    data: AddObservacionData,
    userId: string
  ): Promise<ObservacionOrden> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [row] = await tx
        .insert(osObservacionTable)
        .values({
          tenant_id: tenantId,
          orden_servicio_id: ordenId,
          etapa: data.etapa,
          texto: data.texto,
          usuario_id: userId,
        })
        .returning();

      const ob = row as typeof osObservacionTable.$inferSelect;

      const uRows = await tx
        .select({ nombres: usuarioTable.nombres, apellidos: usuarioTable.apellidos })
        .from(usuarioTable)
        .where(eq(usuarioTable.id, userId))
        .limit(1);

      const u = uRows[0];

      return {
        id: ob.id,
        orden_servicio_id: ob.orden_servicio_id,
        etapa: ob.etapa,
        texto: ob.texto,
        usuario_id: ob.usuario_id,
        ...(u ? { usuario_nombre: `${u.nombres} ${u.apellidos ?? ""}`.trim() } : {}),
        created_at: ob.created_at,
      };
    });
  }

  async listObservaciones(tenantId: string, ordenId: string): Promise<ObservacionOrden[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          ob: osObservacionTable,
          u_nombres: usuarioTable.nombres,
          u_apellidos: usuarioTable.apellidos,
        })
        .from(osObservacionTable)
        .leftJoin(usuarioTable, eq(osObservacionTable.usuario_id, usuarioTable.id))
        .where(eq(osObservacionTable.orden_servicio_id, ordenId))
        .orderBy(osObservacionTable.created_at);

      return rows.map((r) => ({
        id: r.ob.id,
        orden_servicio_id: r.ob.orden_servicio_id,
        etapa: r.ob.etapa,
        texto: r.ob.texto,
        usuario_id: r.ob.usuario_id,
        ...(r.u_nombres != null
          ? { usuario_nombre: `${r.u_nombres} ${r.u_apellidos ?? ""}`.trim() }
          : {}),
        created_at: r.ob.created_at,
      }));
    });
  }
}
