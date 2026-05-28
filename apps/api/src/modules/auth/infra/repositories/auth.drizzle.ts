import type { DbClient } from "@kallpasoft/db";
import { usuario as usuarioTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import type { UserForAuth, UserForRefresh } from "../../domain/entities/auth.js";
import type { IAuthRepository } from "../../domain/ports/auth.repository.js";

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

export class AuthDrizzleRepository implements IAuthRepository {
  constructor(private readonly db: DbClient) {}

  async findUserForAuth(tenantId: string, numeroDocumento: string): Promise<UserForAuth | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select({
          id: usuarioTable.id,
          tenant_id: usuarioTable.tenant_id,
          sucursal_id: usuarioTable.sucursal_id,
          nombres: usuarioTable.nombres,
          apellidos: usuarioTable.apellidos,
          rol: usuarioTable.rol,
          password_hash: usuarioTable.password_hash,
          activo: usuarioTable.activo,
        })
        .from(usuarioTable)
        .where(
          and(
            eq(usuarioTable.tenant_id, tenantId),
            eq(usuarioTable.numero_documento, numeroDocumento)
          )
        );
    });
    return (rows[0] as UserForAuth) ?? null;
  }

  async findUserForRefresh(tenantId: string, userId: string): Promise<UserForRefresh | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select({
          id: usuarioTable.id,
          tenant_id: usuarioTable.tenant_id,
          sucursal_id: usuarioTable.sucursal_id,
          rol: usuarioTable.rol,
          activo: usuarioTable.activo,
        })
        .from(usuarioTable)
        .where(and(eq(usuarioTable.id, userId), eq(usuarioTable.tenant_id, tenantId)));
    });
    return (rows[0] as UserForRefresh) ?? null;
  }

  async updateUltimoLogin(tenantId: string, userId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      await tx
        .update(usuarioTable)
        .set({ ultimo_login: new Date(), updated_at: new Date() })
        .where(and(eq(usuarioTable.id, userId), eq(usuarioTable.tenant_id, tenantId)));
    });
  }
}
