import type { FeatureFlag } from "../entities/feature-flag.js";
import type { IFeatureFlagRepository } from "../ports/feature-flag.repository.js";

export async function listFeatureFlags(
  repo: IFeatureFlagRepository,
  tenantId: string
): Promise<FeatureFlag[]> {
  return repo.list(tenantId);
}
