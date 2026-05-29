import type { DbClient } from "@kallpasoft/db";
import { categoria as categoriaTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import type { Categoria } from "../../domain/entities/categoria.js";
import type {
  CreateCategoriaData,
  ICategoriaRepository,
  ListCategoriasParams,
  ListCategoriasResult,
  UpdateCategoriaData,
} from "../../domain/ports/categoria.repository.js";

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

export class CategoriaDrizzleRepository implements ICategoriaRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Categoria | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(categoriaTable)
        .where(and(eq(categoriaTable.id, id), eq(categoriaTable.tenant_id, tenantId)));
    });
    return (rows[0] as Categoria) ?? null;
  }

  async list(tenantId: string, params: ListCategoriasParams): Promise<ListCategoriasResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(categoriaTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(categoriaTable.activo, params.activo));
      }

      if (params.padre_id !== undefined) {
        if (params.padre_id === "null") {
          conditions.push(isNull(categoriaTable.categoria_padre_id));
        } else {
          conditions.push(eq(categoriaTable.categoria_padre_id, params.padre_id));
        }
      }

      if (params.search) {
        conditions.push(ilike(categoriaTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(categoriaTable).where(where),
        tx
          .select()
          .from(categoriaTable)
          .where(where)
          .orderBy(categoriaTable.orden, categoriaTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      let result = items as Categoria[];

      if (params.incluir_hijos && result.length > 0) {
        const parentIds = result.map((c) => c.id);
        const hijos = await tx
          .select()
          .from(categoriaTable)
          .where(
            and(
              eq(categoriaTable.tenant_id, tenantId),
              inArray(categoriaTable.categoria_padre_id, parentIds)
            )
          )
          .orderBy(categoriaTable.orden, categoriaTable.nombre);

        const hijosByPadreId = new Map<string, Categoria[]>();
        for (const hijo of hijos as Categoria[]) {
          if (hijo.categoria_padre_id) {
            const list = hijosByPadreId.get(hijo.categoria_padre_id) ?? [];
            list.push(hijo);
            hijosByPadreId.set(hijo.categoria_padre_id, list);
          }
        }

        result = result.map((c) => ({
          ...c,
          hijos: hijosByPadreId.get(c.id) ?? [],
        }));
      }

      return { items: result, total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateCategoriaData): Promise<Categoria> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(categoriaTable)
        .values({
          tenant_id: tenantId,
          nombre: data.nombre,
          descripcion: data.descripcion ?? null,
          categoria_padre_id: data.categoria_padre_id ?? null,
          orden: data.orden,
        })
        .returning();
    });
    return rows[0] as Categoria;
  }

  async update(tenantId: string, id: string, data: UpdateCategoriaData): Promise<Categoria | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof categoriaTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.descripcion !== undefined) setValues.descripcion = data.descripcion;
      if (data.categoria_padre_id !== undefined)
        setValues.categoria_padre_id = data.categoria_padre_id;
      if (data.orden !== undefined) setValues.orden = data.orden;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(categoriaTable)
        .set(setValues)
        .where(and(eq(categoriaTable.id, id), eq(categoriaTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Categoria) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(categoriaTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(categoriaTable.id, id), eq(categoriaTable.tenant_id, tenantId)))
        .returning({ id: categoriaTable.id });
    });
    return rows.length > 0;
  }
}
