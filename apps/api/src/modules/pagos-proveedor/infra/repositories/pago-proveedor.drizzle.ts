import type { DbClient } from "@kallpasoft/db";
import {
  ordenCompra as ordenCompraTable,
  pagoProveedor as pagoProveedorTable,
  proveedor as proveedorTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import type { PagoProveedor } from "../../domain/entities/pago-proveedor.js";
import type {
  CreatePagoData,
  IPagoProveedorRepository,
  ListPagosParams,
  ListPagosResult,
} from "../../domain/ports/pago-proveedor.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class PagoProveedorDrizzleRepository implements IPagoProveedorRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListPagosParams): Promise<ListPagosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(pagoProveedorTable.tenant_id, tenantId)];

      if (params.proveedor_id) {
        conditions.push(eq(pagoProveedorTable.proveedor_id, params.proveedor_id));
      }
      if (params.desde) {
        conditions.push(gte(pagoProveedorTable.fecha_pago, params.desde));
      }
      if (params.hasta) {
        conditions.push(lte(pagoProveedorTable.fecha_pago, params.hasta));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(pagoProveedorTable).where(where),
        tx
          .select({
            id: pagoProveedorTable.id,
            tenant_id: pagoProveedorTable.tenant_id,
            orden_compra_id: pagoProveedorTable.orden_compra_id,
            orden_compra_codigo: ordenCompraTable.codigo,
            proveedor_id: pagoProveedorTable.proveedor_id,
            proveedor_nombre: proveedorTable.razon_social,
            monto: pagoProveedorTable.monto,
            metodo_pago: pagoProveedorTable.metodo_pago,
            referencia: pagoProveedorTable.referencia,
            comprobante_url: pagoProveedorTable.comprobante_url,
            fecha_pago: pagoProveedorTable.fecha_pago,
            notas: pagoProveedorTable.notas,
            usuario_id: pagoProveedorTable.usuario_id,
            created_at: pagoProveedorTable.created_at,
          })
          .from(pagoProveedorTable)
          .leftJoin(ordenCompraTable, eq(pagoProveedorTable.orden_compra_id, ordenCompraTable.id))
          .leftJoin(proveedorTable, eq(pagoProveedorTable.proveedor_id, proveedorTable.id))
          .where(where)
          .orderBy(pagoProveedorTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items = rows.map((r) => ({
        ...r,
        orden_compra_codigo: r.orden_compra_codigo ?? undefined,
        proveedor_nombre: r.proveedor_nombre ?? undefined,
      }));

      return { items: items as PagoProveedor[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreatePagoData): Promise<PagoProveedor> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // Verificar que la OC existe y está en PENDIENTE_PAGO
      const ocRows = await tx
        .select({
          id: ordenCompraTable.id,
          proveedor_id: ordenCompraTable.proveedor_id,
          estado: ordenCompraTable.estado,
        })
        .from(ordenCompraTable)
        .where(
          and(
            eq(ordenCompraTable.id, data.orden_compra_id),
            eq(ordenCompraTable.tenant_id, tenantId)
          )
        );

      const oc = ocRows[0];
      if (!oc || oc.estado !== "PENDIENTE_PAGO") {
        throw new Error("La orden de compra no existe o no está en estado PENDIENTE_PAGO");
      }

      // Insertar pago
      const inserted = await tx
        .insert(pagoProveedorTable)
        .values({
          tenant_id: tenantId,
          orden_compra_id: data.orden_compra_id,
          proveedor_id: oc.proveedor_id,
          monto: String(data.monto.toFixed(2)),
          metodo_pago: data.metodo_pago,
          referencia: data.referencia ?? null,
          comprobante_url: data.comprobante_url ?? null,
          fecha_pago: data.fecha_pago,
          notas: data.notas ?? null,
          usuario_id: data.usuario_id,
        })
        .returning({ id: pagoProveedorTable.id });

      const pagoId = inserted[0]?.id;
      if (!pagoId) throw new Error("Failed to insert pago_proveedor");

      // OC pasa a TERMINADA
      await tx
        .update(ordenCompraTable)
        .set({ estado: "TERMINADA", updated_at: new Date() })
        .where(
          and(
            eq(ordenCompraTable.id, data.orden_compra_id),
            eq(ordenCompraTable.tenant_id, tenantId)
          )
        );

      // Retornar el pago con joins
      const pagoRows = await tx
        .select({
          id: pagoProveedorTable.id,
          tenant_id: pagoProveedorTable.tenant_id,
          orden_compra_id: pagoProveedorTable.orden_compra_id,
          orden_compra_codigo: ordenCompraTable.codigo,
          proveedor_id: pagoProveedorTable.proveedor_id,
          proveedor_nombre: proveedorTable.razon_social,
          monto: pagoProveedorTable.monto,
          metodo_pago: pagoProveedorTable.metodo_pago,
          referencia: pagoProveedorTable.referencia,
          comprobante_url: pagoProveedorTable.comprobante_url,
          fecha_pago: pagoProveedorTable.fecha_pago,
          notas: pagoProveedorTable.notas,
          usuario_id: pagoProveedorTable.usuario_id,
          created_at: pagoProveedorTable.created_at,
        })
        .from(pagoProveedorTable)
        .leftJoin(ordenCompraTable, eq(pagoProveedorTable.orden_compra_id, ordenCompraTable.id))
        .leftJoin(proveedorTable, eq(pagoProveedorTable.proveedor_id, proveedorTable.id))
        .where(eq(pagoProveedorTable.id, pagoId));

      const row = pagoRows[0];
      if (!row) throw new Error("Failed to fetch inserted pago_proveedor");

      return {
        ...row,
        orden_compra_codigo: row.orden_compra_codigo ?? undefined,
        proveedor_nombre: row.proveedor_nombre ?? undefined,
      } as PagoProveedor;
    });
  }
}
