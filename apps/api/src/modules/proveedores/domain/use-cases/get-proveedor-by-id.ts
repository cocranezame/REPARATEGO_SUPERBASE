import type { Proveedor } from "../entities/proveedor.js";
import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function getProveedorById(
  repo: IProveedorRepository,
  tenantId: string,
  id: string
): Promise<Proveedor | null> {
  return repo.findById(tenantId, id);
}
