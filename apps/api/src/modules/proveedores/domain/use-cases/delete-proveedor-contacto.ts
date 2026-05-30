import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function deleteProveedorContacto(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  proveedorId: string
): Promise<boolean> {
  return repo.deleteContacto(tenantId, id, proveedorId);
}
