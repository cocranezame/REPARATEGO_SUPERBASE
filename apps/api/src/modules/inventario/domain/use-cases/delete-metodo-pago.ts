import type { IMetodoPagoRepository } from "../ports/metodo-pago.repository.js";

export async function deleteMetodoPago(
  repo: IMetodoPagoRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
