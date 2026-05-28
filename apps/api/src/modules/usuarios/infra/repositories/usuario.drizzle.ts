import type { DbClient } from "@kallpasoft/db";
import { usuario as usuarioTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, count, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import type { Usuario } from "../../domain/entities/usuario.js";
import type {
  CreateUsuarioData,
  IUsuarioRepository,
  ListUsuariosParams,
  ListUsuariosResult,
  UpdateUsuarioData,
} from "../../domain/ports/usuario.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// All columns except password_hash — never return it
const { password_hash: _ph, ...usuarioColumns } = getTableColumns(usuarioTable);

interface TxLike {
  execute(query: SQL<unknown>): Promise<unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic; structural interface above ensures type safety
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class UsuarioDrizzleRepository implements IUsuarioRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Usuario | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select(usuarioColumns)
        .from(usuarioTable)
        .where(and(eq(usuarioTable.id, id), eq(usuarioTable.tenant_id, tenantId)));
    });
    return (rows[0] as Usuario) ?? null;
  }

  async list(tenantId: string, params: ListUsuariosParams): Promise<ListUsuariosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const where = and(
        eq(usuarioTable.tenant_id, tenantId),
        params.activo !== undefined ? eq(usuarioTable.activo, params.activo) : undefined,
        params.rol !== undefined ? eq(usuarioTable.rol, params.rol) : undefined,
        params.search
          ? or(
              ilike(usuarioTable.nombres, `%${params.search}%`),
              ilike(usuarioTable.apellidos, `%${params.search}%`),
              ilike(usuarioTable.numero_documento, `%${params.search}%`)
            )
          : undefined
      );

      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(usuarioTable).where(where),
        tx
          .select(usuarioColumns)
          .from(usuarioTable)
          .where(where)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Usuario[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateUsuarioData): Promise<Usuario> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(usuarioTable)
        .values({
          tenant_id: tenantId,
          sucursal_id: data.sucursal_id ?? null,
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento,
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email ?? null,
          telefono: data.telefono ?? null,
          password_hash: data.password_hash,
          rol: data.rol,
        })
        .returning(usuarioColumns);
    });
    return rows[0] as Usuario;
  }

  async update(tenantId: string, id: string, data: UpdateUsuarioData): Promise<Usuario | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof usuarioTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.sucursal_id !== undefined) setValues.sucursal_id = data.sucursal_id;
      if (data.tipo_documento !== undefined) setValues.tipo_documento = data.tipo_documento;
      if (data.numero_documento !== undefined) setValues.numero_documento = data.numero_documento;
      if (data.nombres !== undefined) setValues.nombres = data.nombres;
      if (data.apellidos !== undefined) setValues.apellidos = data.apellidos;
      if (data.email !== undefined) setValues.email = data.email;
      if (data.telefono !== undefined) setValues.telefono = data.telefono;
      if (data.password_hash !== undefined) setValues.password_hash = data.password_hash;
      if (data.rol !== undefined) setValues.rol = data.rol;

      return tx
        .update(usuarioTable)
        .set(setValues)
        .where(and(eq(usuarioTable.id, id), eq(usuarioTable.tenant_id, tenantId)))
        .returning(usuarioColumns);
    });
    return (rows[0] as Usuario) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(usuarioTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(usuarioTable.id, id), eq(usuarioTable.tenant_id, tenantId)))
        .returning({ id: usuarioTable.id });
    });
    return rows.length > 0;
  }
}
