import type { IModeloRepository } from "../ports/modelo.repository.js";

export async function deleteModelo(
  repo: IModeloRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
