import type { IProductoRepository } from "../ports/producto.repository.js";

export async function deleteProducto(
  repo: IProductoRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
