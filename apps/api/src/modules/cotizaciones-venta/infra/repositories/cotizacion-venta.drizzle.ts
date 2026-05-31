import type { DbClient } from "@kallpasoft/db";
import {
  cliente as clienteTable,
  cotizacionVentaItem as cotizacionVentaItemTable,
  cotizacionVenta as cotizacionVentaTable,
  usuario as usuarioTable,
} from "@kallpasoft/db";
import { and, count, eq, sql } from "drizzle-orm";
import type {
  CotizacionVenta,
  CotizacionVentaDetalle,
  CotizacionVentaItem,
} from "../../domain/entities/cotizacion-venta.js";
import type {
  CreateCotizacionVentaData,
  ICotizacionVentaRepository,
  ListCotizacionesVentaParams,
  ListCotizacionesVentaResult,
} from "../../domain/ports/cotizacion-venta.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function generarCodigoCotizacion(tx: any, tenantId: string): Promise<string> {
  const rows = (await tx.execute(
    sql`SELECT COUNT(*) AS n FROM cotizacion_venta WHERE tenant_id = ${tenantId}::uuid`
  )) as Array<{ n: string | number }>;
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `COT-V-${String(n).padStart(4, "0")}`;
}

export class CotizacionVentaDrizzleRepository implements ICotizacionVentaRepository {
  constructor(private readonly db: DbClient) {}

  async list(
    tenantId: string,
    params: ListCotizacionesVentaParams
  ): Promise<ListCotizacionesVentaResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [
        eq(cotizacionVentaTable.tenant_id, tenantId),
        eq(cotizacionVentaTable.activo, true),
      ];
      if (params.cliente_id)
        conditions.push(eq(cotizacionVentaTable.cliente_id, params.cliente_id));
      if (params.estado) {
        conditions.push(
          eq(
            cotizacionVentaTable.estado,
            params.estado as (typeof cotizacionVentaTable.estado)["_"]["data"]
          )
        );
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(cotizacionVentaTable).where(where),
        tx
          .select({
            cot: cotizacionVentaTable,
            usuario_nombres: usuarioTable.nombres,
            usuario_apellidos: usuarioTable.apellidos,
            cliente_nombres: clienteTable.nombres,
            cliente_apellidos: clienteTable.apellidos,
            cliente_razon_social: clienteTable.razon_social,
          })
          .from(cotizacionVentaTable)
          .leftJoin(usuarioTable, eq(cotizacionVentaTable.usuario_id, usuarioTable.id))
          .leftJoin(clienteTable, eq(cotizacionVentaTable.cliente_id, clienteTable.id))
          .where(where)
          .orderBy(cotizacionVentaTable.created_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: CotizacionVenta[] = rows.map((r) => ({
        ...(r.cot as CotizacionVenta),
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<CotizacionVentaDetalle | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          cot: cotizacionVentaTable,
          usuario_nombres: usuarioTable.nombres,
          usuario_apellidos: usuarioTable.apellidos,
          cliente_nombres: clienteTable.nombres,
          cliente_apellidos: clienteTable.apellidos,
          cliente_razon_social: clienteTable.razon_social,
        })
        .from(cotizacionVentaTable)
        .leftJoin(usuarioTable, eq(cotizacionVentaTable.usuario_id, usuarioTable.id))
        .leftJoin(clienteTable, eq(cotizacionVentaTable.cliente_id, clienteTable.id))
        .where(and(eq(cotizacionVentaTable.id, id), eq(cotizacionVentaTable.tenant_id, tenantId)));

      if (!rows[0]) return null;
      const r = rows[0];

      const itemRows = await tx
        .select()
        .from(cotizacionVentaItemTable)
        .where(
          and(
            eq(cotizacionVentaItemTable.cotizacion_venta_id, id),
            eq(cotizacionVentaItemTable.tenant_id, tenantId)
          )
        )
        .orderBy(cotizacionVentaItemTable.created_at);

      return {
        ...(r.cot as CotizacionVenta),
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
        cliente_nombre:
          r.cliente_razon_social ??
          (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
        items: itemRows as CotizacionVentaItem[],
      };
    });
  }

  async create(tenantId: string, data: CreateCotizacionVentaData): Promise<CotizacionVentaDetalle> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await generarCodigoCotizacion(tx, tenantId);

      const subtotal = data.items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0);
      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      const cotRows = await tx
        .insert(cotizacionVentaTable)
        .values({
          tenant_id: tenantId,
          codigo,
          cliente_id: data.cliente_id ?? null,
          subtotal: subtotal.toFixed(2),
          igv: igv.toFixed(2),
          total: total.toFixed(2),
          estado: "BORRADOR",
          fecha_vencimiento: data.fecha_vencimiento ?? null,
          usuario_id: data.usuario_id,
          notas: data.notas ?? null,
        })
        .returning();

      const cotizacion = cotRows[0] as CotizacionVenta;

      const itemRows = await tx
        .insert(cotizacionVentaItemTable)
        .values(
          data.items.map((it) => ({
            tenant_id: tenantId,
            cotizacion_venta_id: cotizacion.id,
            producto_id: it.producto_id ?? null,
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precio_unitario: String(it.precio_unitario),
            subtotal: (it.cantidad * it.precio_unitario).toFixed(2),
          }))
        )
        .returning();

      return {
        ...cotizacion,
        items: itemRows as CotizacionVentaItem[],
      };
    });
  }

  async updateEstado(
    tenantId: string,
    id: string,
    estado: string
  ): Promise<CotizacionVenta | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .update(cotizacionVentaTable)
        .set({
          estado: estado as (typeof cotizacionVentaTable.estado)["_"]["data"],
          updated_at: new Date(),
        })
        .where(and(eq(cotizacionVentaTable.id, id), eq(cotizacionVentaTable.tenant_id, tenantId)))
        .returning();
      return (rows[0] as CotizacionVenta) ?? null;
    });
  }
}
