import type { IComponenteRepository } from "../ports/componente.repository.js";

export async function deleteComponente(
  repo: IComponenteRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
