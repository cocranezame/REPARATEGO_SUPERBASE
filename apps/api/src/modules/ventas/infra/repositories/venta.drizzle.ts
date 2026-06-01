import type { DbClient } from "@kallpasoft/db";
import {
  caja as cajaTable,
  cliente as clienteTable,
  instancia as instanciaTable,
  lote as loteTable,
  metodoPagoCatalogo as metodoPagoCatalogoTable,
  movimientoInventario as movimientoTable,
  ordenServicio as ordenServicioTable,
  usuario as usuarioTable,
  ventaEnvio as ventaEnvioTable,
  ventaItem as ventaItemTable,
  ventaPago as ventaPagoTable,
  venta as ventaTable,
} from "@kallpasoft/db";
import { and, asc, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import type {
  Venta,
  VentaDetalle,
  VentaEnvio,
  VentaItem,
  VentaPago,
} from "../../domain/entities/venta.js";
import type {
  ActualizarEnvioData,
  AddVentaPagoData,
  AnularVentaData,
  CreateVentaData,
  CreateVentaItemData,
  IVentaRepository,
  ListEnviosCalendarioParams,
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

function calcSaldoPendiente(total: string, pagos: VentaPago[]): string {
  const totalNum = Number(total);
  const pagado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  return Math.max(0, totalNum - pagado).toFixed(2);
}

function calcPorcentajePagado(total: string, pagos: VentaPago[]): number {
  const totalNum = Number(total);
  if (totalNum === 0) return 100;
  const pagado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  return Math.min(100, Math.round((pagado / totalNum) * 10000) / 100);
}

export class VentaDrizzleRepository implements IVentaRepository {
  constructor(private readonly db: DbClient) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(tenantId: string, data: CreateVentaData): Promise<Venta> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Lookup caja to get sucursal_id
      const cajaRows = await tx
        .select({ sucursal_id: cajaTable.sucursal_id, estado: cajaTable.estado })
        .from(cajaTable)
        .where(and(eq(cajaTable.id, data.caja_id), eq(cajaTable.tenant_id, tenantId)))
        .limit(1);
      const caja = cajaRows[0];
      if (!caja) throw new Error("Caja no encontrada");
      if (caja.estado !== "ABIERTA") throw new Error("La caja no está abierta");

      // For SERVICIO: inherit cliente from orden_servicio → instancia
      let clienteId = data.cliente_id ?? null;
      if (data.tipo === "SERVICIO" && data.orden_servicio_id) {
        const osRows = await tx
          .select({ instancia_id: ordenServicioTable.instancia_id })
          .from(ordenServicioTable)
          .where(
            and(
              eq(ordenServicioTable.id, data.orden_servicio_id),
              eq(ordenServicioTable.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (osRows[0]) {
          const instanciaRows = await tx
            .select({ cliente_id: instanciaTable.cliente_id })
            .from(instanciaTable)
            .where(eq(instanciaTable.id, osRows[0].instancia_id))
            .limit(1);
          if (instanciaRows[0]) clienteId = instanciaRows[0].cliente_id;
        }
      }

      // Validate PRODUTO items: check stock in lotes (V5)
      const productItems = data.items.filter((it) => it.tipo_item === "PRODUTO");
      for (const item of productItems) {
        if (!item.lote_id) throw new Error(`Item PRODUTO requiere lote_id: ${item.descripcion}`);
        if (!item.sku) throw new Error(`Item PRODUTO requiere SKU: ${item.descripcion}`);

        const loteRows = await tx
          .select({ cantidad_actual: loteTable.cantidad_actual })
          .from(loteTable)
          .where(and(eq(loteTable.id, item.lote_id), eq(loteTable.tenant_id, tenantId)))
          .limit(1);

        const loteActual = loteRows[0];
        if (!loteActual) throw new Error(`Lote no encontrado: ${item.lote_id}`);
        if (loteActual.cantidad_actual < item.cantidad) {
          throw new Error(
            `Stock insuficiente en lote ${item.lote_id}: disponible=${loteActual.cantidad_actual}, solicitado=${item.cantidad}`
          );
        }
      }

      // Calculate total from items
      const totalItems = data.items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
      const costoEnvio = data.requiere_envio ? (data.datos_envio?.costo_envio ?? 0) : 0;
      const total = totalItems + costoEnvio;

      const codigo = await generarCodigoVenta(tx, tenantId);

      // Determine initial estado_despacho
      const estadoDespacho = data.requiere_envio ? "ENVIO_PENDIENTE" : "SIN_ENVIO";

      // Create venta
      const ventaRows = await tx
        .insert(ventaTable)
        .values({
          tenant_id: tenantId,
          codigo,
          caja_id: data.caja_id,
          sucursal_id: caja.sucursal_id,
          cliente_id: clienteId,
          tipo_venta: data.tipo,
          orden_servicio_id: data.orden_servicio_id ?? null,
          visita_domicilio_id: data.visita_domicilio_id ?? null,
          total: total.toFixed(2),
          estado_pago: "PAGO_PENDIENTE",
          estado_despacho: estadoDespacho,
          created_by: data.created_by,
        })
        .returning();

      const venta = ventaRows[0] as Venta;

      // Create venta_items
      const itemValues = data.items.map((it) => ({
        tenant_id: tenantId,
        venta_id: venta.id,
        tipo_item: it.tipo_item as "PRODUCTO" | "SERVICIO" | "ENVIO" | "MANUAL",
        produto_id: it.produto_id ?? null,
        lote_id: it.lote_id ?? null,
        sku: it.sku ?? null,
        numero_serie: it.numero_serie ?? null,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: String(it.precio_unitario),
        subtotal: (it.precio_unitario * it.cantidad).toFixed(2),
        es_preventivo: it.es_preventivo ?? false,
      }));

      // Add ENVIO item if requiere_envio
      if (data.requiere_envio && costoEnvio > 0) {
        itemValues.push({
          tenant_id: tenantId,
          venta_id: venta.id,
          tipo_item: "ENVIO",
          produto_id: null,
          lote_id: null,
          sku: null,
          numero_serie: null,
          descripcion: "Envío",
          cantidad: 1,
          precio_unitario: String(costoEnvio),
          subtotal: costoEnvio.toFixed(2),
          es_preventivo: false,
        });
      }

      if (itemValues.length > 0) {
        await tx.insert(ventaItemTable).values(itemValues);
      }

      // Deduct stock and create movements for PRODUTO items (V4)
      for (const item of productItems) {
        const loteRows = await tx
          .select({ produto_id: loteTable.produto_id, sucursal_id: loteTable.sucursal_id })
          .from(loteTable)
          .where(eq(loteTable.id, item.lote_id as string))
          .limit(1);

        if (loteRows[0]) {
          await tx
            .update(loteTable)
            .set({ cantidad_actual: sql`${loteTable.cantidad_actual} - ${item.cantidad}` })
            .where(eq(loteTable.id, item.lote_id as string));

          await tx.insert(movimientoTable).values({
            tenant_id: tenantId,
            produto_id: loteRows[0].produto_id,
            lote_id: item.lote_id as string,
            sucursal_id: loteRows[0].sucursal_id,
            tipo: "VENTA",
            cantidad: -item.cantidad,
            referencia_tipo: "venta",
            referencia_id: venta.id,
            usuario_id: data.created_by,
          });
        }
      }

      // Create venta_envio if requiere_envio
      if (data.requiere_envio && data.datos_envio) {
        await tx.insert(ventaEnvioTable).values({
          tenant_id: tenantId,
          venta_id: venta.id,
          direccion_id: data.datos_envio.direccion_id ?? null,
          metodo_envio: data.datos_envio.metodo_envio ?? null,
          fecha_programada: data.datos_envio.fecha_programada ?? null,
          costo_envio: costoEnvio.toFixed(2),
          estado: "PENDIENTE",
        });
      }

      // Create pagos
      let totalPagado = 0;
      if (data.pagos && data.pagos.length > 0) {
        await tx.insert(ventaPagoTable).values(
          data.pagos.map((p) => ({
            tenant_id: tenantId,
            venta_id: venta.id,
            metodo_pago_id: p.metodo_pago_id,
            monto: String(p.monto),
            caja_id: data.caja_id,
            created_by: data.created_by,
          }))
        );
        totalPagado = data.pagos.reduce((acc, p) => acc + p.monto, 0);
      }

      // Update estado_pago if fully paid
      const estadoPago = totalPagado >= total && total > 0 ? "COMPLETADA" : "PAGO_PENDIENTE";

      if (estadoPago !== "PAGO_PENDIENTE") {
        await tx
          .update(ventaTable)
          .set({ estado_pago: "COMPLETADA", updated_at: new Date() })
          .where(eq(ventaTable.id, venta.id));
        return { ...venta, estado_pago: "COMPLETADA" } as Venta;
      }

      return venta;
    });
  }

  // ─── LIST ──────────────────────────────────────────────────────────────────

  async list(tenantId: string, params: ListVentasParams): Promise<ListVentasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(ventaTable.tenant_id, tenantId)];
      if (params.tipo)
        conditions.push(
          eq(
            ventaTable.tipo_venta,
            params.tipo as "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION"
          )
        );
      if (params.estado_pago)
        conditions.push(
          eq(
            ventaTable.estado_pago,
            params.estado_pago as "PAGO_PENDIENTE" | "COMPLETADA" | "ANULADA"
          )
        );
      if (params.estado_despacho)
        conditions.push(
          eq(
            ventaTable.estado_despacho,
            params.estado_despacho as "SIN_ENVIO" | "ENVIO_PENDIENTE" | "DESPACHADO"
          )
        );
      if (params.caja_id) conditions.push(eq(ventaTable.caja_id, params.caja_id));
      if (params.cliente_id) conditions.push(eq(ventaTable.cliente_id, params.cliente_id));
      if (params.created_by) conditions.push(eq(ventaTable.created_by, params.created_by));
      if (params.desde) conditions.push(gte(ventaTable.created_at, new Date(params.desde)));
      if (params.hasta) conditions.push(lte(ventaTable.created_at, new Date(params.hasta)));

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
            vendedor_nombres: usuarioTable.nombres,
            vendedor_apellidos: usuarioTable.apellidos,
          })
          .from(ventaTable)
          .leftJoin(clienteTable, eq(ventaTable.cliente_id, clienteTable.id))
          .leftJoin(usuarioTable, eq(ventaTable.created_by, usuarioTable.id))
          .where(where)
          .orderBy(asc(ventaTable.created_at))
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: Venta[] = rows.map((r) => ({
        ...(r.venta as Venta),
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
        vendedor_nombre: r.vendedor_nombres
          ? `${r.vendedor_nombres} ${r.vendedor_apellidos ?? ""}`.trim()
          : undefined,
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  // ─── FIND BY ID ────────────────────────────────────────────────────────────

  async findById(tenantId: string, id: string): Promise<VentaDetalle | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          venta: ventaTable,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
          vendedor_nombres: usuarioTable.nombres,
          vendedor_apellidos: usuarioTable.apellidos,
          os_estado: ordenServicioTable.estado,
        })
        .from(ventaTable)
        .leftJoin(clienteTable, eq(ventaTable.cliente_id, clienteTable.id))
        .leftJoin(usuarioTable, eq(ventaTable.created_by, usuarioTable.id))
        .leftJoin(ordenServicioTable, eq(ventaTable.orden_servicio_id, ordenServicioTable.id))
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)))
        .limit(1);

      if (!rows[0]) return null;
      const r = rows[0];

      const [items, pagos, envioRows] = await Promise.all([
        tx
          .select()
          .from(ventaItemTable)
          .where(and(eq(ventaItemTable.venta_id, id), eq(ventaItemTable.tenant_id, tenantId)))
          .orderBy(asc(ventaItemTable.created_at)),
        tx
          .select({ pago: ventaPagoTable, metodo_nombre: metodoPagoCatalogoTable.nombre })
          .from(ventaPagoTable)
          .leftJoin(
            metodoPagoCatalogoTable,
            eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
          )
          .where(and(eq(ventaPagoTable.venta_id, id), eq(ventaPagoTable.tenant_id, tenantId)))
          .orderBy(asc(ventaPagoTable.created_at)),
        tx
          .select()
          .from(ventaEnvioTable)
          .where(and(eq(ventaEnvioTable.venta_id, id), eq(ventaEnvioTable.tenant_id, tenantId)))
          .limit(1),
      ]);

      const ventaBase = r.venta as Venta;
      const pagosMapped: VentaPago[] = pagos.map((p) => ({
        ...(p.pago as VentaPago),
        metodo_nombre: p.metodo_nombre ?? undefined,
      }));

      return {
        ...ventaBase,
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
        vendedor_nombre: r.vendedor_nombres
          ? `${r.vendedor_nombres} ${r.vendedor_apellidos ?? ""}`.trim()
          : undefined,
        servicio_asociado: r.os_estado
          ? { id: ventaBase.orden_servicio_id as string, estado: r.os_estado }
          : undefined,
        items: items as VentaItem[],
        pagos: pagosMapped,
        envio: (envioRows[0] as VentaEnvio) ?? null,
        saldo_pendiente: calcSaldoPendiente(ventaBase.total, pagosMapped),
        porcentaje_pagado: calcPorcentajePagado(ventaBase.total, pagosMapped),
      };
    });
  }

  // ─── ADD PAGO ──────────────────────────────────────────────────────────────

  async addPago(tenantId: string, ventaId: string, data: AddVentaPagoData): Promise<VentaPago> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ventaRows = await tx
        .select({
          total: ventaTable.total,
          tipo_venta: ventaTable.tipo_venta,
          estado_pago: ventaTable.estado_pago,
          orden_servicio_id: ventaTable.orden_servicio_id,
        })
        .from(ventaTable)
        .where(and(eq(ventaTable.id, ventaId), eq(ventaTable.tenant_id, tenantId)))
        .limit(1);

      const venta = ventaRows[0];
      if (!venta) throw new Error("Venta no encontrada");
      if (venta.estado_pago === "ANULADA") throw new Error("La venta está anulada");
      if (venta.estado_pago === "COMPLETADA")
        throw new Error("La venta ya está completamente pagada");

      // V7: LIBRE no admite pagos adicionales si ya tiene al menos uno
      if (venta.tipo_venta === "LIBRE") {
        const existentes = await tx
          .select({ cnt: count() })
          .from(ventaPagoTable)
          .where(and(eq(ventaPagoTable.venta_id, ventaId), eq(ventaPagoTable.tenant_id, tenantId)));
        if ((existentes[0]?.cnt ?? 0) > 0) {
          throw new Error("Venta LIBRE ya tiene un pago registrado. No admite pagos adicionales.");
        }
      }

      const pagoRows = await tx
        .insert(ventaPagoTable)
        .values({
          tenant_id: tenantId,
          venta_id: ventaId,
          metodo_pago_id: data.metodo_pago_id,
          monto: String(data.monto),
          caja_id: data.caja_id,
          created_by: data.created_by,
        })
        .returning();

      const pago = pagoRows[0] as VentaPago;

      // Calculate new estado_pago
      const sumRows = await tx
        .select({ total: sum(ventaPagoTable.monto) })
        .from(ventaPagoTable)
        .where(and(eq(ventaPagoTable.venta_id, ventaId), eq(ventaPagoTable.tenant_id, tenantId)));

      const totalPagado = Number(sumRows[0]?.total ?? 0);
      const totalVenta = Number(venta.total);
      const nuevoEstado: "PAGO_PENDIENTE" | "COMPLETADA" =
        totalPagado >= totalVenta ? "COMPLETADA" : "PAGO_PENDIENTE";

      await tx
        .update(ventaTable)
        .set({ estado_pago: nuevoEstado, updated_at: new Date() })
        .where(and(eq(ventaTable.id, ventaId), eq(ventaTable.tenant_id, tenantId)));

      return pago;
    });
  }

  // ─── ANULAR ────────────────────────────────────────────────────────────────

  async anular(tenantId: string, id: string, data: AnularVentaData): Promise<Venta | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ventaRows = await tx
        .select()
        .from(ventaTable)
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)))
        .limit(1);

      const venta = ventaRows[0] as Venta | undefined;
      if (!venta) return null;
      if (venta.estado_pago === "ANULADA") throw new Error("La venta ya está anulada");

      // Calculate nota_credito_monto = sum(pagos ya hechos) - PV2
      const sumRows = await tx
        .select({ total: sum(ventaPagoTable.monto) })
        .from(ventaPagoTable)
        .where(and(eq(ventaPagoTable.venta_id, id), eq(ventaPagoTable.tenant_id, tenantId)));
      const montoPagado = Number(sumRows[0]?.total ?? 0);
      const notaCreditoMonto = montoPagado > 0 ? montoPagado.toFixed(2) : null;

      // Revert stock for PRODUTO items (V22)
      const items = await tx
        .select()
        .from(ventaItemTable)
        .where(and(eq(ventaItemTable.venta_id, id), eq(ventaItemTable.tenant_id, tenantId)));

      for (const item of items as VentaItem[]) {
        if (item.tipo_item !== "PRODUTO" || !item.lote_id) continue;

        const loteRows = await tx
          .select({ produto_id: loteTable.produto_id, sucursal_id: loteTable.sucursal_id })
          .from(loteTable)
          .where(eq(loteTable.id, item.lote_id))
          .limit(1);

        if (loteRows[0]) {
          await tx
            .update(loteTable)
            .set({ cantidad_actual: sql`${loteTable.cantidad_actual} + ${item.cantidad}` })
            .where(eq(loteTable.id, item.lote_id));

          await tx.insert(movimientoTable).values({
            tenant_id: tenantId,
            produto_id: loteRows[0].produto_id,
            lote_id: item.lote_id,
            sucursal_id: loteRows[0].sucursal_id,
            tipo: "REAJUSTE",
            cantidad: item.cantidad,
            referencia_tipo: "anulacion_venta",
            referencia_id: id,
            notas: data.motivo,
            usuario_id: data.anulado_por,
          });
        }
      }

      const rows = await tx
        .update(ventaTable)
        .set({
          estado_pago: "ANULADA",
          motivo_anulacion: data.motivo,
          anulado_por: data.anulado_por,
          ...(notaCreditoMonto !== null ? { nota_credito_monto: notaCreditoMonto } : {}),
          updated_at: new Date(),
        })
        .where(and(eq(ventaTable.id, id), eq(ventaTable.tenant_id, tenantId)))
        .returning();

      return (rows[0] as Venta) ?? null;
    });
  }

  // ─── ENVÍO ─────────────────────────────────────────────────────────────────

  async actualizarEnvio(
    tenantId: string,
    ventaId: string,
    data: ActualizarEnvioData
  ): Promise<VentaEnvio> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select({ id: ventaEnvioTable.id })
        .from(ventaEnvioTable)
        .where(and(eq(ventaEnvioTable.venta_id, ventaId), eq(ventaEnvioTable.tenant_id, tenantId)))
        .limit(1);

      const setValues = {
        ...(data.direccion_id !== undefined ? { direccion_id: data.direccion_id } : {}),
        ...(data.metodo_envio !== undefined ? { metodo_envio: data.metodo_envio } : {}),
        ...(data.fecha_programada !== undefined ? { fecha_programada: data.fecha_programada } : {}),
        ...(data.costo_envio !== undefined ? { costo_envio: String(data.costo_envio) } : {}),
        updated_at: new Date(),
      };

      let envioRows: unknown[];
      if (existing[0]) {
        envioRows = await tx
          .update(ventaEnvioTable)
          .set(setValues)
          .where(
            and(eq(ventaEnvioTable.venta_id, ventaId), eq(ventaEnvioTable.tenant_id, tenantId))
          )
          .returning();
      } else {
        envioRows = await tx
          .insert(ventaEnvioTable)
          .values({
            tenant_id: tenantId,
            venta_id: ventaId,
            direccion_id: data.direccion_id ?? null,
            metodo_envio: data.metodo_envio ?? null,
            fecha_programada: data.fecha_programada ?? null,
            costo_envio: String(data.costo_envio ?? 0),
            estado: "PENDIENTE",
          })
          .returning();

        // Mark venta as ENVIO_PENDIENTE if it was SIN_ENVIO
        await tx
          .update(ventaTable)
          .set({ estado_despacho: "ENVIO_PENDIENTE", updated_at: new Date() })
          .where(
            and(
              eq(ventaTable.id, ventaId),
              eq(ventaTable.tenant_id, tenantId),
              eq(ventaTable.estado_despacho, "SIN_ENVIO")
            )
          );
      }

      // Update ENVIO item costo if changed
      if (data.costo_envio !== undefined) {
        await tx
          .update(ventaItemTable)
          .set({
            precio_unitario: String(data.costo_envio),
            subtotal: data.costo_envio.toFixed(2),
          })
          .where(
            and(
              eq(ventaItemTable.venta_id, ventaId),
              eq(ventaItemTable.tenant_id, tenantId),
              eq(ventaItemTable.tipo_item, "ENVIO")
            )
          );
      }

      return (envioRows as VentaEnvio[])[0] as VentaEnvio;
    });
  }

  async despacharEnvio(tenantId: string, ventaId: string): Promise<VentaEnvio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const envioRows = await tx
        .update(ventaEnvioTable)
        .set({ estado: "DESPACHADO", updated_at: new Date() })
        .where(and(eq(ventaEnvioTable.venta_id, ventaId), eq(ventaEnvioTable.tenant_id, tenantId)))
        .returning();

      if (!envioRows[0]) return null;

      await tx
        .update(ventaTable)
        .set({ estado_despacho: "DESPACHADO", updated_at: new Date() })
        .where(and(eq(ventaTable.id, ventaId), eq(ventaTable.tenant_id, tenantId)));

      return envioRows[0] as VentaEnvio;
    });
  }

  async listEnviosCalendario(
    tenantId: string,
    params: ListEnviosCalendarioParams
  ): Promise<VentaEnvio[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(ventaEnvioTable.tenant_id, tenantId),
        gte(ventaEnvioTable.fecha_programada, params.fecha_desde),
        lte(ventaEnvioTable.fecha_programada, params.fecha_hasta),
      ];

      if (params.sucursal_id) {
        conditions.push(sql`${ventaTable.sucursal_id} = ${params.sucursal_id}::uuid`);
      }

      const rows = await tx
        .select({ envio: ventaEnvioTable, sucursal_id: ventaTable.sucursal_id })
        .from(ventaEnvioTable)
        .leftJoin(ventaTable, eq(ventaEnvioTable.venta_id, ventaTable.id))
        .where(and(...conditions))
        .orderBy(asc(ventaEnvioTable.fecha_programada));

      return rows.map((r) => r.envio as VentaEnvio);
    });
  }

  // ─── INTEGRACIÓN SERVICIOS ─────────────────────────────────────────────────

  async crearVentaDesdeServicio(tenantId: string, data: CreateVentaData): Promise<Venta> {
    return this.create(tenantId, data);
  }

  async actualizarItemsConSkus(
    tenantId: string,
    ventaId: string,
    items: CreateVentaItemData[]
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      for (const item of items) {
        if (!item.lote_id || !item.sku) continue;
        await tx
          .update(ventaItemTable)
          .set({
            lote_id: item.lote_id,
            sku: item.sku,
            ...(item.numero_serie ? { numero_serie: item.numero_serie } : {}),
          })
          .where(
            and(
              eq(ventaItemTable.venta_id, ventaId),
              eq(ventaItemTable.tenant_id, tenantId),
              eq(ventaItemTable.descripcion, item.descripcion)
            )
          );
      }
    });
  }
}
