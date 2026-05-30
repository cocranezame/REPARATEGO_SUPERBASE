import type { MetodoPagoCatalogo } from "../entities/metodo-pago-catalogo.js";
import type { IMetodoPagoRepository } from "../ports/metodo-pago.repository.js";

export async function listMetodosPago(
  repo: IMetodoPagoRepository,
  tenantId: string,
  activo?: boolean
): Promise<MetodoPagoCatalogo[]> {
  return repo.list(tenantId, activo);
}
