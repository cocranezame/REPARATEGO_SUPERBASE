import type { DbClient } from "@kallpasoft/db";
import { tasaPrecio as tasaPrecioTable } from "@kallpasoft/db";
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

export class TasaPrecioDrizzleRepository implements ITasaPrecioRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, activo?: boolean): Promise<TasaPrecio[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const conditions = [eq(tasaPrecioTable.tenant_id, tenantId)];
      if (activo !== undefined) conditions.push(eq(tasaPrecioTable.activo, activo));
      return tx
        .select()
        .from(tasaPrecioTable)
        .where(and(...conditions))
        .orderBy(tasaPrecioTable.nombre);
    });
    return rows as TasaPrecio[];
  }

  async create(tenantId: string, data: CreateTasaPrecioData): Promise<TasaPrecio> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(tasaPrecioTable)
        .values({
          tenant_id: tenantId,
          nombre: data.nombre,
          porcentaje: String(data.porcentaje),
        })
        .returning();
    });
    return rows[0] as TasaPrecio;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTasaPrecioData
  ): Promise<TasaPrecio | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const setValues: Partial<typeof tasaPrecioTable.$inferInsert> = { updated_at: new Date() };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.porcentaje !== undefined) setValues.porcentaje = String(data.porcentaje);
      if (data.activo !== undefined) setValues.activo = data.activo;
      return tx
        .update(tasaPrecioTable)
        .set(setValues)
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as TasaPrecio) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(tasaPrecioTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(tasaPrecioTable.id, id), eq(tasaPrecioTable.tenant_id, tenantId)))
        .returning({ id: tasaPrecioTable.id });
    });
    return rows.length > 0;
  }
}
