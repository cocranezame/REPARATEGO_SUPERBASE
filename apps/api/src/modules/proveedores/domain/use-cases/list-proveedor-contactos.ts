import type { ProveedorContacto } from "../entities/proveedor.js";
import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function listProveedorContactos(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string
): Promise<ProveedorContacto[]> {
  return repo.listContactos(tenantId, proveedorId);
}
