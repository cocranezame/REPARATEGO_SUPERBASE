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

function mapCaja(r: {
  caja: unknown;
  sucursal_nombre: string | null;
  usuario_nombres: string | null;
  usuario_apellidos: string | null;
}): Caja {
  return {
    ...(r.caja as Caja),
    sucursal_nombre: r.sucursal_nombre ?? undefined,
    usuario_nombre: r.usuario_nombres
      ? `${r.usuario_nombres} ${r.usuario_apellidos ?? ""}`.trim()
      : undefined,
  };
}

export class CajaDrizzleRepository implements ICajaRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListCajasParams): Promise<ListCajasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(cajaTable.tenant_id, tenantId)];
      if (params.sucursal_id) conditions.push(eq(cajaTable.sucursal_id, params.sucursal_id));
      if (params.estado)
        conditions.push(eq(cajaTable.estado, params.estado as "ABIERTA" | "CERRADA"));

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

      return { items: rows.map(mapCaja), total: countRows[0]?.total ?? 0 };
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
      return mapCaja(rows[0]);
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
      return mapCaja(rows[0]);
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
          monto_inicial: String(data.monto_inicial),
          estado: "ABIERTA",
        })
        .returning();
    });
    return rows[0] as Caja;
  }

  async cerrar(tenantId: string, id: string, data: CerrarCajaData): Promise<Caja | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const cajaRows = await tx
        .select({ monto_inicial: cajaTable.monto_inicial, estado: cajaTable.estado })
        .from(cajaTable)
        .where(and(eq(cajaTable.id, id), eq(cajaTable.tenant_id, tenantId)))
        .limit(1);

      const cajaActual = cajaRows[0];
      if (!cajaActual) return null;
      if (cajaActual.estado === "CERRADA") throw new Error("La caja ya está cerrada");

      // monto_esperado = monto_inicial + sum(pagos EFECTIVO registrados en esta caja)
      const efectivoRows = await tx
        .select({ total: sum(ventaPagoTable.monto) })
        .from(ventaPagoTable)
        .leftJoin(
          metodoPagoCatalogoTable,
          eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
        )
        .where(
          and(
            eq(ventaPagoTable.caja_id, id),
            eq(ventaPagoTable.tenant_id, tenantId),
            sql`LOWER(${metodoPagoCatalogoTable.nombre}) = 'efectivo'`
          )
        );

      const montoInicial = Number(cajaActual.monto_inicial);
      const ingresosEfectivo = Number(efectivoRows[0]?.total ?? 0);
      const montoEsperado = montoInicial + ingresosEfectivo;
      const diferencia = data.monto_fisico - montoEsperado;

      const rows = await tx
        .update(cajaTable)
        .set({
          estado: "CERRADA",
          monto_fisico: String(data.monto_fisico),
          monto_esperado: montoEsperado.toFixed(2),
          diferencia: diferencia.toFixed(2),
          fecha_cierre: new Date(),
          updated_at: new Date(),
        })
        .where(and(eq(cajaTable.id, id), eq(cajaTable.tenant_id, tenantId)))
        .returning();

      return (rows[0] as Caja) ?? null;
    });
  }

  async reporte(tenantId: string, id: string): Promise<ResumenCaja | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const cajaRows = await tx
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

      if (!cajaRows[0]) return null;
      const cajaEntity = mapCaja(cajaRows[0]);

      const [ventasRows, pagosPorMetodo] = await Promise.all([
        tx
          .select({ total: count(), monto_total: sum(ventaTable.total) })
          .from(ventaTable)
          .where(and(eq(ventaTable.caja_id, id), eq(ventaTable.tenant_id, tenantId))),
        tx
          .select({
            metodo: metodoPagoCatalogoTable.nombre,
            total: sum(ventaPagoTable.monto),
          })
          .from(ventaPagoTable)
          .leftJoin(
            metodoPagoCatalogoTable,
            eq(ventaPagoTable.metodo_pago_id, metodoPagoCatalogoTable.id)
          )
          .where(and(eq(ventaPagoTable.caja_id, id), eq(ventaPagoTable.tenant_id, tenantId)))
          .groupBy(metodoPagoCatalogoTable.nombre),
      ]);

      return {
        caja: cajaEntity,
        total_ventas: Number(ventasRows[0]?.monto_total ?? 0),
        cantidad_ventas: ventasRows[0]?.total ?? 0,
        total_por_metodo: pagosPorMetodo.map((p) => ({
          metodo: p.metodo ?? "",
          total: Number(p.total ?? 0),
        })),
      };
    });
  }
}
