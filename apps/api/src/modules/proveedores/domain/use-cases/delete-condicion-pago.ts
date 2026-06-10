import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function deleteCondicionPago(
  repo: IProveedorRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.deleteCondicionPago(tenantId, id);
}
