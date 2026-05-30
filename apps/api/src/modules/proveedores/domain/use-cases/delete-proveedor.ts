import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function deleteProveedor(
  repo: IProveedorRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
