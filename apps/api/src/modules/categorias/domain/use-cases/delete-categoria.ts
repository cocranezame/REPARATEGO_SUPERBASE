import type { ICategoriaRepository } from "../ports/categoria.repository.js";

export async function deleteCategoria(
  repo: ICategoriaRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
