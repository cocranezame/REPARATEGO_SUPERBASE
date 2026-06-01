import type { DbClient } from "@kallpasoft/db";
import {
  cliente as clienteTable,
  cotizacionVentaItem as cotizacionVentaItemTable,
  cotizacionVenta as cotizacionVentaTable,
  usuario as usuarioTable,
} from "@kallpasoft/db";
import { and, asc, count, eq, gte, lte, sql } from "drizzle-orm";
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

function mapCotizacion(r: {
  cot: unknown;
  cliente_nombres: string | null;
  cliente_apellidos: string | null;
  cliente_razon_social: string | null;
  usuario_nombres: string | null;
  usuario_apellidos: string | null;
}): CotizacionVenta {
  return {
    ...(r.cot as CotizacionVenta),
    cliente_nombre:
      r.cliente_razon_social ??
      (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
    created_by_nombre: r.usuario_nombres
      ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
      : undefined,
  };
}

export class CotizacionVentaDrizzleRepository implements ICotizacionVentaRepository {
  constructor(private readonly db: DbClient) {}

  async list(
    tenantId: string,
    params: ListCotizacionesVentaParams
  ): Promise<ListCotizacionesVentaResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(cotizacionVentaTable.tenant_id, tenantId)];
      if (params.cliente_id)
        conditions.push(eq(cotizacionVentaTable.cliente_id, params.cliente_id));
      if (params.fecha_desde)
        conditions.push(gte(cotizacionVentaTable.created_at, new Date(params.fecha_desde)));
      if (params.fecha_hasta)
        conditions.push(lte(cotizacionVentaTable.created_at, new Date(params.fecha_hasta)));

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
          .leftJoin(usuarioTable, eq(cotizacionVentaTable.created_by, usuarioTable.id))
          .leftJoin(clienteTable, eq(cotizacionVentaTable.cliente_id, clienteTable.id))
          .where(where)
          .orderBy(asc(cotizacionVentaTable.created_at))
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: rows.map(mapCotizacion), total: countRows[0]?.total ?? 0 };
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
        .leftJoin(usuarioTable, eq(cotizacionVentaTable.created_by, usuarioTable.id))
        .leftJoin(clienteTable, eq(cotizacionVentaTable.cliente_id, clienteTable.id))
        .where(and(eq(cotizacionVentaTable.id, id), eq(cotizacionVentaTable.tenant_id, tenantId)));

      if (!rows[0]) return null;

      const itemRows = await tx
        .select()
        .from(cotizacionVentaItemTable)
        .where(
          and(
            eq(cotizacionVentaItemTable.cotizacion_venta_id, id),
            eq(cotizacionVentaItemTable.tenant_id, tenantId)
          )
        )
        .orderBy(asc(cotizacionVentaItemTable.created_at));

      return {
        ...mapCotizacion(rows[0]),
        items: itemRows as CotizacionVentaItem[],
      };
    });
  }

  async create(tenantId: string, data: CreateCotizacionVentaData): Promise<CotizacionVentaDetalle> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const codigo = await generarCodigoCotizacion(tx, tenantId);

      // total_referencial = sum(precio_unitario * cantidad), sin IGV (V15: solo referencial)
      const totalReferencial = data.items.reduce(
        (acc, it) => acc + it.precio_unitario * it.cantidad,
        0
      );

      const cotRows = await tx
        .insert(cotizacionVentaTable)
        .values({
          tenant_id: tenantId,
          codigo,
          cliente_id: data.cliente_id ?? null,
          caja_id: data.caja_id,
          total_referencial: totalReferencial.toFixed(2),
          created_by: data.created_by,
        })
        .returning();

      const cotizacion = cotRows[0] as CotizacionVenta;

      const itemRows = await tx
        .insert(cotizacionVentaItemTable)
        .values(
          data.items.map((it) => ({
            tenant_id: tenantId,
            cotizacion_venta_id: cotizacion.id,
            produto_id: it.produto_id ?? null,
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
}
