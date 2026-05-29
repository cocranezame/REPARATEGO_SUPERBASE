import type {
  IModeloRepository,
  ListModelosParams,
  ListModelosResult,
} from "../ports/modelo.repository.js";

export async function listModelos(
  repo: IModeloRepository,
  tenantId: string,
  params: ListModelosParams
): Promise<ListModelosResult> {
  return repo.list(tenantId, params);
}
