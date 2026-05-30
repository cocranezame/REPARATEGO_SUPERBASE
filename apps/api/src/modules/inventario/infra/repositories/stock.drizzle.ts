import type { DbClient } from "@kallpasoft/db";
import {
  lote as loteTable,
  movimientoInventario as movimientoInventarioTable,
  producto as productoTable,
  sucursal as sucursalTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import type { Lote } from "../../domain/entities/lote.js";
import type { MovimientoInventario } from "../../domain/entities/movimiento-inventario.js";
import type { LoteDetalle, StockItem } from "../../domain/entities/stock.js";
import type {
  CreateLoteData,
  CreateMovimientoData,
  IStockRepository,
  ListLotesParams,
  ListLotesResult,
  ListMovimientosParams,
  ListMovimientosResult,
  ListStockParams,
} from "../../domain/ports/stock.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function nextLoteSeq(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM lote WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `LOT-${String(n).padStart(5, "0")}`;
}

export class StockDrizzleRepository implements IStockRepository {
  constructor(private readonly db: DbClient) {}

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

      if (params.alerta_minimo === true) {
        return items.filter((i) => i.en_alerta);
      }
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
      if (params.producto_id) {
        conditions.push(eq(loteTable.producto_id, params.producto_id));
      }
      if (params.sucursal_id) {
        conditions.push(eq(loteTable.sucursal_id, params.sucursal_id));
      }

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

      const sku = await nextLoteSeq(tx, tenantId);

      const inserted = await tx
        .insert(loteTable)
        .values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          sucursal_id: data.sucursal_id,
          orden_compra_id: data.orden_compra_id ?? null,
          sku,
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

  async listMovimientos(
    tenantId: string,
    params: ListMovimientosParams
  ): Promise<ListMovimientosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(movimientoInventarioTable.tenant_id, tenantId)];
      if (params.producto_id) {
        conditions.push(eq(movimientoInventarioTable.producto_id, params.producto_id));
      }
      if (params.tipo) {
        conditions.push(eq(movimientoInventarioTable.tipo, params.tipo));
      }
      if (params.sucursal_id) {
        conditions.push(eq(movimientoInventarioTable.sucursal_id, params.sucursal_id));
      }
      if (params.desde) {
        conditions.push(gte(movimientoInventarioTable.created_at, new Date(params.desde)));
      }
      if (params.hasta) {
        conditions.push(
          lte(movimientoInventarioTable.created_at, new Date(`${params.hasta}T23:59:59`))
        );
      }

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

      return {
        ...row,
        producto_nombre: row.producto_nombre ?? undefined,
      } as MovimientoInventario;
    });
  }
}
