import type { ICotizacionCompraRepository } from "../ports/cotizacion-compra.repository.js";

export async function deleteCotizacionCompra(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.delete(tenantId, id);
}
