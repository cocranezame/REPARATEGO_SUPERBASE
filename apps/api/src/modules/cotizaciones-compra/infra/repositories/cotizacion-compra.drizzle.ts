import type { DbClient } from "@kallpasoft/db";
import {
  cotizacionCompraDetalle as cotizacionCompraDetalleTable,
  cotizacionCompra as cotizacionCompraTable,
  producto as productoTable,
  proveedor as proveedorTable,
} from "@kallpasoft/db";
import { and, count, eq, sql } from "drizzle-orm";
import type {
  CotizacionCompra,
  CotizacionCompraDetalle,
} from "../../domain/entities/cotizacion-compra.js";
import type {
  CotizarItemData,
  CreateCotizacionCompraData,
  ICotizacionCompraRepository,
  ListCotizacionesParams,
  ListCotizacionesResult,
} from "../../domain/ports/cotizacion-compra.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function nextCodigoSeq(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM cotizacion_compra WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `COT-C-${String(n).padStart(4, "0")}`;
}

export class CotizacionCompraDrizzleRepository implements ICotizacionCompraRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListCotizacionesParams): Promise<ListCotizacionesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(cotizacionCompraTable.tenant_id, tenantId),
        eq(cotizacionCompraTable.activo, true),
      ];

      if (params.proveedor_id) {
        conditions.push(eq(cotizacionCompraTable.proveedor_id, params.proveedor_id));
      }
      if (params.estado) {
        conditions.push(
          eq(cotizacionCompraTable.estado, params.estado as "PENDIENTE" | "COTIZADA" | "VENCIDA")
        );
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(cotizacionCompraTable).where(where),
        tx
          .select({
            id: cotizacionCompraTable.id,
            tenant_id: cotizacionCompraTable.tenant_id,
            codigo: cotizacionCompraTable.codigo,
            proveedor_id: cotizacionCompraTable.proveedor_id,
            proveedor_nombre: proveedorTable.razon_social,
            estado: cotizacionCompraTable.estado,
            fecha_solicitud: cotizacionCompraTable.fecha_solicitud,
            fecha_respuesta: cotizacionCompraTable.fecha_respuesta,
            fecha_vencimiento: cotizacionCompraTable.fecha_vencimiento,
            notas: cotizacionCompraTable.notas,
            usuario_id: cotizacionCompraTable.usuario_id,
            activo: cotizacionCompraTable.activo,
            created_at: cotizacionCompraTable.created_at,
            updated_at: cotizacionCompraTable.updated_at,
          })
          .from(cotizacionCompraTable)
          .leftJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
          .where(where)
          .orderBy(cotizacionCompraTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: rows as CotizacionCompra[], total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<CotizacionCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          id: cotizacionCompraTable.id,
          tenant_id: cotizacionCompraTable.tenant_id,
          codigo: cotizacionCompraTable.codigo,
          proveedor_id: cotizacionCompraTable.proveedor_id,
          proveedor_nombre: proveedorTable.razon_social,
          estado: cotizacionCompraTable.estado,
          fecha_solicitud: cotizacionCompraTable.fecha_solicitud,
          fecha_respuesta: cotizacionCompraTable.fecha_respuesta,
          fecha_vencimiento: cotizacionCompraTable.fecha_vencimiento,
          notas: cotizacionCompraTable.notas,
          usuario_id: cotizacionCompraTable.usuario_id,
          activo: cotizacionCompraTable.activo,
          created_at: cotizacionCompraTable.created_at,
          updated_at: cotizacionCompraTable.updated_at,
        })
        .from(cotizacionCompraTable)
        .leftJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
        .where(
          and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId))
        );

      if (!rows[0]) return null;

      const detalles = await tx
        .select({
          id: cotizacionCompraDetalleTable.id,
          tenant_id: cotizacionCompraDetalleTable.tenant_id,
          cotizacion_compra_id: cotizacionCompraDetalleTable.cotizacion_compra_id,
          producto_id: cotizacionCompraDetalleTable.producto_id,
          producto_nombre: productoTable.nombre,
          cantidad: cotizacionCompraDetalleTable.cantidad,
          precio_unitario: cotizacionCompraDetalleTable.precio_unitario,
          subtotal: cotizacionCompraDetalleTable.subtotal,
          notas: cotizacionCompraDetalleTable.notas,
          created_at: cotizacionCompraDetalleTable.created_at,
        })
        .from(cotizacionCompraDetalleTable)
        .leftJoin(productoTable, eq(cotizacionCompraDetalleTable.producto_id, productoTable.id))
        .where(eq(cotizacionCompraDetalleTable.cotizacion_compra_id, id))
        .orderBy(cotizacionCompraDetalleTable.created_at);

      return {
        ...(rows[0] as CotizacionCompra),
        detalles: detalles as CotizacionCompraDetalle[],
      };
    });
  }

  async create(tenantId: string, data: CreateCotizacionCompraData): Promise<CotizacionCompra> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await nextCodigoSeq(tx, tenantId);
      const today = new Date().toISOString().slice(0, 10);

      const insertedRows = await tx
        .insert(cotizacionCompraTable)
        .values({
          tenant_id: tenantId,
          codigo,
          proveedor_id: data.proveedor_id,
          usuario_id: data.usuario_id,
          estado: "PENDIENTE",
          fecha_solicitud: today,
          fecha_vencimiento: data.fecha_vencimiento ?? null,
          notas: data.notas ?? null,
        })
        .returning();

      const insertedId = insertedRows[0]?.id;
      if (!insertedId) throw new Error("Failed to insert cotizacion_compra");

      await tx.insert(cotizacionCompraDetalleTable).values(
        data.items.map((item) => ({
          tenant_id: tenantId,
          cotizacion_compra_id: insertedId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        }))
      );

      const result = await this.findById(tenantId, insertedId);
      return result as CotizacionCompra;
    });
  }

  async cotizar(
    tenantId: string,
    id: string,
    items: CotizarItemData[]
  ): Promise<CotizacionCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select({ estado: cotizacionCompraTable.estado })
        .from(cotizacionCompraTable)
        .where(
          and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId))
        );

      if (!existing[0] || existing[0].estado !== "PENDIENTE") return null;

      for (const item of items) {
        const subtotal =
          item.precio_unitario > 0
            ? await tx
                .select({ cantidad: cotizacionCompraDetalleTable.cantidad })
                .from(cotizacionCompraDetalleTable)
                .where(
                  and(
                    eq(cotizacionCompraDetalleTable.id, item.detalle_id),
                    eq(cotizacionCompraDetalleTable.cotizacion_compra_id, id)
                  )
                )
                .then((rows) => (rows[0] ? String(item.precio_unitario * rows[0].cantidad) : null))
            : null;

        await tx
          .update(cotizacionCompraDetalleTable)
          .set({
            precio_unitario: String(item.precio_unitario),
            subtotal: subtotal,
          })
          .where(
            and(
              eq(cotizacionCompraDetalleTable.id, item.detalle_id),
              eq(cotizacionCompraDetalleTable.cotizacion_compra_id, id)
            )
          );
      }

      const today = new Date().toISOString().slice(0, 10);
      await tx
        .update(cotizacionCompraTable)
        .set({ estado: "COTIZADA", fecha_respuesta: today, updated_at: new Date() })
        .where(
          and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId))
        );

      return this.findById(tenantId, id);
    });
  }

  async listDetalles(tenantId: string, cotizacionId: string): Promise<CotizacionCompraDetalle[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select({
          id: cotizacionCompraDetalleTable.id,
          tenant_id: cotizacionCompraDetalleTable.tenant_id,
          cotizacion_compra_id: cotizacionCompraDetalleTable.cotizacion_compra_id,
          producto_id: cotizacionCompraDetalleTable.producto_id,
          producto_nombre: productoTable.nombre,
          cantidad: cotizacionCompraDetalleTable.cantidad,
          precio_unitario: cotizacionCompraDetalleTable.precio_unitario,
          subtotal: cotizacionCompraDetalleTable.subtotal,
          notas: cotizacionCompraDetalleTable.notas,
          created_at: cotizacionCompraDetalleTable.created_at,
        })
        .from(cotizacionCompraDetalleTable)
        .leftJoin(productoTable, eq(cotizacionCompraDetalleTable.producto_id, productoTable.id))
        .where(
          and(
            eq(cotizacionCompraDetalleTable.cotizacion_compra_id, cotizacionId),
            eq(cotizacionCompraDetalleTable.tenant_id, tenantId)
          )
        )
        .orderBy(cotizacionCompraDetalleTable.created_at);
      return rows as CotizacionCompraDetalle[];
    });
  }
}
