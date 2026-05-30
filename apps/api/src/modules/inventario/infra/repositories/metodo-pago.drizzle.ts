import type { DbClient } from "@kallpasoft/db";
import { metodoPagoCatalogo as metodoPagoTable } from "@kallpasoft/db";
import { and, eq, sql } from "drizzle-orm";
import type { MetodoPagoCatalogo } from "../../domain/entities/metodo-pago-catalogo.js";
import type {
  CreateMetodoPagoData,
  IMetodoPagoRepository,
  UpdateMetodoPagoData,
} from "../../domain/ports/metodo-pago.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class MetodoPagoDrizzleRepository implements IMetodoPagoRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, activo?: boolean): Promise<MetodoPagoCatalogo[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const conditions = [eq(metodoPagoTable.tenant_id, tenantId)];
      if (activo !== undefined) conditions.push(eq(metodoPagoTable.activo, activo));
      return tx
        .select()
        .from(metodoPagoTable)
        .where(and(...conditions))
        .orderBy(metodoPagoTable.nombre);
    });
    return rows as MetodoPagoCatalogo[];
  }

  async create(tenantId: string, data: CreateMetodoPagoData): Promise<MetodoPagoCatalogo> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(metodoPagoTable)
        .values({ tenant_id: tenantId, nombre: data.nombre })
        .returning();
    });
    return rows[0] as MetodoPagoCatalogo;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateMetodoPagoData
  ): Promise<MetodoPagoCatalogo | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const setValues: Partial<typeof metodoPagoTable.$inferInsert> = { updated_at: new Date() };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.activo !== undefined) setValues.activo = data.activo;
      return tx
        .update(metodoPagoTable)
        .set(setValues)
        .where(and(eq(metodoPagoTable.id, id), eq(metodoPagoTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as MetodoPagoCatalogo) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(metodoPagoTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(metodoPagoTable.id, id), eq(metodoPagoTable.tenant_id, tenantId)))
        .returning({ id: metodoPagoTable.id });
    });
    return rows.length > 0;
  }
}
