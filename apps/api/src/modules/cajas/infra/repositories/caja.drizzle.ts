import type { DbClient } from "@kallpasoft/db";
import {
  caja as cajaTable,
  metodoPagoCatalogo as metodoPagoCatalogoTable,
  sucursal as sucursalTable,
  usuario as usuarioTable,
  ventaPago as ventaPagoTable,
  venta as ventaTable,
} from "@kallpasoft/db";
import { and, count, eq, sql, sum } from "drizzle-orm";
import type { Caja, ResumenCaja } from "../../domain/entities/caja.js";
import type {
  AbrirCajaData,
  CerrarCajaData,
  ICajaRepository,
  ListCajasParams,
  ListCajasResult,
} from "../../domain/ports/caja.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class CajaDrizzleRepository implements ICajaRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListCajasParams): Promise<ListCajasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(cajaTable.tenant_id, tenantId)];
      if (params.sucursal_id) conditions.push(eq(cajaTable.sucursal_id, params.sucursal_id));
      if (params.estado) conditions.push(eq(cajaTable.estado, params.estado));

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(cajaTable).where(where),
        tx
          .select({
            caja: cajaTable,
            sucursal_nombre: sucursalTable.nombre,
            usuario_nombres: usuarioTable.nombres,
            usuario_apellidos: usuarioTable.apellidos,
          })
          .from(cajaTable)
          .leftJoin(sucursalTable, eq(cajaTable.sucursal_id, sucursalTable.id))
          .leftJoin(usuarioTable, eq(cajaTable.usuario_id, usuarioTable.id))
          .where(where)
          .orderBy(cajaTable.fecha_apertura)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      const items: Caja[] = rows.map((r) => ({
        ...(r.caja as Caja),
        sucursal_nombre: r.sucursal_nombre ?? undefined,
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
      }));

      return { items, total: countRows[0]?.total ?? 0 };
    });
  }

  async findActual(tenantId: string, usuarioId: string): Promise<Caja | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select({
          caja: cajaTable,
          sucursal_nombre: sucursalTable.nombre,
          usuario_nombres: usuarioTable.nombres,
          usuario_apellidos: usuarioTable.apellidos,
        })
        .from(cajaTable)
        .leftJoin(sucursalTable, eq(cajaTable.sucursal_id, sucursalTable.id))
        .leftJoin(usuarioTable, eq(cajaTable.usuario_id, usuarioTable.id))
        .where(
          and(
            eq(cajaTable.tenant_id, tenantId),
            eq(cajaTable.usuario_id, usuarioId),
            eq(cajaTable.estado, "ABIERTA")
          )
        )
        .limit(1);
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        ...(r.caja as Caja),
        sucursal_nombre: r.sucursal_nombre ?? undefined,
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
      };
    });
  }

  async findById(tenantId: string, id: string): Promise<Caja | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select({
          caja: cajaTable,
          sucursal_nombre: sucursalTable.nombre,
          usuario_nombres: usuarioTable.nombres,
          usuario_apellidos: usuarioTable.apellidos,
        })
        .from(cajaTable)
        .leftJoin(sucursalTable, eq(cajaTable.sucursal_id, sucursalTable.id))
        .leftJoin(usuarioTable, eq(cajaTable.usuario_id, usuarioTable.id))
        .where(and(eq(cajaTable.id, id), eq(cajaTable.tenant_id, tenantId)))
        .limit(1);
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        ...(r.caja as Caja),
        sucursal_nombre: r.sucursal_nombre ?? undefined,
        usuario_nombre: r.usuario_nombres
          ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
          : undefined,
      };
    });
  }

  async abrir(tenantId: string, data: AbrirCajaData): Promise<Caja> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(cajaTable)
        .values({
          tenant_id: tenantId,
          sucursal_id: data.sucursal_id,
          usuario_id: data.usuario_id,
          monto_apertura: String(data.monto_apertura),
          estado: "ABIERTA",
        })
        .returning();
    });
    return rows[0] as Caja;
  }

  async cerrar(tenantId: string, id: string, data: CerrarCajaData): Promise<Caja | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const pendientes = await tx
        .select({ total: count() })
        .from(ventaTable)
        .where(
          and(
            eq(ventaTable.caja_id, id),
            eq(ventaTable.tenant_id, tenantId),
            eq(ventaTable.estado, "PENDIENTE")
          )
        );
      if ((pendientes[0]?.total ?? 0) > 0) {
        throw new Error("Hay ventas PENDIENTE en esta caja. Liquide o anule antes de cerrar.");
      }

      const rows = await tx
        .update(cajaTable)
        .set({
          estado: "CERRADA",
          monto_cierre: String(data.monto_cierre),
          fecha_cierre: new Date(),
          notas_cierre: data.notas_cierre ?? null,
          updated_at: new Date(),
        })
        .where(and(eq(cajaTable.id, id), eq(cajaTable.tenant_id, tenantId)))
        .returning();
      return (rows[0] as Caja) ?? null;
    });
  }

  async resumen(tenantId: string, id: string): Promise<ResumenCaja> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const ventasRows = await tx
        .select({ total: count() })
        .from(ventaTable)
        .where(
          and(
            eq(ventaTable.caja_id, id),
            eq(ventaTable.tenant_id, tenantId),
            eq(ventaTable.activo, true)
          )
        );

      const totalVentasRow = await tx
        .select({ total: sum(ventaTable.total) })
        .from(ventaTable)
        .where(
          and(
            eq(ventaTable.caja_id, id),
            eq(ventaTable.tenant_id, tenantId),
            eq(ventaTable.activo, true)
          )
        );

      const pagosPorMetodo = await tx
        .select({
          metodo: metodoPagoCatalogoTable.nombre,
          total: sum(ventaPagoTable.monto),
        })
        .from(ventaPagoTable)
        .leftJoin(ventaTable, eq(ventaPagoTable.venta_id, ventaTable.id))
        .leftJoin(
          metodoPagoCatalogoTable,
          eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
        )
        .where(and(eq(ventaTable.caja_id, id), eq(ventaPagoTable.tenant_id, tenantId)))
        .groupBy(metodoPagoCatalogoTable.nombre);

      const cajaRow = await tx
        .select({ monto_apertura: cajaTable.monto_apertura, monto_cierre: cajaTable.monto_cierre })
        .from(cajaTable)
        .where(and(eq(cajaTable.id, id), eq(cajaTable.tenant_id, tenantId)))
        .limit(1);

      const totalVentas = Number(totalVentasRow[0]?.total ?? 0);
      const montoApertura = Number(cajaRow[0]?.monto_apertura ?? 0);
      const montoCierre = cajaRow[0]?.monto_cierre ? Number(cajaRow[0].monto_cierre) : null;
      const efectivoEnCaja = pagosPorMetodo
        .filter((p) => p.metodo?.toLowerCase().includes("efectivo"))
        .reduce((acc, p) => acc + Number(p.total ?? 0), 0);

      return {
        caja_id: id,
        total_ventas: totalVentas,
        cantidad_ventas: ventasRows[0]?.total ?? 0,
        total_por_metodo: pagosPorMetodo.map((p) => ({
          metodo: p.metodo ?? "",
          total: Number(p.total ?? 0),
        })),
        diferencia:
          montoCierre !== null
            ? montoCierre - (montoApertura + efectivoEnCaja)
            : montoApertura + efectivoEnCaja,
      };
    });
  }
}
