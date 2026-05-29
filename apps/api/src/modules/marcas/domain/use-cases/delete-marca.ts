import type { IMarcaRepository } from "../ports/marca.repository.js";

export async function deleteMarca(
  repo: IMarcaRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
