import type { CotizacionCompra } from "../entities/cotizacion-compra.js";
import type {
  CreateCotizacionCompraData,
  ICotizacionCompraRepository,
} from "../ports/cotizacion-compra.repository.js";

export async function createCotizacionCompra(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  data: CreateCotizacionCompraData
): Promise<CotizacionCompra> {
  return repo.create(tenantId, data);
}
