import type { FeatureFlag } from "../entities/feature-flag.js";
import type { IFeatureFlagRepository } from "../ports/feature-flag.repository.js";

export async function upsertFeatureFlag(
  repo: IFeatureFlagRepository,
  tenantId: string,
  clave: string,
  habilitado: boolean
): Promise<FeatureFlag> {
  return repo.upsert(tenantId, clave, habilitado);
}
