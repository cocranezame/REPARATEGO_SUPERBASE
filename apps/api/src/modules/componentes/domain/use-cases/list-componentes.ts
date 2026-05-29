import type {
  IComponenteRepository,
  ListComponentesParams,
  ListComponentesResult,
} from "../ports/componente.repository.js";

export async function listComponentes(
  repo: IComponenteRepository,
  tenantId: string,
  params: ListComponentesParams
): Promise<ListComponentesResult> {
  return repo.list(tenantId, params);
}
