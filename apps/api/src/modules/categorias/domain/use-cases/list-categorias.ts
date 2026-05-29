import type {
  ICategoriaRepository,
  ListCategoriasParams,
  ListCategoriasResult,
} from "../ports/categoria.repository.js";

export async function listCategorias(
  repo: ICategoriaRepository,
  tenantId: string,
  params: ListCategoriasParams
): Promise<ListCategoriasResult> {
  return repo.list(tenantId, params);
}
