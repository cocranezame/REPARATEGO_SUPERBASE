import type { Marca } from "../entities/marca.js";
import type { IMarcaRepository } from "../ports/marca.repository.js";

export async function getMarcaById(
  repo: IMarcaRepository,
  tenantId: string,
  id: string
): Promise<Marca | null> {
  return repo.findById(tenantId, id);
}
