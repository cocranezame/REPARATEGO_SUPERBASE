import type { DbClient } from "@kallpasoft/db";
import { producto as productoTable, tasaPrecio as tasaPrecioTable } from "@kallpasoft/db";
import { and, eq, sql } from "drizzle-orm";
import type { TasaPrecio } from "../../domain/entities/tasa-precio.js";
import type {
  CreateTasaPrecioData,
  ITasaPrecioRepository,
  UpdateTasaPrecioData,
} from "../../domain/ports/tasa-precio.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

function calcularPrecioVenta(ultimoCosto: number, tasaTipo: string, tasaValor: number): number {
  if (tasaTipo === "PORCENTAJE") return ultimoCosto * (1 + tasaValor / 100);
  return ultimoCosto + tasaValor;
}

export class TasaPrecioDrizzleRepository implements ITasaPrecioRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string): Promise<TasaPrecio[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select()
        .from(tasaPrecioTable)
        .where(eq(tasaPrecioTable.tenant_id, tenantId))
        .orderBy(tasaPrecioTable.nivel, tasaPrecioTable.created_at);
      return rows as TasaPrecio[];
    });
  }

  async findById(tenantId: string, id: string): Promise<TasaPrecio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .select()
        .from(tasaPrecioTable)
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)));
      return (rows[0] as TasaPrecio) ?? null;
    });
  }

  // I20: Jerarquía POR_REPUESTO > POR_TIPO > POR_COMPONENTE
  async resolveForProducto(
    tenantId: string,
    productoId: string,
    tipo: "PRODUCTO" | "SERVICIO",
    componenteId: string | null
  ): Promise<TasaPrecio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // 1. Buscar tasa POR_REPUESTO específica del producto
      const repuesto = await tx
        .select()
        .from(tasaPrecioTable)
        .where(
          and(
            eq(tasaPrecioTable.tenant_id, tenantId),
            eq(tasaPrecioTable.nivel, "POR_REPUESTO"),
            eq(tasaPrecioTable.producto_id, productoId)
          )
        )
        .limit(1);
      if (repuesto[0]) return repuesto[0] as TasaPrecio;

      // 2. Buscar tasa POR_TIPO (PRODUCTO o SERVICIO según el tipo del producto)
      const porTipo = await tx
        .select()
        .from(tasaPrecioTable)
        .where(
          and(
            eq(tasaPrecioTable.tenant_id, tenantId),
            eq(tasaPrecioTable.nivel, "POR_TIPO"),
            eq(tasaPrecioTable.tipo_registro, tipo)
          )
        )
        .limit(1);
      if (porTipo[0]) return porTipo[0] as TasaPrecio;

      // 3. Buscar tasa POR_COMPONENTE (si el producto tiene componente)
      if (componenteId) {
        const porComponente = await tx
          .select()
          .from(tasaPrecioTable)
          .where(
            and(
              eq(tasaPrecioTable.tenant_id, tenantId),
              eq(tasaPrecioTable.nivel, "POR_COMPONENTE"),
              eq(tasaPrecioTable.componente_id, componenteId)
            )
          )
          .limit(1);
        if (porComponente[0]) return porComponente[0] as TasaPrecio;
      }

      return null;
    });
  }

  async create(tenantId: string, data: CreateTasaPrecioData): Promise<TasaPrecio> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .insert(tasaPrecioTable)
        .values({
          tenant_id: tenantId,
          nivel: data.nivel as (typeof tasaPrecioTable.nivel)["_"]["data"],
          producto_id: data.producto_id ?? null,
          tipo_registro:
            data.tipo_registro !== undefined
              ? (data.tipo_registro as (typeof tasaPrecioTable.tipo_registro)["_"]["data"])
              : null,
          componente_id: data.componente_id ?? null,
          tasa_tipo: data.tasa_tipo as (typeof tasaPrecioTable.tasa_tipo)["_"]["data"],
          tasa_valor: String(data.tasa_valor),
          created_by: data.created_by,
        })
        .returning();
      return rows[0] as TasaPrecio;
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTasaPrecioData
  ): Promise<TasaPrecio | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const existing = await tx
        .select()
        .from(tasaPrecioTable)
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)))
        .limit(1);

      if (!existing[0]) return null;

      const tasa = existing[0] as TasaPrecio;
      const nuevoTasaTipo = data.tasa_tipo ?? tasa.tasa_tipo;
      const nuevoTasaValor =
        data.tasa_valor !== undefined ? data.tasa_valor : Number(tasa.tasa_valor);

      const setValues: Partial<typeof tasaPrecioTable.$inferInsert> = {
        updated_at: new Date(),
        tasa_tipo: nuevoTasaTipo as (typeof tasaPrecioTable.tasa_tipo)["_"]["data"],
        tasa_valor: String(nuevoTasaValor),
      };

      // I23: Recalcular precio_venta si hay ultimo_costo (solo POR_REPUESTO)
      if (tasa.nivel === "POR_REPUESTO" && tasa.ultimo_costo !== null) {
        const nuevoPrecio = calcularPrecioVenta(
          Number(tasa.ultimo_costo),
          nuevoTasaTipo,
          nuevoTasaValor
        );
        setValues.precio_venta = String(nuevoPrecio.toFixed(2));

        // Actualizar precio_venta del producto
        if (tasa.producto_id) {
          await tx
            .update(productoTable)
            .set({ precio_venta: String(nuevoPrecio.toFixed(2)), updated_at: new Date() })
            .where(
              and(eq(productoTable.id, tasa.producto_id), eq(productoTable.tenant_id, tenantId))
            );
        }
      }

      const rows = await tx
        .update(tasaPrecioTable)
        .set(setValues)
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)))
        .returning();

      return (rows[0] as TasaPrecio) ?? null;
    });
  }

  async hardDelete(tenantId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const rows = await tx
        .delete(tasaPrecioTable)
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)))
        .returning({ id: tasaPrecioTable.id });
      return rows.length > 0;
    });
  }

  // I22 + I23: Actualizar ultimo_costo del POR_REPUESTO y recalcular precio_venta
  async updateCostoYPrecio(
    tenantId: string,
    productoId: string,
    nuevoCosto: number
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const tasas = await tx
        .select()
        .from(tasaPrecioTable)
        .where(
          and(
            eq(tasaPrecioTable.tenant_id, tenantId),
            eq(tasaPrecioTable.nivel, "POR_REPUESTO"),
            eq(tasaPrecioTable.producto_id, productoId)
          )
        )
        .limit(1);

      const tasa = tasas[0] as TasaPrecio | undefined;
      if (!tasa) return;

      // Calcular promedio histórico ponderado simple
      const prevCosto = tasa.ultimo_costo ? Number(tasa.ultimo_costo) : nuevoCosto;
      const nuevoPromedio = (prevCosto + nuevoCosto) / 2;
      const nuevoPrecio = calcularPrecioVenta(nuevoCosto, tasa.tasa_tipo, Number(tasa.tasa_valor));

      await tx
        .update(tasaPrecioTable)
        .set({
          ultimo_costo: String(nuevoCosto.toFixed(2)),
          promedio_historico: String(nuevoPromedio.toFixed(2)),
          precio_venta: String(nuevoPrecio.toFixed(2)),
          updated_at: new Date(),
        })
        .where(eq(tasaPrecioTable.id, tasa.id));

      // Actualizar precio_venta del producto
      await tx
        .update(productoTable)
        .set({ precio_venta: String(nuevoPrecio.toFixed(2)), updated_at: new Date() })
        .where(and(eq(productoTable.id, productoId), eq(productoTable.tenant_id, tenantId)));
    });
  }
}
