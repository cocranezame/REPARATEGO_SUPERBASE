import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function deleteProveedorLinea(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  proveedorId: string
): Promise<boolean> {
  return repo.deleteLinea(tenantId, id, proveedorId);
}
