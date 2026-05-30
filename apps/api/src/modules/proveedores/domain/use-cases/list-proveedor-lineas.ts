import type { ProveedorLinea } from "../entities/proveedor.js";
import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function listProveedorLineas(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string
): Promise<ProveedorLinea[]> {
  return repo.listLineas(tenantId, proveedorId);
}
