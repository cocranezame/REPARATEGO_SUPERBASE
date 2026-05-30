import type {
  ICotizacionCompraRepository,
  ListCotizacionesParams,
  ListCotizacionesResult,
} from "../ports/cotizacion-compra.repository.js";

export async function listCotizacionesCompra(
  repo: ICotizacionCompraRepository,
  tenantId: string,
  params: ListCotizacionesParams
): Promise<ListCotizacionesResult> {
  return repo.list(tenantId, params);
}
