import type { Sucursal } from "../entities/sucursal.js";
import type { ISucursalRepository } from "../ports/sucursal.repository.js";

export async function getSucursalById(
  repo: ISucursalRepository,
  tenantId: string,
  id: string
): Promise<Sucursal | null> {
  return repo.findById(tenantId, id);
}
