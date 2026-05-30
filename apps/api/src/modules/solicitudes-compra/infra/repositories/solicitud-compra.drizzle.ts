import type { DbClient } from "@kallpasoft/db";
import { producto as productoTable, solicitudCompra as solicitudCompraTable } from "@kallpasoft/db";
import { and, count, eq, sql } from "drizzle-orm";
import type { SolicitudCompra } from "../../domain/entities/solicitud-compra.js";
import type {
  CreateSolicitudData,
  ISolicitudCompraRepository,
  ListSolicitudesParams,
  ListSolicitudesResult,
  UpdateSolicitudData,
} from "../../domain/ports/solicitud-compra.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class SolicitudCompraDrizzleRepository implements ISolicitudCompraRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListSolicitudesParams): Promise<ListSolicitudesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(solicitudCompraTable.tenant_id, tenantId),
        eq(solicitudCompraTable.activo, true),
      ];

      if (params.estado) {
        conditions.push(
          eq(solicitudCompraTable.estado, params.estado as "PENDIENTE" | "EN_OC" | "COMPLETADA")
        );
      }
      if (params.prioridad) {
        conditions.push(
          eq(
            solicitudCompraTable.prioridad,
            params.prioridad as "BAJA" | "NORMAL" | "ALTA" | "URGENTE"
          )
        );
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(solicitudCompraTable).where(where),
        tx
          .select({
            id: solicitudCompraTable.id,
            tenant_id: solicitudCompraTable.tenant_id,
            producto_id: solicitudCompraTable.producto_id,
            producto_nombre: productoTable.nombre,
            cantidad_solicitada: solicitudCompraTable.cantidad_solicitada,
            prioridad: solicitudCompraTable.prioridad,
            estado: solicitudCompraTable.estado,
            orden_compra_id: solicitudCompraTable.orden_compra_id,
            usuario_id: solicitudCompraTable.usuario_id,
            notas: solicitudCompraTable.notas,
            activo: solicitudCompraTable.activo,
            created_at: solicitudCompraTable.created_at,
            updated_at: solicitudCompraTable.updated_at,
          })
          .from(solicitudCompraTable)
          .leftJoin(productoTable, eq(solicitudCompraTable.producto_id, productoTable.id))
          .where(where)
          .orderBy(solicitudCompraTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: rows as SolicitudCompra[], total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<SolicitudCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          id: solicitudCompraTable.id,
          tenant_id: solicitudCompraTable.tenant_id,
          producto_id: solicitudCompraTable.producto_id,
          producto_nombre: productoTable.nombre,
          cantidad_solicitada: solicitudCompraTable.cantidad_solicitada,
          prioridad: solicitudCompraTable.prioridad,
          estado: solicitudCompraTable.estado,
          orden_compra_id: solicitudCompraTable.orden_compra_id,
          usuario_id: solicitudCompraTable.usuario_id,
          notas: solicitudCompraTable.notas,
          activo: solicitudCompraTable.activo,
          created_at: solicitudCompraTable.created_at,
          updated_at: solicitudCompraTable.updated_at,
        })
        .from(solicitudCompraTable)
        .leftJoin(productoTable, eq(solicitudCompraTable.producto_id, productoTable.id))
        .where(and(eq(solicitudCompraTable.id, id), eq(solicitudCompraTable.tenant_id, tenantId)));

      return (rows[0] as SolicitudCompra) ?? null;
    });
  }

  async create(tenantId: string, data: CreateSolicitudData): Promise<SolicitudCompra> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const inserted = await tx
        .insert(solicitudCompraTable)
        .values({
          tenant_id: tenantId,
          producto_id: data.producto_id,
          cantidad_solicitada: data.cantidad_solicitada,
          prioridad: (data.prioridad as "BAJA" | "NORMAL" | "ALTA" | "URGENTE") ?? "NORMAL",
          estado: "PENDIENTE",
          usuario_id: data.usuario_id,
          notas: data.notas ?? null,
        })
        .returning({ id: solicitudCompraTable.id });

      const insertedId = inserted[0]?.id;
      if (!insertedId) throw new Error("Failed to insert solicitud_compra");

      const result = await this.findById(tenantId, insertedId);
      return result as SolicitudCompra;
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateSolicitudData
  ): Promise<SolicitudCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select({ estado: solicitudCompraTable.estado })
        .from(solicitudCompraTable)
        .where(and(eq(solicitudCompraTable.id, id), eq(solicitudCompraTable.tenant_id, tenantId)));

      if (!existing[0] || existing[0].estado !== "PENDIENTE") return null;

      const updateData: Record<string, unknown> = { updated_at: new Date() };
      if (data.cantidad_solicitada !== undefined)
        updateData.cantidad_solicitada = data.cantidad_solicitada;
      if (data.prioridad !== undefined) updateData.prioridad = data.prioridad;
      if (data.notas !== undefined) updateData.notas = data.notas;

      await tx
        .update(solicitudCompraTable)
        .set(updateData)
        .where(and(eq(solicitudCompraTable.id, id), eq(solicitudCompraTable.tenant_id, tenantId)));

      return this.findById(tenantId, id);
    });
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const result = await tx
        .update(solicitudCompraTable)
        .set({ activo: false, updated_at: new Date() })
        .where(
          and(
            eq(solicitudCompraTable.id, id),
            eq(solicitudCompraTable.tenant_id, tenantId),
            eq(solicitudCompraTable.estado, "PENDIENTE")
          )
        )
        .returning({ id: solicitudCompraTable.id });

      return result.length > 0;
    });
  }

  async listStockBajo(
    tenantId: string
  ): Promise<
    Array<{ producto_id: string; nombre: string; stock_actual: number; stock_minimo: number }>
  > {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = (await tx.execute(
        sql`
          SELECT
            p.id AS producto_id,
            p.nombre,
            p.stock_minimo,
            COALESCE(SUM(l.cantidad_actual), 0)::int AS stock_actual
          FROM producto p
          LEFT JOIN lote l ON l.producto_id = p.id AND l.activo = true
          WHERE p.tenant_id = ${tenantId}::uuid
            AND p.activo = true
            AND p.stock_minimo > 0
          GROUP BY p.id, p.nombre, p.stock_minimo
          HAVING COALESCE(SUM(l.cantidad_actual), 0) <= p.stock_minimo
          ORDER BY stock_actual ASC
        `
      )) as Array<{
        producto_id: string;
        nombre: string;
        stock_actual: number;
        stock_minimo: number;
      }>;

      return rows;
    });
  }
}
