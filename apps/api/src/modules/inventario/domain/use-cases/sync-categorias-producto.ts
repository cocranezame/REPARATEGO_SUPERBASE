import type { SyncCategoriasProductoInput } from "@kallpasoft/validators";
import type { ProductoCategoria } from "../entities/producto-categoria.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

export async function syncCategoriasProducto(
  repo: IProductoRepository,
  tenantId: string,
  productoId: string,
  input: SyncCategoriasProductoInput
): Promise<ProductoCategoria[]> {
  return repo.syncCategorias(tenantId, productoId, input.pares);
}
