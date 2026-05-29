import type { DbClient } from "@kallpasoft/db";
import { marca as marcaTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { Marca } from "../../domain/entities/marca.js";
import type {
  CreateMarcaData,
  IMarcaRepository,
  ListMarcasParams,
  ListMarcasResult,
  UpdateMarcaData,
} from "../../domain/ports/marca.repository.js";

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

export class MarcaDrizzleRepository implements IMarcaRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Marca | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(marcaTable)
        .where(and(eq(marcaTable.id, id), eq(marcaTable.tenant_id, tenantId)));
    });
    return (rows[0] as Marca) ?? null;
  }

  async list(tenantId: string, params: ListMarcasParams): Promise<ListMarcasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(marcaTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(marcaTable.activo, params.activo));
      }
      if (params.search) {
        conditions.push(ilike(marcaTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(marcaTable).where(where),
        tx
          .select()
          .from(marcaTable)
          .where(where)
          .orderBy(marcaTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Marca[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateMarcaData): Promise<Marca> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(marcaTable)
        .values({
          tenant_id: tenantId,
          nombre: data.nombre,
          logo_url: data.logo_url ?? null,
        })
        .returning();
    });
    return rows[0] as Marca;
  }

  async update(tenantId: string, id: string, data: UpdateMarcaData): Promise<Marca | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof marcaTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.logo_url !== undefined) setValues.logo_url = data.logo_url;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(marcaTable)
        .set(setValues)
        .where(and(eq(marcaTable.id, id), eq(marcaTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Marca) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(marcaTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(marcaTable.id, id), eq(marcaTable.tenant_id, tenantId)))
        .returning({ id: marcaTable.id });
    });
    return rows.length > 0;
  }
}
