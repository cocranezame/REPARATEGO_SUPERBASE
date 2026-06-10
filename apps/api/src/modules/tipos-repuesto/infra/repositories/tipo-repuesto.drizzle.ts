import type { DbClient } from "@kallpasoft/db";
import { tipoRepuesto as tipoRepuestoTable } from "@kallpasoft/db";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { TipoRepuesto } from "../../domain/entities/tipo-repuesto.js";
import type {
  CreateTipoRepuestoData,
  ITipoRepuestoRepository,
  ListTiposRepuestoParams,
  ListTiposRepuestoResult,
  UpdateTipoRepuestoData,
} from "../../domain/ports/tipo-repuesto.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class TipoRepuestoDrizzleRepository implements ITipoRepuestoRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<TipoRepuesto | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(tipoRepuestoTable)
        .where(and(eq(tipoRepuestoTable.id, id), eq(tipoRepuestoTable.tenant_id, tenantId)));
    });
    return (rows[0] as TipoRepuesto) ?? null;
  }

  async list(tenantId: string, params: ListTiposRepuestoParams): Promise<ListTiposRepuestoResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(tipoRepuestoTable.tenant_id, tenantId)];
      if (params.componente_id !== undefined) {
        conditions.push(eq(tipoRepuestoTable.componente_id, params.componente_id));
      }
      if (params.activo !== undefined) {
        conditions.push(eq(tipoRepuestoTable.activo, params.activo));
      }
      if (params.search) {
        conditions.push(ilike(tipoRepuestoTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(tipoRepuestoTable).where(where),
        tx
          .select()
          .from(tipoRepuestoTable)
          .where(where)
          .orderBy(tipoRepuestoTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as TipoRepuesto[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateTipoRepuestoData): Promise<TipoRepuesto> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(tipoRepuestoTable)
        .values({ tenant_id: tenantId, componente_id: data.componente_id, nombre: data.nombre })
        .returning();
    });
    return rows[0] as TipoRepuesto;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTipoRepuestoData
  ): Promise<TipoRepuesto | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const setValues: Partial<typeof tipoRepuestoTable.$inferInsert> = { updated_at: new Date() };
      if (data.componente_id !== undefined) setValues.componente_id = data.componente_id;
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.activo !== undefined) setValues.activo = data.activo;
      return tx
        .update(tipoRepuestoTable)
        .set(setValues)
        .where(and(eq(tipoRepuestoTable.id, id), eq(tipoRepuestoTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as TipoRepuesto) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(tipoRepuestoTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(tipoRepuestoTable.id, id), eq(tipoRepuestoTable.tenant_id, tenantId)))
        .returning({ id: tipoRepuestoTable.id });
    });
    return rows.length > 0;
  }
}
