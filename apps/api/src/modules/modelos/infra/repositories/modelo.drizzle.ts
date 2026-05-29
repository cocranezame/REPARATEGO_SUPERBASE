import type { DbClient } from "@kallpasoft/db";
import { modelo as modeloTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { Modelo } from "../../domain/entities/modelo.js";
import type {
  CreateModeloData,
  IModeloRepository,
  ListModelosParams,
  ListModelosResult,
  UpdateModeloData,
} from "../../domain/ports/modelo.repository.js";

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

export class ModeloDrizzleRepository implements IModeloRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Modelo | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(modeloTable)
        .where(and(eq(modeloTable.id, id), eq(modeloTable.tenant_id, tenantId)));
    });
    return (rows[0] as Modelo) ?? null;
  }

  async list(tenantId: string, params: ListModelosParams): Promise<ListModelosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(modeloTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(modeloTable.activo, params.activo));
      }
      if (params.marca_id !== undefined) {
        conditions.push(eq(modeloTable.marca_id, params.marca_id));
      }
      if (params.categoria_id !== undefined) {
        conditions.push(eq(modeloTable.categoria_id, params.categoria_id));
      }
      if (params.search) {
        conditions.push(ilike(modeloTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(modeloTable).where(where),
        tx
          .select()
          .from(modeloTable)
          .where(where)
          .orderBy(modeloTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Modelo[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateModeloData): Promise<Modelo> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(modeloTable)
        .values({
          tenant_id: tenantId,
          marca_id: data.marca_id,
          categoria_id: data.categoria_id,
          nombre: data.nombre,
        })
        .returning();
    });
    return rows[0] as Modelo;
  }

  async update(tenantId: string, id: string, data: UpdateModeloData): Promise<Modelo | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof modeloTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.marca_id !== undefined) setValues.marca_id = data.marca_id;
      if (data.categoria_id !== undefined) setValues.categoria_id = data.categoria_id;
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(modeloTable)
        .set(setValues)
        .where(and(eq(modeloTable.id, id), eq(modeloTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Modelo) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(modeloTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(modeloTable.id, id), eq(modeloTable.tenant_id, tenantId)))
        .returning({ id: modeloTable.id });
    });
    return rows.length > 0;
  }
}
