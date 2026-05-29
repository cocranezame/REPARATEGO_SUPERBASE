import type { FeatureFlag } from "../entities/feature-flag.js";

export interface IFeatureFlagRepository {
  list(tenantId: string): Promise<FeatureFlag[]>;
  upsert(tenantId: string, clave: string, habilitado: boolean): Promise<FeatureFlag>;
}
