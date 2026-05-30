import type { DbClient } from "@kallpasoft/db";
import {
  lote as loteTable,
  movimientoInventario as movimientoInventarioTable,
  ordenCompraConfirmacion as ordenCompraConfirmacionTable,
  ordenCompra as ordenCompraTable,
  producto as productoTable,
  proveedor as proveedorTable,
  solicitudCompra as solicitudCompraTable,
  sucursal as sucursalTable,
} from "@kallpasoft/db";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import type { OrdenCompra, OrdenCompraConfirmacion } from "../../domain/entities/orden-compra.js";
import type {
  ConfirmarOrdenItemData,
  GenerarOrdenData,
  IOrdenCompraRepository,
  ListOrdenesParams,
  ListOrdenesResult,
} from "../../domain/ports/orden-compra.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function nextOcSeq(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM orden_compra WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `OC-${String(n).padStart(4, "0")}`;
}

export class OrdenCompraDrizzleRepository implements IOrdenCompraRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListOrdenesParams): Promise<ListOrdenesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(ordenCompraTable.tenant_id, tenantId),
        eq(ordenCompraTable.activo, true),
      ];

      if (params.estado) {
        conditions.push(
          eq(
            ordenCompraTable.estado,
            params.estado as "GENERADA" | "ENVIADA" | "TERMINADA" | "INGRESADA" | "PENDIENTE_PAGO"
          )
        );
      }
      if (params.proveedor_id) {
        conditions.push(eq(ordenCompraTable.proveedor_id, params.proveedor_id));
      }
      if (params.desde) {
        conditions.push(gte(ordenCompraTable.fecha_emision, params.desde));
      }
      if (params.hasta) {
        conditions.push(lte(ordenCompraTable.fecha_emision, params.hasta));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(ordenCompraTable).where(where),
        tx
          .select({
            id: ordenCompraTable.id,
            tenant_id: ordenCompraTable.tenant_id,
            codigo: ordenCompraTable.codigo,
            proveedor_id: ordenCompraTable.proveedor_id,
            proveedor_nombre: proveedorTable.razon_social,
            estado: ordenCompraTable.estado,
            fecha_emision: ordenCompraTable.fecha_emision,
            fecha_entrega_estimada: ordenCompraTable.fecha_entrega_estimada,
            subtotal: ordenCompraTable.subtotal,
            igv: ordenCompraTable.igv,
            total: ordenCompraTable.total,
            notas: ordenCompraTable.notas,
            usuario_id: ordenCompraTable.usuario_id,
            activo: ordenCompraTable.activo,
            created_at: ordenCompraTable.created_at,
            updated_at: ordenCompraTable.updated_at,
          })
          .from(ordenCompraTable)
          .leftJoin(proveedorTable, eq(ordenCompraTable.proveedor_id, proveedorTable.id))
          .where(where)
          .orderBy(ordenCompraTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: rows as OrdenCompra[], total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<OrdenCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          id: ordenCompraTable.id,
          tenant_id: ordenCompraTable.tenant_id,
          codigo: ordenCompraTable.codigo,
          proveedor_id: ordenCompraTable.proveedor_id,
          proveedor_nombre: proveedorTable.razon_social,
          estado: ordenCompraTable.estado,
          fecha_emision: ordenCompraTable.fecha_emision,
          fecha_entrega_estimada: ordenCompraTable.fecha_entrega_estimada,
          subtotal: ordenCompraTable.subtotal,
          igv: ordenCompraTable.igv,
          total: ordenCompraTable.total,
          notas: ordenCompraTable.notas,
          usuario_id: ordenCompraTable.usuario_id,
          activo: ordenCompraTable.activo,
          created_at: ordenCompraTable.created_at,
          updated_at: ordenCompraTable.updated_at,
        })
        .from(ordenCompraTable)
        .leftJoin(proveedorTable, eq(ordenCompraTable.proveedor_id, proveedorTable.id))
        .where(and(eq(ordenCompraTable.id, id), eq(ordenCompraTable.tenant_id, tenantId)));

      if (!rows[0]) return null;

      const confirmaciones = await tx
        .select({
          id: ordenCompraConfirmacionTable.id,
          tenant_id: ordenCompraConfirmacionTable.tenant_id,
          orden_compra_id: ordenCompraConfirmacionTable.orden_compra_id,
          producto_id: ordenCompraConfirmacionTable.producto_id,
          producto_nombre: productoTable.nombre,
          cantidad_ordenada: ordenCompraConfirmacionTable.cantidad_ordenada,
          cantidad_recibida: ordenCompraConfirmacionTable.cantidad_recibida,
          precio_unitario: ordenCompraConfirmacionTable.precio_unitario,
          conforme: ordenCompraConfirmacionTable.conforme,
          notas: ordenCompraConfirmacionTable.notas,
          created_at: ordenCompraConfirmacionTable.created_at,
          updated_at: ordenCompraConfirmacionTable.updated_at,
        })
        .from(ordenCompraConfirmacionTable)
        .leftJoin(productoTable, eq(ordenCompraConfirmacionTable.producto_id, productoTable.id))
        .where(eq(ordenCompraConfirmacionTable.orden_compra_id, id));

      return {
        ...(rows[0] as OrdenCompra),
        confirmaciones: confirmaciones as OrdenCompraConfirmacion[],
      };
    });
  }

  async generar(tenantId: string, data: GenerarOrdenData): Promise<OrdenCompra> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await nextOcSeq(tx, tenantId);
      const today = new Date().toISOString().slice(0, 10);

      const IGV_RATE = 0.18;
      const subtotal = data.items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0);
      const igv = subtotal * IGV_RATE;
      const total = subtotal + igv;

      const insertedRows = await tx
        .insert(ordenCompraTable)
        .values({
          tenant_id: tenantId,
          codigo,
          proveedor_id: data.proveedor_id,
          estado: "GENERADA",
          fecha_emision: today,
          fecha_entrega_estimada: data.fecha_entrega_estimada ?? null,
          subtotal: String(subtotal.toFixed(2)),
          igv: String(igv.toFixed(2)),
          total: String(total.toFixed(2)),
          notas: data.notas ?? null,
          usuario_id: data.usuario_id,
        })
        .returning({ id: ordenCompraTable.id });

      const ordenId = insertedRows[0]?.id;
      if (!ordenId) throw new Error("Failed to insert orden_compra");

      await tx.insert(ordenCompraConfirmacionTable).values(
        data.items.map((item) => ({
          tenant_id: tenantId,
          orden_compra_id: ordenId,
          producto_id: item.producto_id,
          cantidad_ordenada: item.cantidad,
          cantidad_recibida: 0,
          precio_unitario: String(item.precio_unitario),
        }))
      );

      if (data.solicitud_ids.length > 0) {
        for (const solId of data.solicitud_ids) {
          await tx
            .update(solicitudCompraTable)
            .set({ estado: "EN_OC", orden_compra_id: ordenId, updated_at: new Date() })
            .where(
              and(eq(solicitudCompraTable.id, solId), eq(solicitudCompraTable.tenant_id, tenantId))
            );
        }
      }

      const result = await this.findById(tenantId, ordenId);
      return result as OrdenCompra;
    });
  }

  async updateEstado(tenantId: string, id: string, estado: string): Promise<OrdenCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select({ estado: ordenCompraTable.estado })
        .from(ordenCompraTable)
        .where(and(eq(ordenCompraTable.id, id), eq(ordenCompraTable.tenant_id, tenantId)));

      if (!existing[0]) return null;

      const validTransitions: Record<string, string[]> = {
        GENERADA: ["ENVIADA"],
        ENVIADA: ["TERMINADA"],
        TERMINADA: ["INGRESADA"],
        INGRESADA: ["PENDIENTE_PAGO"],
        PENDIENTE_PAGO: [],
      };

      const current = existing[0].estado;
      if (!validTransitions[current]?.includes(estado)) return null;

      await tx
        .update(ordenCompraTable)
        .set({
          estado: estado as "GENERADA" | "ENVIADA" | "TERMINADA" | "INGRESADA" | "PENDIENTE_PAGO",
          updated_at: new Date(),
        })
        .where(and(eq(ordenCompraTable.id, id), eq(ordenCompraTable.tenant_id, tenantId)));

      return this.findById(tenantId, id);
    });
  }

  async confirmar(
    tenantId: string,
    id: string,
    items: ConfirmarOrdenItemData[]
  ): Promise<OrdenCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select({ estado: ordenCompraTable.estado })
        .from(ordenCompraTable)
        .where(and(eq(ordenCompraTable.id, id), eq(ordenCompraTable.tenant_id, tenantId)));

      if (!existing[0] || existing[0].estado !== "TERMINADA") return null;

      const today = new Date().toISOString().slice(0, 10);

      for (const item of items) {
        const existingConf = await tx
          .select({ id: ordenCompraConfirmacionTable.id })
          .from(ordenCompraConfirmacionTable)
          .where(
            and(
              eq(ordenCompraConfirmacionTable.orden_compra_id, id),
              eq(ordenCompraConfirmacionTable.producto_id, item.producto_id)
            )
          );

        if (existingConf[0]) {
          await tx
            .update(ordenCompraConfirmacionTable)
            .set({
              cantidad_recibida: item.cantidad_recibida,
              precio_unitario: String(item.precio_unitario),
              conforme: item.conforme,
              notas: item.notas ?? null,
              updated_at: new Date(),
            })
            .where(eq(ordenCompraConfirmacionTable.id, existingConf[0].id));
        }
      }

      // Marcar INGRESADA y generar lotes + movimientos si hay items recibidos
      await tx
        .update(ordenCompraTable)
        .set({ estado: "INGRESADA", updated_at: new Date() })
        .where(and(eq(ordenCompraTable.id, id), eq(ordenCompraTable.tenant_id, tenantId)));

      // Obtener primera sucursal del tenant para los lotes
      const sucursales = await tx
        .select({ id: sucursalTable.id })
        .from(sucursalTable)
        .where(and(eq(sucursalTable.tenant_id, tenantId), eq(sucursalTable.activo, true)))
        .limit(1);

      const sucursalId = sucursales[0]?.id;

      if (sucursalId) {
        for (const item of items) {
          if (item.cantidad_recibida <= 0) continue;

          const sku = `LOT-${id.slice(0, 8)}-${item.producto_id.slice(0, 8)}`;

          const loteInserted = await tx
            .insert(loteTable)
            .values({
              tenant_id: tenantId,
              producto_id: item.producto_id,
              sucursal_id: sucursalId,
              orden_compra_id: id,
              sku,
              cantidad_inicial: item.cantidad_recibida,
              cantidad_actual: item.cantidad_recibida,
              precio_unitario: String(item.precio_unitario),
              fecha_ingreso: today,
            })
            .returning({ id: loteTable.id });

          const loteId = loteInserted[0]?.id;
          if (!loteId) continue;

          // Usuario del tenant que generó la OC
          const ordenRow = await tx
            .select({ usuario_id: ordenCompraTable.usuario_id })
            .from(ordenCompraTable)
            .where(eq(ordenCompraTable.id, id))
            .limit(1);

          const usuarioId = ordenRow[0]?.usuario_id;
          if (!usuarioId) continue;

          await tx.insert(movimientoInventarioTable).values({
            tenant_id: tenantId,
            producto_id: item.producto_id,
            lote_id: loteId,
            sucursal_id: sucursalId,
            tipo: "INGRESO",
            cantidad: item.cantidad_recibida,
            referencia_tipo: "ORDEN_COMPRA",
            referencia_id: id,
            notas: `Ingreso por OC confirmada`,
            usuario_id: usuarioId,
          });
        }

        // Marcar solicitudes como COMPLETADA
        await tx
          .update(solicitudCompraTable)
          .set({ estado: "COMPLETADA", updated_at: new Date() })
          .where(
            and(
              eq(solicitudCompraTable.orden_compra_id, id),
              eq(solicitudCompraTable.tenant_id, tenantId)
            )
          );
      }

      return this.findById(tenantId, id);
    });
  }
}
