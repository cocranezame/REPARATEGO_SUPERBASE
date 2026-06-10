import type { ProductoCategoria } from "../entities/producto-categoria.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

export async function listCategoriasProducto(
  repo: IProductoRepository,
  tenantId: string,
  productoId: string
): Promise<ProductoCategoria[]> {
  return repo.listCategorias(tenantId, productoId);
}
