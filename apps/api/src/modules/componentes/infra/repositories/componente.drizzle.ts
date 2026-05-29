import type { DbClient } from "@kallpasoft/db";
import { componente as componenteTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { Componente } from "../../domain/entities/componente.js";
import type {
  CreateComponenteData,
  IComponenteRepository,
  ListComponentesParams,
  ListComponentesResult,
  UpdateComponenteData,
} from "../../domain/ports/componente.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TxLike {
  execute(query: SQL<unknown>): Promise<unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic; structural interface above ensures type safety
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class ComponenteDrizzleRepository implements IComponenteRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Componente | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(componenteTable)
        .where(and(eq(componenteTable.id, id), eq(componenteTable.tenant_id, tenantId)));
    });
    return (rows[0] as Componente) ?? null;
  }

  async list(tenantId: string, params: ListComponentesParams): Promise<ListComponentesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(componenteTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(componenteTable.activo, params.activo));
      }
      if (params.categoria_id !== undefined) {
        conditions.push(eq(componenteTable.categoria_id, params.categoria_id));
      }
      if (params.search) {
        conditions.push(ilike(componenteTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(componenteTable).where(where),
        tx
          .select()
          .from(componenteTable)
          .where(where)
          .orderBy(componenteTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Componente[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateComponenteData): Promise<Componente> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(componenteTable)
        .values({
          tenant_id: tenantId,
          categoria_id: data.categoria_id,
          nombre: data.nombre,
          descripcion: data.descripcion ?? null,
        })
        .returning();
    });
    return rows[0] as Componente;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateComponenteData
  ): Promise<Componente | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof componenteTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.categoria_id !== undefined) setValues.categoria_id = data.categoria_id;
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.descripcion !== undefined) setValues.descripcion = data.descripcion;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(componenteTable)
        .set(setValues)
        .where(and(eq(componenteTable.id, id), eq(componenteTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Componente) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(componenteTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(componenteTable.id, id), eq(componenteTable.tenant_id, tenantId)))
        .returning({ id: componenteTable.id });
    });
    return rows.length > 0;
  }
}
