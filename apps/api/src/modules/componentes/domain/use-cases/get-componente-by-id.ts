import type { Componente } from "../entities/componente.js";
import type { IComponenteRepository } from "../ports/componente.repository.js";

export async function getComponenteById(
  repo: IComponenteRepository,
  tenantId: string,
  id: string
): Promise<Componente | null> {
  return repo.findById(tenantId, id);
}
