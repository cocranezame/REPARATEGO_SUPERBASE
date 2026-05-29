import type { ISucursalRepository } from "../ports/sucursal.repository.js";

export async function deleteSucursal(
  repo: ISucursalRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
