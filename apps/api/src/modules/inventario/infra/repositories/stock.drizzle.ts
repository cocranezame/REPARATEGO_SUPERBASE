import type { DbClient } from "@kallpasoft/db";
import {
  cotizacionCompra as cotizacionCompraTable,
  lote as loteTable,
  movimientoInventario as movimientoInventarioTable,
  ordenCompra as ordenCompraTable,
  producto as productoTable,
  proveedorLinea as proveedorLineaTable,
  proveedor as proveedorTable,
  solicitudCompra as solicitudCompraTable,
  sucursal as sucursalTable,
  tasaPrecio as tasaPrecioTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, isNotNull, isNull, lte, sql, sum } from "drizzle-orm";
import type { DashboardInventario } from "../../domain/entities/dashboard-inventario.js";
import type { Lote } from "../../domain/entities/lote.js";
import type { MovimientoInventario } from "../../domain/entities/movimiento-inventario.js";
import type { AlertaStock, LoteDetalle, StockItem } from "../../domain/entities/stock.js";
import type {
  CreateLoteData,
  CreateMovimientoData,
  IngresoManualData,
  IngresoManualResult,
  IStockRepository,
  ListLotesParams,
  ListLotesResult,
  ListMovimientosParams,
  ListMovimientosResult,
  ListStockParams,
  ProveedoresSugeridos,
} from "../../domain/ports/stock.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic — applies to all DbTx usages below
type DbTx = any;

async function setTenantLocal(tx: DbTx, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// SKU C004: codigoProd + DDMMAA + correlativo(2 dígitos)
function buildSku(codigoProducto: string, fecha: Date, correlativo: number): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const aa = String(fecha.getFullYear()).slice(-2);
  return `${codigoProducto}${dd}${mm}${aa}${String(correlativo).padStart(2, "0")}`;
}

async function contarLotesMismoDia(
  tx: DbTx,
  tenantId: string,
  productoId: string,
  fecha: string
): Promise<number> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM lote
        WHERE tenant_id = ${tenantId}::uuid
          AND producto_id = ${productoId}::uuid
          AND fecha_ingreso = ${fecha}::date`
  )) as Array<{ n: string | number }>;
  return Number(rows[0]?.n ?? 0);
}

function calcularPrecioVenta(costo: number, tasaTipo: string, tasaValor: number): number {
  if (tasaTipo === "PORCENTAJE") return costo * (1 + tasaValor / 100);
  return costo + tasaValor;
}

export class StockDrizzleRepository implements IStockRepository {
  constructor(private readonly db: DbClient) {}

  // ── GRUPO 1: Dashboard ──────────────────────────────────────────────────────

  async getDashboard(tenantId: string): Promise<DashboardInventario> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [totalProd, totalServ, cotPendientes, valorInv] = await Promise.all([
        tx
          .select({ n: count() })
          .from(productoTable)
          .where(
            and(
              eq(productoTable.tenant_id, tenantId),
              eq(productoTable.tipo, "PRODUCTO"),
              eq(productoTable.activo, true)
            )
          ),
        tx
          .select({ n: count() })
          .from(productoTable)
          .where(
            and(
              eq(productoTable.tenant_id, tenantId),
              eq(productoTable.tipo, "SERVICIO"),
              eq(productoTable.activo, true)
            )
          ),
        tx
          .select({ n: count() })
          .from(cotizacionCompraTable)
          .where(
            and(
              eq(cotizacionCompraTable.tenant_id, tenantId),
              isNull(cotizacionCompraTable.precio_unitario)
            )
          ),
        tx.execute(
          sql`SELECT COALESCE(SUM(cantidad_actual::numeric * precio_unitario::numeric), 0) AS total
              FROM lote WHERE tenant_id = ${tenantId}::uuid AND activo = true`
        ) as Promise<Array<{ total: string }>>,
      ]);

      // Productos bajo mínimo: join movimientos con producto
      const stockRows = await tx
        .select({
          producto_id: movimientoInventarioTable.producto_id,
          nombre: productoTable.nombre,
          codigo: productoTable.codigo,
          stock_minimo: productoTable.stock_minimo,
          stock_actual: sum(movimientoInventarioTable.cantidad),
        })
        .from(movimientoInventarioTable)
        .leftJoin(productoTable, eq(movimientoInventarioTable.producto_id, productoTable.id))
        .where(eq(movimientoInventarioTable.tenant_id, tenantId))
        .groupBy(
          movimientoInventarioTable.producto_id,
          productoTable.nombre,
          productoTable.codigo,
          productoTable.stock_minimo
        );

      const alertas = stockRows
        .filter((r) => {
          const actual = Number(r.stock_actual ?? 0);
          const minimo = r.stock_minimo ?? 0;
          return actual < minimo;
        })
        .map((r) => ({
          producto_id: r.producto_id,
          nombre: r.nombre ?? "",
          codigo: r.codigo ?? "",
          stock_actual: Number(r.stock_actual ?? 0),
          stock_minimo: r.stock_minimo ?? 0,
        }));

      return {
        total_productos: totalProd[0]?.n ?? 0,
        total_servicios: totalServ[0]?.n ?? 0,
        productos_stock_bajo_minimo: alertas,
        cotizaciones_pendientes: cotPendientes[0]?.n ?? 0,
        valor_total_inventario: String(
          Number((valorInv as Array<{ total: string }>)[0]?.total ?? "0").toFixed(2)
        ),
      };
    });
  }

  // ── GRUPO 2: Alertas stock mínimo ───────────────────────────────────────────

  async getStockAlertas(tenantId: string): Promise<AlertaStock[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          producto_id: movimientoInventarioTable.producto_id,
          nombre: productoTable.nombre,
          codigo: productoTable.codigo,
          stock_minimo: productoTable.stock_minimo,
          stock_actual: sum(movimientoInventarioTable.cantidad),
        })
        .from(movimientoInventarioTable)
        .leftJoin(productoTable, eq(movimientoInventarioTable.producto_id, productoTable.id))
        .where(eq(movimientoInventarioTable.tenant_id, tenantId))
        .groupBy(
          movimientoInventarioTable.producto_id,
          productoTable.nombre,
          productoTable.codigo,
          productoTable.stock_minimo
        );

      return rows
        .filter((r) => {
          const actual = Number(r.stock_actual ?? 0);
          const minimo = r.stock_minimo ?? 0;
          return actual < minimo;
        })
        .map((r) => {
          const actual = Number(r.stock_actual ?? 0);
          const minimo = r.stock_minimo ?? 0;
          return {
            producto_id: r.producto_id,
            nombre: r.nombre ?? "",
            codigo: r.codigo ?? "",
            stock_actual: actual,
            stock_minimo: minimo,
            diferencia: minimo - actual,
          };
        });
    });
  }

  // ── Stock y lotes (existentes) ───────────────────────────────────────────────

  async listStock(tenantId: string, params: ListStockParams): Promise<StockItem[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(movimientoInventarioTable.tenant_id, tenantId)];
      if (params.producto_id) {
        conditions.push(eq(movimientoInventarioTable.producto_id, params.producto_id));
      }
      if (params.sucursal_id) {
        conditions.push(eq(movimientoInventarioTable.sucursal_id, params.sucursal_id));
      }

      const rows = await tx
        .select({
          producto_id: movimientoInventarioTable.producto_id,
          sucursal_id: movimientoInventarioTable.sucursal_id,
          nombre: productoTable.nombre,
          codigo: productoTable.codigo,
          stock_minimo: productoTable.stock_minimo,
          sucursal_nombre: sucursalTable.nombre,
          stock_actual: sum(movimientoInventarioTable.cantidad),
        })
        .from(movimientoInventarioTable)
        .leftJoin(productoTable, eq(movimientoInventarioTable.producto_id, productoTable.id))
        .leftJoin(sucursalTable, eq(movimientoInventarioTable.sucursal_id, sucursalTable.id))
        .where(and(...conditions))
        .groupBy(
          movimientoInventarioTable.producto_id,
          movimientoInventarioTable.sucursal_id,
          productoTable.nombre,
          productoTable.codigo,
          productoTable.stock_minimo,
          sucursalTable.nombre
        );

      const items: StockItem[] = rows.map((r) => {
        const stockActual = Number(r.stock_actual ?? 0);
        const stockMinimo = r.stock_minimo ?? 0;
        return {
          producto_id: r.producto_id,
          nombre: r.nombre ?? "",
          codigo: r.codigo ?? "",
          sucursal_id: r.sucursal_id,
          sucursal_nombre: r.sucursal_nombre ?? undefined,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
          en_alerta: stockActual < stockMinimo,
        };
      });

      if (params.alerta_minimo === true) return items.filter((i) => i.en_alerta);
      return items;
    });
  }

  async getStockDetalle(tenantId: string, productoId: string): Promise<LoteDetalle[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          lote_id: loteTable.id,
          sku: loteTable.sku,
          cantidad_actual: loteTable.cantidad_actual,
          precio_unitario: loteTable.precio_unitario,
          fecha_ingreso: loteTable.fecha_ingreso,
        })
        .from(loteTable)
        .where(
          and(
            eq(loteTable.tenant_id, tenantId),
            eq(loteTable.producto_id, productoId),
            eq(loteTable.activo, true)
          )
        )
        .orderBy(loteTable.fecha_ingreso);

      return rows.map((r) => ({
        lote_id: r.lote_id,
        sku: r.sku,
        cantidad_actual: r.cantidad_actual,
        precio_unitario: r.precio_unitario,
        fecha_ingreso: r.fecha_ingreso,
      }));
    });
  }

  async listLotes(tenantId: string, params: ListLotesParams): Promise<ListLotesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(loteTable.tenant_id, tenantId), eq(loteTable.activo, true)];
      if (params.producto_id) conditions.push(eq(loteTable.producto_id, params.producto_id));
      if (params.sucursal_id) conditions.push(eq(loteTable.sucursal_id, params.sucursal_id));

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(loteTable).where(where),
        tx
          .select({
            id: loteTable.id,
            tenant_id: loteTable.tenant_id,
            producto_id: loteTable.producto_id,
            producto_nombre: productoTable.nombre,
            sucursal_id: loteTable.sucursal_id,
            sucursal_nombre: sucursalTable.nombre,
            orden_compra_id: loteTable.orden_compra_id,
            sku: loteTable.sku,
            correlativo: loteTable.correlativo,
            cantidad_inicial: loteTable.cantidad_inicial,
            cantidad_actual: loteTable.cantidad_actual,
            precio_unitario: loteTable.precio_unitario,
            fecha_ingreso: loteTable.fecha_ingreso,
            fecha_vencimiento: loteTable.fecha_vencimiento,
            activo: loteTable.activo,
            created_at: loteTable.created_at,
            updated_at: loteTable.updated_at,
          })
          .from(loteTable)
          .leftJoin(productoTable, eq(loteTable.producto_id, productoTable.id))
          .leftJoin(sucursalTable, eq(loteTable.sucursal_id, sucursalTable.id))
          .where(where)
          .orderBy(loteTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return {
        items: rows.map((r) => ({
          ...r,
          producto_nombre: r.producto_nombre ?? undefined,
          sucursal_nombre: r.sucursal_nombre ?? undefined,
        })) as Lote[],
        total: countRows[0]?.total ?? 0,
      };
    });
  }

  async createLote(tenantId: string, data: CreateLoteData): Promise<Lote> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Obtener código del producto para SKU C004
      const prodRows = await tx
        .select({ codigo: productoTable.codigo })
        .from(productoTable)
        .where(and(eq(productoTable.id, data.producto_id), eq(productoTable.tenant_id, tenantId)))
        .limit(1);

      const codigoProd = prodRows[0]?.codigo ?? data.producto_id.slice(0, 8);
      const fechaIngreso = new Date(data.fecha_ingreso);
      const lotesMismoDia = await contarLotesMismoDia(
        tx,
        tenantId,
        data.producto_id,
        data.fecha_ingreso
      );
      const correlativo = lotesMismoDia + 1;
      const sku = buildSku(codigoProd, fechaIngreso, correlativo);

      const inserted = await tx
        .insert(loteTable)
        .values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          sucursal_id: data.sucursal_id,
          orden_compra_id: data.orden_compra_id ?? null,
          sku,
          correlativo,
          cantidad_inicial: data.cantidad,
          cantidad_actual: data.cantidad,
          precio_unitario: String(data.precio_unitario),
          fecha_ingreso: data.fecha_ingreso,
          fecha_vencimiento: data.fecha_vencimiento ?? null,
        })
        .returning({ id: loteTable.id });

      const loteId = inserted[0]?.id;
      if (!loteId) throw new Error("Failed to insert lote");

      await tx.insert(movimientoInventarioTable).values({
        tenant_id: tenantId,
        producto_id: data.producto_id,
        lote_id: loteId,
        sucursal_id: data.sucursal_id,
        tipo: "INGRESO",
        cantidad: data.cantidad,
        referencia_tipo: data.orden_compra_id ? "ORDEN_COMPRA" : null,
        referencia_id: data.orden_compra_id ?? null,
        notas: "Ingreso manual de lote",
        usuario_id: data.usuario_id,
      });

      const rows = await tx
        .select({
          id: loteTable.id,
          tenant_id: loteTable.tenant_id,
          producto_id: loteTable.producto_id,
          producto_nombre: productoTable.nombre,
          sucursal_id: loteTable.sucursal_id,
          sucursal_nombre: sucursalTable.nombre,
          orden_compra_id: loteTable.orden_compra_id,
          sku: loteTable.sku,
          correlativo: loteTable.correlativo,
          cantidad_inicial: loteTable.cantidad_inicial,
          cantidad_actual: loteTable.cantidad_actual,
          precio_unitario: loteTable.precio_unitario,
          fecha_ingreso: loteTable.fecha_ingreso,
          fecha_vencimiento: loteTable.fecha_vencimiento,
          activo: loteTable.activo,
          created_at: loteTable.created_at,
          updated_at: loteTable.updated_at,
        })
        .from(loteTable)
        .leftJoin(productoTable, eq(loteTable.producto_id, productoTable.id))
        .leftJoin(sucursalTable, eq(loteTable.sucursal_id, sucursalTable.id))
        .where(eq(loteTable.id, loteId));

      const row = rows[0];
      if (!row) throw new Error("Lote not found after insert");

      return {
        ...row,
        producto_nombre: row.producto_nombre ?? undefined,
        sucursal_nombre: row.sucursal_nombre ?? undefined,
      } as Lote;
    });
  }

  // ── GRUPO 6: Ingreso manual con lógica dual (I11, I12, I22, I23) ────────────

  async ingresoManual(tenantId: string, data: IngresoManualData): Promise<IngresoManualResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const today = new Date().toISOString().slice(0, 10);

      // Buscar producto para obtener código
      const prodRows = await tx
        .select({
          codigo: productoTable.codigo,
          tipo: productoTable.tipo,
          componente_id: productoTable.componente_id,
        })
        .from(productoTable)
        .where(and(eq(productoTable.id, data.producto_id), eq(productoTable.tenant_id, tenantId)))
        .limit(1);

      const prod = prodRows[0];
      if (!prod) throw new Error("Producto no encontrado");

      // I12: Verificar lote existente mismo producto + mismo día + mismo proveedor
      let loteExistente: { id: string } | undefined;

      if (data.proveedor_id) {
        const existingRows = (await tx.execute(
          sql`SELECT l.id FROM lote l
              JOIN movimiento_inventario m ON m.lote_id = l.id
              WHERE l.tenant_id = ${tenantId}::uuid
                AND l.producto_id = ${data.producto_id}::uuid
                AND l.fecha_ingreso = ${today}::date
                AND l.activo = true
                AND m.tipo = 'INGRESO'
                AND m.referencia_tipo = 'PROVEEDOR'
                AND m.referencia_id = ${data.proveedor_id}::uuid
              LIMIT 1`
        )) as Array<{ id: string }>;
        loteExistente = existingRows[0];
      }

      let lote: Lote;
      let editado = false;

      if (loteExistente) {
        // I12: Editar lote existente sumando cantidad
        await tx.execute(
          sql`UPDATE lote
              SET cantidad_actual = cantidad_actual + ${data.cantidad},
                  cantidad_inicial = cantidad_inicial + ${data.cantidad},
                  updated_at = NOW()
              WHERE id = ${loteExistente.id}::uuid AND tenant_id = ${tenantId}::uuid`
        );

        await tx.insert(movimientoInventarioTable).values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          lote_id: loteExistente.id,
          sucursal_id: data.sucursal_id,
          tipo: "INGRESO",
          cantidad: data.cantidad,
          referencia_tipo: data.proveedor_id ? "PROVEEDOR" : null,
          referencia_id: data.proveedor_id ?? null,
          notas: data.cotizacion_id
            ? `Ingreso desde cotización ${data.cotizacion_id}`
            : "Ingreso manual",
          usuario_id: data.usuario_id,
        });

        const rows = await tx
          .select({
            id: loteTable.id,
            sku: loteTable.sku,
            correlativo: loteTable.correlativo,
            tenant_id: loteTable.tenant_id,
            producto_id: loteTable.producto_id,
            sucursal_id: loteTable.sucursal_id,
            orden_compra_id: loteTable.orden_compra_id,
            cantidad_inicial: loteTable.cantidad_inicial,
            cantidad_actual: loteTable.cantidad_actual,
            precio_unitario: loteTable.precio_unitario,
            fecha_ingreso: loteTable.fecha_ingreso,
            fecha_vencimiento: loteTable.fecha_vencimiento,
            activo: loteTable.activo,
            created_at: loteTable.created_at,
            updated_at: loteTable.updated_at,
            producto_nombre: productoTable.nombre,
            sucursal_nombre: sucursalTable.nombre,
          })
          .from(loteTable)
          .leftJoin(productoTable, eq(loteTable.producto_id, productoTable.id))
          .leftJoin(sucursalTable, eq(loteTable.sucursal_id, sucursalTable.id))
          .where(eq(loteTable.id, loteExistente.id));

        const row = rows[0];
        if (!row) throw new Error("Lote not found after update");
        lote = {
          ...row,
          producto_nombre: row.producto_nombre ?? undefined,
          sucursal_nombre: row.sucursal_nombre ?? undefined,
        } as Lote;
        editado = true;
      } else {
        // I11: Nuevo lote con correlativo si hay colisión de fecha
        const lotesMismoDia = await contarLotesMismoDia(tx, tenantId, data.producto_id, today);
        const correlativo = lotesMismoDia + 1;
        const sku = buildSku(prod.codigo, new Date(), correlativo);

        const inserted = await tx
          .insert(loteTable)
          .values({
            tenant_id: tenantId,
            producto_id: data.producto_id,
            sucursal_id: data.sucursal_id,
            sku,
            correlativo,
            cantidad_inicial: data.cantidad,
            cantidad_actual: data.cantidad,
            precio_unitario: String(data.precio_unitario),
            fecha_ingreso: today,
          })
          .returning({ id: loteTable.id });

        const loteId = inserted[0]?.id;
        if (!loteId) throw new Error("Failed to insert lote");

        await tx.insert(movimientoInventarioTable).values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          lote_id: loteId,
          sucursal_id: data.sucursal_id,
          tipo: "INGRESO",
          cantidad: data.cantidad,
          referencia_tipo: data.proveedor_id ? "PROVEEDOR" : null,
          referencia_id: data.proveedor_id ?? null,
          notas: data.cotizacion_id
            ? `Ingreso desde cotización ${data.cotizacion_id}`
            : "Ingreso manual",
          usuario_id: data.usuario_id,
        });

        const rows = await tx
          .select({
            id: loteTable.id,
            sku: loteTable.sku,
            correlativo: loteTable.correlativo,
            tenant_id: loteTable.tenant_id,
            producto_id: loteTable.producto_id,
            sucursal_id: loteTable.sucursal_id,
            orden_compra_id: loteTable.orden_compra_id,
            cantidad_inicial: loteTable.cantidad_inicial,
            cantidad_actual: loteTable.cantidad_actual,
            precio_unitario: loteTable.precio_unitario,
            fecha_ingreso: loteTable.fecha_ingreso,
            fecha_vencimiento: loteTable.fecha_vencimiento,
            activo: loteTable.activo,
            created_at: loteTable.created_at,
            updated_at: loteTable.updated_at,
            producto_nombre: productoTable.nombre,
            sucursal_nombre: sucursalTable.nombre,
          })
          .from(loteTable)
          .leftJoin(productoTable, eq(loteTable.producto_id, productoTable.id))
          .leftJoin(sucursalTable, eq(loteTable.sucursal_id, sucursalTable.id))
          .where(eq(loteTable.id, loteId));

        const row = rows[0];
        if (!row) throw new Error("Lote not found after insert");
        lote = {
          ...row,
          producto_nombre: row.producto_nombre ?? undefined,
          sucursal_nombre: row.sucursal_nombre ?? undefined,
        } as Lote;
      }

      // I22 + I23: Actualizar tasa POR_REPUESTO y precio_venta del producto
      const tasas = await tx
        .select()
        .from(tasaPrecioTable)
        .where(
          and(
            eq(tasaPrecioTable.tenant_id, tenantId),
            eq(tasaPrecioTable.nivel, "POR_REPUESTO"),
            eq(tasaPrecioTable.producto_id, data.producto_id)
          )
        )
        .limit(1);

      const tasa = tasas[0];
      if (tasa) {
        const prevCosto = tasa.ultimo_costo ? Number(tasa.ultimo_costo) : data.precio_unitario;
        const nuevoPromedio = (prevCosto + data.precio_unitario) / 2;
        const nuevoPrecio = calcularPrecioVenta(
          data.precio_unitario,
          tasa.tasa_tipo,
          Number(tasa.tasa_valor)
        );

        await tx
          .update(tasaPrecioTable)
          .set({
            ultimo_costo: String(data.precio_unitario.toFixed(2)),
            promedio_historico: String(nuevoPromedio.toFixed(2)),
            precio_venta: String(nuevoPrecio.toFixed(2)),
            updated_at: new Date(),
          })
          .where(eq(tasaPrecioTable.id, tasa.id));

        await tx
          .update(productoTable)
          .set({ precio_venta: String(nuevoPrecio.toFixed(2)), updated_at: new Date() })
          .where(
            and(eq(productoTable.id, data.producto_id), eq(productoTable.tenant_id, tenantId))
          );
      }

      return { lote, editado };
    });
  }

  // ── GRUPO 7: Ingreso automático por OC (I13, I14, I22, I23) ─────────────────

  async ingresoOC(tenantId: string, ordenCompraId: string, usuarioId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ocRows = await tx
        .select({
          id: ordenCompraTable.id,
          estado: ordenCompraTable.estado,
          proveedor_id: ordenCompraTable.proveedor_id,
        })
        .from(ordenCompraTable)
        .where(
          and(eq(ordenCompraTable.id, ordenCompraId), eq(ordenCompraTable.tenant_id, tenantId))
        )
        .limit(1);

      const oc = ocRows[0];
      if (!oc) throw new Error("OC no encontrada");
      if (oc.estado !== "TERMINADA")
        throw new Error("La OC debe estar en estado TERMINADA para registrar ingreso");

      // Obtener sucursal del tenant
      const sucursales = await tx
        .select({ id: sucursalTable.id })
        .from(sucursalTable)
        .where(and(eq(sucursalTable.tenant_id, tenantId), eq(sucursalTable.activo, true)))
        .limit(1);

      const sucursalId = sucursales[0]?.id;
      if (!sucursalId) throw new Error("No hay sucursal activa para el tenant");

      // Obtener items de la OC (cantidad_recibida > 0)
      const confirmaciones = (await tx.execute(
        sql`SELECT occ.producto_id, occ.cantidad_recibida, occ.precio_unitario::float AS precio_unitario,
                   p.codigo AS codigo_producto, p.tipo AS tipo_producto, p.componente_id
            FROM orden_compra_confirmacion occ
            JOIN producto p ON p.id = occ.producto_id
            WHERE occ.orden_compra_id = ${ordenCompraId}::uuid
              AND occ.cantidad_recibida > 0`
      )) as Array<{
        producto_id: string;
        cantidad_recibida: number;
        precio_unitario: number;
        codigo_producto: string;
        tipo_producto: string;
        componente_id: string | null;
      }>;

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      for (const item of confirmaciones) {
        // I13: SIEMPRE crear lote nuevo
        const lotesMismoDia = await contarLotesMismoDia(tx, tenantId, item.producto_id, todayStr);
        const correlativo = lotesMismoDia + 1;
        const sku = buildSku(item.codigo_producto, today, correlativo);

        const loteInserted = await tx
          .insert(loteTable)
          .values({
            tenant_id: tenantId,
            producto_id: item.producto_id,
            sucursal_id: sucursalId,
            orden_compra_id: ordenCompraId,
            sku,
            correlativo,
            cantidad_inicial: item.cantidad_recibida,
            cantidad_actual: item.cantidad_recibida,
            precio_unitario: String(item.precio_unitario),
            fecha_ingreso: todayStr,
          })
          .returning({ id: loteTable.id });

        const loteId = loteInserted[0]?.id;
        if (!loteId) continue;

        await tx.insert(movimientoInventarioTable).values({
          tenant_id: tenantId,
          producto_id: item.producto_id,
          lote_id: loteId,
          sucursal_id: sucursalId,
          tipo: "INGRESO",
          cantidad: item.cantidad_recibida,
          referencia_tipo: "ORDEN_COMPRA",
          referencia_id: ordenCompraId,
          notas: "Ingreso por OC",
          usuario_id: usuarioId,
        });

        // I22 + I23: Actualizar tasa POR_REPUESTO y precio_venta
        const tasas = await tx
          .select()
          .from(tasaPrecioTable)
          .where(
            and(
              eq(tasaPrecioTable.tenant_id, tenantId),
              eq(tasaPrecioTable.nivel, "POR_REPUESTO"),
              eq(tasaPrecioTable.producto_id, item.producto_id)
            )
          )
          .limit(1);

        const tasa = tasas[0];
        if (tasa) {
          const prevCosto = tasa.ultimo_costo ? Number(tasa.ultimo_costo) : item.precio_unitario;
          const nuevoPromedio = (prevCosto + item.precio_unitario) / 2;
          const nuevoPrecio = calcularPrecioVenta(
            item.precio_unitario,
            tasa.tasa_tipo,
            Number(tasa.tasa_valor)
          );

          await tx
            .update(tasaPrecioTable)
            .set({
              ultimo_costo: String(item.precio_unitario.toFixed(2)),
              promedio_historico: String(nuevoPromedio.toFixed(2)),
              precio_venta: String(nuevoPrecio.toFixed(2)),
              updated_at: new Date(),
            })
            .where(eq(tasaPrecioTable.id, tasa.id));

          await tx
            .update(productoTable)
            .set({ precio_venta: String(nuevoPrecio.toFixed(2)), updated_at: new Date() })
            .where(
              and(eq(productoTable.id, item.producto_id), eq(productoTable.tenant_id, tenantId))
            );
        }
      }

      // I14: OC pasa a INGRESADA y solicitudes a COMPLETADA
      await tx
        .update(ordenCompraTable)
        .set({ estado: "INGRESADA", updated_at: new Date() })
        .where(
          and(eq(ordenCompraTable.id, ordenCompraId), eq(ordenCompraTable.tenant_id, tenantId))
        );

      await tx
        .update(solicitudCompraTable)
        .set({ estado: "COMPLETADA", updated_at: new Date() })
        .where(
          and(
            eq(solicitudCompraTable.orden_compra_id, ordenCompraId),
            eq(solicitudCompraTable.tenant_id, tenantId)
          )
        );
    });
  }

  // ── Movimientos ──────────────────────────────────────────────────────────────

  async listMovimientos(
    tenantId: string,
    params: ListMovimientosParams
  ): Promise<ListMovimientosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(movimientoInventarioTable.tenant_id, tenantId)];
      if (params.producto_id)
        conditions.push(eq(movimientoInventarioTable.producto_id, params.producto_id));
      if (params.tipo) conditions.push(eq(movimientoInventarioTable.tipo, params.tipo));
      if (params.sucursal_id)
        conditions.push(eq(movimientoInventarioTable.sucursal_id, params.sucursal_id));
      if (params.desde)
        conditions.push(gte(movimientoInventarioTable.created_at, new Date(params.desde)));
      if (params.hasta)
        conditions.push(
          lte(movimientoInventarioTable.created_at, new Date(`${params.hasta}T23:59:59`))
        );

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(movimientoInventarioTable).where(where),
        tx
          .select({
            id: movimientoInventarioTable.id,
            tenant_id: movimientoInventarioTable.tenant_id,
            producto_id: movimientoInventarioTable.producto_id,
            producto_nombre: productoTable.nombre,
            lote_id: movimientoInventarioTable.lote_id,
            sucursal_id: movimientoInventarioTable.sucursal_id,
            tipo: movimientoInventarioTable.tipo,
            cantidad: movimientoInventarioTable.cantidad,
            referencia_tipo: movimientoInventarioTable.referencia_tipo,
            referencia_id: movimientoInventarioTable.referencia_id,
            notas: movimientoInventarioTable.notas,
            usuario_id: movimientoInventarioTable.usuario_id,
            created_at: movimientoInventarioTable.created_at,
          })
          .from(movimientoInventarioTable)
          .leftJoin(productoTable, eq(movimientoInventarioTable.producto_id, productoTable.id))
          .where(where)
          .orderBy(movimientoInventarioTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return {
        items: rows.map((r) => ({
          ...r,
          producto_nombre: r.producto_nombre ?? undefined,
        })) as MovimientoInventario[],
        total: countRows[0]?.total ?? 0,
      };
    });
  }

  async createMovimiento(
    tenantId: string,
    data: CreateMovimientoData
  ): Promise<MovimientoInventario> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const inserted = await tx
        .insert(movimientoInventarioTable)
        .values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          lote_id: data.lote_id ?? null,
          sucursal_id: data.sucursal_id,
          tipo: data.tipo,
          cantidad: data.cantidad,
          referencia_tipo: data.referencia_tipo ?? null,
          referencia_id: data.referencia_id ?? null,
          notas: data.notas ?? null,
          usuario_id: data.usuario_id,
        })
        .returning({ id: movimientoInventarioTable.id });

      const movId = inserted[0]?.id;
      if (!movId) throw new Error("Failed to insert movimiento");

      if (data.lote_id && data.cantidad < 0) {
        await tx.execute(
          sql`UPDATE lote SET cantidad_actual = cantidad_actual + ${data.cantidad}, updated_at = NOW()
              WHERE id = ${data.lote_id}::uuid AND tenant_id = ${tenantId}::uuid`
        );
      }

      const rows = await tx
        .select({
          id: movimientoInventarioTable.id,
          tenant_id: movimientoInventarioTable.tenant_id,
          producto_id: movimientoInventarioTable.producto_id,
          producto_nombre: productoTable.nombre,
          lote_id: movimientoInventarioTable.lote_id,
          sucursal_id: movimientoInventarioTable.sucursal_id,
          tipo: movimientoInventarioTable.tipo,
          cantidad: movimientoInventarioTable.cantidad,
          referencia_tipo: movimientoInventarioTable.referencia_tipo,
          referencia_id: movimientoInventarioTable.referencia_id,
          notas: movimientoInventarioTable.notas,
          usuario_id: movimientoInventarioTable.usuario_id,
          created_at: movimientoInventarioTable.created_at,
        })
        .from(movimientoInventarioTable)
        .leftJoin(productoTable, eq(movimientoInventarioTable.producto_id, productoTable.id))
        .where(eq(movimientoInventarioTable.id, movId));

      const row = rows[0];
      if (!row) throw new Error("Movimiento not found after insert");

      return { ...row, producto_nombre: row.producto_nombre ?? undefined } as MovimientoInventario;
    });
  }

  // ── GRUPO 4: Proveedores sugeridos (I7) ──────────────────────────────────────

  async getProveedoresSugeridos(
    tenantId: string,
    productoId: string
  ): Promise<ProveedoresSugeridos> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const prodRows = await tx
        .select({
          categoria_id: productoTable.categoria_id,
          componente_id: productoTable.componente_id,
        })
        .from(productoTable)
        .where(and(eq(productoTable.id, productoId), eq(productoTable.tenant_id, tenantId)))
        .limit(1);

      const prod = prodRows[0];
      if (!prod) return { seguros: [], posibles: [] };

      // SEGUROS: categoría + componente coinciden
      const segurosRows = await tx
        .select({
          proveedor_id: proveedorTable.id,
          razon_social: proveedorTable.razon_social,
          ruc: proveedorTable.ruc,
          calificacion: proveedorTable.calificacion,
          telefono: proveedorTable.telefono,
        })
        .from(proveedorLineaTable)
        .innerJoin(proveedorTable, eq(proveedorLineaTable.proveedor_id, proveedorTable.id))
        .where(
          and(
            eq(proveedorLineaTable.tenant_id, tenantId),
            prod.categoria_id ? eq(proveedorLineaTable.categoria_id, prod.categoria_id) : sql`true`,
            prod.componente_id
              ? eq(proveedorLineaTable.componente_id, prod.componente_id)
              : isNotNull(proveedorLineaTable.componente_id),
            eq(proveedorTable.activo, true)
          )
        )
        .groupBy(
          proveedorTable.id,
          proveedorTable.razon_social,
          proveedorTable.ruc,
          proveedorTable.calificacion,
          proveedorTable.telefono
        );

      const seguroIds = new Set(segurosRows.map((r) => r.proveedor_id));

      // POSIBLES: solo categoría, distintos a los seguros
      const posiblesRows = await tx
        .select({
          proveedor_id: proveedorTable.id,
          razon_social: proveedorTable.razon_social,
          ruc: proveedorTable.ruc,
          calificacion: proveedorTable.calificacion,
          telefono: proveedorTable.telefono,
        })
        .from(proveedorLineaTable)
        .innerJoin(proveedorTable, eq(proveedorLineaTable.proveedor_id, proveedorTable.id))
        .where(
          and(
            eq(proveedorLineaTable.tenant_id, tenantId),
            prod.categoria_id ? eq(proveedorLineaTable.categoria_id, prod.categoria_id) : sql`true`,
            eq(proveedorTable.activo, true)
          )
        )
        .groupBy(
          proveedorTable.id,
          proveedorTable.razon_social,
          proveedorTable.ruc,
          proveedorTable.calificacion,
          proveedorTable.telefono
        );

      return {
        seguros: segurosRows.map((r) => ({
          proveedor_id: r.proveedor_id,
          razon_social: r.razon_social,
          ruc: r.ruc,
          calificacion: r.calificacion,
          telefono: r.telefono,
        })),
        posibles: posiblesRows
          .filter((r) => !seguroIds.has(r.proveedor_id))
          .map((r) => ({
            proveedor_id: r.proveedor_id,
            razon_social: r.razon_social,
            ruc: r.ruc,
            calificacion: r.calificacion,
            telefono: r.telefono,
          })),
      };
    });
  }
}
