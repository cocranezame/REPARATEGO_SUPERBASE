import type { DbClient } from "@kallpasoft/db";
import { featureFlag as featureFlagTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import type { FeatureFlag } from "../../domain/entities/feature-flag.js";
import type { IFeatureFlagRepository } from "../../domain/ports/feature-flag.repository.js";

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

export class FeatureFlagDrizzleRepository implements IFeatureFlagRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string): Promise<FeatureFlag[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx.select().from(featureFlagTable).where(eq(featureFlagTable.tenant_id, tenantId));
    });
    return rows as FeatureFlag[];
  }

  async upsert(tenantId: string, clave: string, habilitado: boolean): Promise<FeatureFlag> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(featureFlagTable)
        .values({ tenant_id: tenantId, clave, habilitado })
        .onConflictDoUpdate({
          target: [featureFlagTable.tenant_id, featureFlagTable.clave],
          set: { habilitado, updated_at: new Date() },
        })
        .returning();
    });
    return rows[0] as FeatureFlag;
  }
}
