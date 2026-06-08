import type { CotizacionCompra } from "../entities/cotizacion-compra.js";
import type {
  ICotizacionCompraRepository,
  UpdateCotizacionCompraData,
} from "../ports/cotizacion-compra.repository.js";

export async function updateCotizacionCompra(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  id: string,
  data: UpdateCotizacionCompraData
): Promise<CotizacionCompra | null> {
  return repo.update(tenantId, id, data);
}
