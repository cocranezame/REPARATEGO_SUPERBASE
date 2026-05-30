import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function deleteProveedorMetodoPago(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  proveedorId: string
): Promise<boolean> {
  return repo.deleteMetodoPago(tenantId, id, proveedorId);
}
