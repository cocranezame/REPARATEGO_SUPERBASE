import type {
  IProductoRepository,
  ListProductosParams,
  ListProductosResult,
} from "../ports/producto.repository.js";

export async function listProductos(
  repo: IProductoRepository,
  tenantId: string,
  params: ListProductosParams
): Promise<ListProductosResult> {
  return repo.list(tenantId, params);
}
