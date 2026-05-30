import type { CotizacionCompra } from "../entities/cotizacion-compra.js";
import type {
  CotizarItemData,
  ICotizacionCompraRepository,
} from "../ports/cotizacion-compra.repository.js";

export async function cotizarCotizacionCompra(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  id: string,
  items: CotizarItemData[]
): Promise<CotizacionCompra | null> {
  return repo.cotizar(tenantId, id, items);
}
