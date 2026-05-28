import type { DbClient } from "@kallpasoft/db";
import { sucursal as sucursalTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, ilike, ne, or, sql } from "drizzle-orm";
import type { Sucursal } from "../../domain/entities/sucursal.js";
import type {
  CreateSucursalData,
  ISucursalRepository,
  ListSucursalesParams,
  ListSucursalesResult,
  UpdateSucursalData,
} from "../../domain/ports/sucursal.repository.js";

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

export class SucursalDrizzleRepository implements ISucursalRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Sucursal | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(sucursalTable)
        .where(and(eq(sucursalTable.id, id), eq(sucursalTable.tenant_id, tenantId)));
    });
    return (rows[0] as Sucursal) ?? null;
  }

  async list(tenantId: string, params: ListSucursalesParams): Promise<ListSucursalesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const where = and(
        eq(sucursalTable.tenant_id, tenantId),
        params.activo !== undefined ? eq(sucursalTable.activo, params.activo) : undefined,
        params.search
          ? or(
              ilike(sucursalTable.nombre, `%${params.search}%`),
              ilike(sucursalTable.distrito, `%${params.search}%`)
            )
          : undefined
      );

      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(sucursalTable).where(where),
        tx.select().from(sucursalTable).where(where).limit(params.pageSize).offset(offset),
      ]);

      return { items: items as Sucursal[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateSucursalData): Promise<Sucursal> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal) {
        await tx
          .update(sucursalTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(eq(sucursalTable.tenant_id, tenantId));
      }

      return tx
        .insert(sucursalTable)
        .values({
          tenant_id: tenantId,
          nombre: data.nombre,
          direccion: data.direccion ?? null,
          distrito: data.distrito ?? null,
          telefono: data.telefono ?? null,
          es_principal: data.es_principal,
        })
        .returning();
    });
    return rows[0] as Sucursal;
  }

  async update(tenantId: string, id: string, data: UpdateSucursalData): Promise<Sucursal | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal === true) {
        await tx
          .update(sucursalTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(and(eq(sucursalTable.tenant_id, tenantId), ne(sucursalTable.id, id)));
      }

      const setValues: Partial<typeof sucursalTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.direccion !== undefined) setValues.direccion = data.direccion;
      if (data.distrito !== undefined) setValues.distrito = data.distrito;
      if (data.telefono !== undefined) setValues.telefono = data.telefono;
      if (data.es_principal !== undefined) setValues.es_principal = data.es_principal;

      return tx
        .update(sucursalTable)
        .set(setValues)
        .where(and(eq(sucursalTable.id, id), eq(sucursalTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Sucursal) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(sucursalTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(sucursalTable.id, id), eq(sucursalTable.tenant_id, tenantId)))
        .returning({ id: sucursalTable.id });
    });
    return rows.length > 0;
  }
}
