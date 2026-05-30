import type { CotizacionCompra } from "../entities/cotizacion-compra.js";
import type { ICotizacionCompraRepository } from "../ports/cotizacion-compra.repository.js";

export async function getCotizacionCompraById(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  id: string
): Promise<CotizacionCompra | null> {
  return repo.findById(tenantId, id);
}
