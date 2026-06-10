import type { CondicionPago } from "../entities/proveedor.js";
import type { IProveedorRepository } from "../ports/proveedor.repository.js";

export async function listCondicionesPago(
  repo: IProveedorRepository,
  tenantId: string
): Promise<CondicionPago[]> {
  return repo.listCondicionesPago(tenantId);
}
