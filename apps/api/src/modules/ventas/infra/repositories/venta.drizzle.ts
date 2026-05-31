import type { DbClient } from "@kallpasoft/db";
import {
  cliente as clienteTable,
  metodoPagoCatalogo as metodoPagoCatalogoTable,
  movimientoInventario as movimientoTable,
  usuario as usuarioTable,
  ventaEnvio as ventaEnvioTable,
  ventaItem as ventaItemTable,
  ventaPago as ventaPagoTable,
  venta as ventaTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, ilike, lte, or, sql, sum } from "drizzle-orm";
import type {
  Venta,
  VentaDetalle,
  VentaEnvio,
  VentaItem,
  VentaPago,
} from "../../domain/entities/venta.js";
import type {
  AddVentaPagoData,
  CreateVentaData,
  CreateVentaEnvioData,
  IVentaRepository,
  ListVentasParams,
  ListVentasResult,
} from "../../domain/ports/venta.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigoVenta(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM venta WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `V-${String(n).padStart(4, "0")}`;
}

async function calcularEstadoPago(
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
  tx: any,
  tenantId: string,
  ventaId: string,
  totalVenta: number
): Promise<string> {
  const rows = await tx
    .select({ total: sum(ventaPagoTable.monto) })
    .from(ventaPagoTable)
    .where(and(eq(ventaPagoTable.venta_id, ventaId), eq(ventaPagoTable.tenant_id, tenantId)));
  const pagado = Number(rows[0]?.total ?? 0);
  if (pagado >= totalVenta) return "PAGADA";
  if (pagado > 0) return "PARCIAL";
  return "PENDIENTE";
}

export class VentaDrizzleRepository implements IVentaRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListVentasParams): Promise<ListVentasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(ventaTable.tenant_id, tenantId), eq(ventaTable.activo, true)];
      if (params.tipo_venta) {
        conditions.push(
          eq(
            ventaTable.tipo_venta,
            params.tipo_venta as (typeof ventaTable.tipo_venta)["_"]["data"]
          )
        );
      }
      if (params.estado) {
        conditions.push(
          eq(ventaTable.estado, params.estado as (typeof ventaTable.estado)["_"]["data"])
        );
      }
      if (params.caja_id) conditions.push(eq(ventaTable.caja_id, params.caja_id));
      if (params.cliente_id) conditions.push(eq(ventaTable.cliente_id, params.cliente_id));
      if (params.desde) conditions.push(gte(ventaTable.created_at, new Date(params.desde)));
      if (params.hasta) conditions.push(lte(ventaTable.created_at, new Date(params.hasta)));
      if (params.search) {
        const term = `%${params.search}%`;
        const cond = or(ilike(ventaTable.codigo, term), ilike(ventaTable.notas, term));
        if (cond) conditions.push(cond);
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(ventaTable).where(where),
        tx
          .select({
            venta: ventaTable,
            cliente_nombres: clienteTable.nombres,
            cliente_apellidos: clienteTable.apellidos,
            cliente_razon_social: clienteTable.razon_social,
            usuario_nombres: usuarioTable.nombres,
            usuario_apellidos: usuarioTable.apellidos,
          })
          .from(ventaTable)
          .leftJoin(clienteTable, eq(ventaTable.cliente_id, clienteTable.id))
          .leftJoin(usuarioTable, eq(ventaTable.usuario_id, usuarioTable.id))
          .where(where)
          .orderBy(ventaTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: Venta[] = rows.map((r) => ({
        ...(r.venta as Venta),
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<VentaDetalle | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          venta: ventaTable,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
          usuario_nombres: usuarioTable.nombres,
          usuario_apellidos: usuarioTable.apellidos,
        })
        .from(ventaTable)
        .leftJoin(clienteTable, eq(ventaTable.cliente_id, clienteTable.id))
        .leftJoin(usuarioTable, eq(ventaTable.usuario_id, usuarioTable.id))
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)));

      if (!rows[0]) return null;
      const r = rows[0];

      const [items, pagos, envioRows] = await Promise.all([
        tx
          .select()
          .from(ventaItemTable)
          .where(and(eq(ventaItemTable.venta_id, id), eq(ventaItemTable.tenant_id, tenantId)))
          .orderBy(ventaItemTable.created_at),
        tx
          .select({ pago: ventaPagoTable, metodo_nombre: metodoPagoCatalogoTable.nombre })
          .from(ventaPagoTable)
          .leftJoin(
            metodoPagoCatalogoTable,
            eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
          )
          .where(and(eq(ventaPagoTable.venta_id, id), eq(ventaPagoTable.tenant_id, tenantId)))
          .orderBy(ventaPagoTable.created_at),
        tx
          .select()
          .from(ventaEnvioTable)
          .where(and(eq(ventaEnvioTable.venta_id, id), eq(ventaEnvioTable.tenant_id, tenantId)))
          .limit(1),
      ]);

      return {
        ...(r.venta as Venta),
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
        items: items as VentaItem[],
        pagos: pagos.map((p) => ({
          ...(p.pago as VentaPago),
          metodo_nombre: p.metodo_nombre ?? undefined,
        })),
        envio: (envioRows[0] as VentaEnvio) ?? null,
      };
    });
  }

  async create(tenantId: string, data: CreateVentaData): Promise<Venta> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await generarCodigoVenta(tx, tenantId);

      const subtotal = data.items.reduce((acc, it) => {
        const itemSubtotal = it.cantidad * it.precio_unitario - (it.descuento ?? 0);
        return acc + itemSubtotal;
      }, 0);
      const descuentoTotal = data.items.reduce((acc, it) => acc + (it.descuento ?? 0), 0);
      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      const ventaRows = await tx
        .insert(ventaTable)
        .values({
          tenant_id: tenantId,
          codigo,
          caja_id: data.caja_id,
          sucursal_id: data.sucursal_id,
          cliente_id: data.cliente_id ?? null,
          tipo_venta: (data.tipo_venta ?? "LIBRE") as (typeof ventaTable.tipo_venta)["_"]["data"],
          orden_servicio_id: data.orden_servicio_id ?? null,
          visita_domicilio_id: data.visita_domicilio_id ?? null,
          subtotal: subtotal.toFixed(2),
          descuento: descuentoTotal.toFixed(2),
          igv: igv.toFixed(2),
          total: total.toFixed(2),
          estado: "PENDIENTE",
          tipo_comprobante:
            (data.tipo_comprobante as (typeof ventaTable.tipo_comprobante)["_"]["data"]) ?? null,
          usuario_id: data.usuario_id,
          notas: data.notas ?? null,
        })
        .returning();

      const ventaCreada = ventaRows[0] as Venta;

      await tx.insert(ventaItemTable).values(
        data.items.map((it) => ({
          tenant_id: tenantId,
          venta_id: ventaCreada.id,
          producto_id: it.producto_id ?? null,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: String(it.precio_unitario),
          descuento: String(it.descuento ?? 0),
          subtotal: (it.cantidad * it.precio_unitario - (it.descuento ?? 0)).toFixed(2),
        }))
      );

      // Generar movimientos de stock para items con producto_id
      const itemsConProducto = data.items.filter((it) => it.producto_id);
      if (itemsConProducto.length > 0) {
        await tx.insert(movimientoTable).values(
          itemsConProducto.map((it) => ({
            tenant_id: tenantId,
            producto_id: it.producto_id as string,
            sucursal_id: data.sucursal_id,
            tipo: "VENTA" as const,
            cantidad: -it.cantidad,
            referencia_tipo: "venta",
            referencia_id: ventaCreada.id,
            usuario_id: data.usuario_id,
          }))
        );
      }

      return ventaCreada;
    });
  }

  async anular(
    tenantId: string,
    id: string,
    motivo: string,
    usuarioId: string
  ): Promise<Venta | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ventaRows = await tx
        .select()
        .from(ventaTable)
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)));
      const ventaActual = ventaRows[0] as Venta | undefined;
      if (!ventaActual) return null;

      if (ventaActual.estado === "ANULADA") {
        throw new Error("La venta ya está anulada");
      }

      // Revertir movimientos de stock
      const items = await tx
        .select()
        .from(ventaItemTable)
        .where(and(eq(ventaItemTable.venta_id, id), eq(ventaItemTable.tenant_id, tenantId)));

      const itemsConProducto = (items as VentaItem[]).filter((it) => it.producto_id);
      if (itemsConProducto.length > 0) {
        await tx.insert(movimientoTable).values(
          itemsConProducto.map((it) => ({
            tenant_id: tenantId,
            producto_id: it.producto_id as string,
            sucursal_id: ventaActual.sucursal_id,
            tipo: "REAJUSTE" as const,
            cantidad: it.cantidad,
            referencia_tipo: "anulacion_venta",
            referencia_id: id,
            notas: motivo,
            usuario_id: usuarioId,
          }))
        );
      }

      const rows = await tx
        .update(ventaTable)
        .set({
          estado: "ANULADA",
          activo: false,
          notas: `ANULADA: ${motivo}`,
          updated_at: new Date(),
        })
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)))
        .returning();

      return (rows[0] as Venta) ?? null;
    });
  }

  async listPagos(tenantId: string, ventaId: string): Promise<VentaPago[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select({ pago: ventaPagoTable, metodo_nombre: metodoPagoCatalogoTable.nombre })
        .from(ventaPagoTable)
        .leftJoin(
          metodoPagoCatalogoTable,
          eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
        )
        .where(and(eq(ventaPagoTable.venta_id, ventaId), eq(ventaPagoTable.tenant_id, tenantId)))
        .orderBy(ventaPagoTable.created_at);
      return rows.map((r) => ({
        ...(r.pago as VentaPago),
        metodo_nombre: r.metodo_nombre ?? undefined,
      }));
    });
  }

  async addPago(tenantId: string, ventaId: string, data: AddVentaPagoData): Promise<VentaPago> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ventaRows = await tx
        .select({ total: ventaTable.total, estado: ventaTable.estado })
        .from(ventaTable)
        .where(and(eq(ventaTable.id, ventaId), eq(ventaTable.tenant_id, tenantId)));
      const venta = ventaRows[0];
      if (!venta) throw new Error("Venta no encontrada");

      const rows = await tx
        .insert(ventaPagoTable)
        .values({
          tenant_id: tenantId,
          venta_id: ventaId,
          metodo_pago_id: data.metodo_pago_id,
          monto: String(data.monto),
          referencia: data.referencia ?? null,
        })
        .returning();

      const nuevoEstado = await calcularEstadoPago(tx, tenantId, ventaId, Number(venta.total));
      await tx
        .update(ventaTable)
        .set({
          estado: nuevoEstado as (typeof ventaTable.estado)["_"]["data"],
          updated_at: new Date(),
        })
        .where(and(eq(ventaTable.id, ventaId), eq(ventaTable.tenant_id, tenantId)));

      return rows[0] as VentaPago;
    });
  }

  async getEnvio(tenantId: string, ventaId: string): Promise<VentaEnvio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select()
        .from(ventaEnvioTable)
        .where(and(eq(ventaEnvioTable.venta_id, ventaId), eq(ventaEnvioTable.tenant_id, tenantId)))
        .limit(1);
      return (rows[0] as VentaEnvio) ?? null;
    });
  }

  async createEnvio(
    tenantId: string,
    ventaId: string,
    data: CreateVentaEnvioData
  ): Promise<VentaEnvio> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(ventaEnvioTable)
        .values({
          tenant_id: tenantId,
          venta_id: ventaId,
          direccion_id: data.direccion_id ?? null,
          direccion_texto: data.direccion_texto,
          costo_envio: String(data.costo_envio ?? 0),
          notas: data.notas ?? null,
          estado: "PENDIENTE",
        })
        .returning();
    });
    return rows[0] as VentaEnvio;
  }

  async updateEnvioEstado(
    tenantId: string,
    ventaId: string,
    estado: string
  ): Promise<VentaEnvio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const setValues: Partial<typeof ventaEnvioTable.$inferInsert> = {
        estado,
        updated_at: new Date(),
      };
      if (estado === "EN_CAMINO") setValues.fecha_envio = new Date();
      if (estado === "ENTREGADO") setValues.fecha_entrega = new Date();

      const rows = await tx
        .update(ventaEnvioTable)
        .set(setValues)
        .where(and(eq(ventaEnvioTable.venta_id, ventaId), eq(ventaEnvioTable.tenant_id, tenantId)))
        .returning();
      return (rows[0] as VentaEnvio) ?? null;
    });
  }

  async listEnvios(
    tenantId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: VentaEnvio[]; total: number }> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const where = eq(ventaEnvioTable.tenant_id, tenantId);
      const offset = (params.page - 1) * params.pageSize;
      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(ventaEnvioTable).where(where),
        tx
          .select()
          .from(ventaEnvioTable)
          .where(where)
          .orderBy(ventaEnvioTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);
      return { items: rows as VentaEnvio[], total: countRows[0]?.total ?? 0 };
    });
  }
}
