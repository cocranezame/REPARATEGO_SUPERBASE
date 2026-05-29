import type { Modelo } from "../entities/modelo.js";
import type { IModeloRepository } from "../ports/modelo.repository.js";

export async function getModeloById(
  repo: IModeloRepository,
  tenantId: string,
  id: string
): Promise<Modelo | null> {
  return repo.findById(tenantId, id);
}
