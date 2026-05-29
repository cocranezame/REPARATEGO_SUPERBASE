import type { Categoria } from "../entities/categoria.js";
import type { ICategoriaRepository } from "../ports/categoria.repository.js";

export async function getCategoriaById(
  repo: ICategoriaRepository,
  tenantId: string,
  id: string
): Promise<Categoria | null> {
  return repo.findById(tenantId, id);
}
