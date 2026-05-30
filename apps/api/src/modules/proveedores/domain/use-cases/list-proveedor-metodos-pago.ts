import type { ProveedorMetodoPago } from "../entities/proveedor.js";
import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function listProveedorMetodosPago(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string
): Promise<ProveedorMetodoPago[]> {
  return repo.listMetodosPago(tenantId, proveedorId);
}
