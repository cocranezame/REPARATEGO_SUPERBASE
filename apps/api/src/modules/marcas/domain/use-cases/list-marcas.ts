import type {
  IMarcaRepository,
  ListMarcasParams,
  ListMarcasResult,
} from "../ports/marca.repository.js";

export async function listMarcas(
  repo: IMarcaRepository,
  tenantId: string,
  params: ListMarcasParams
): Promise<ListMarcasResult> {
  return repo.list(tenantId, params);
}
