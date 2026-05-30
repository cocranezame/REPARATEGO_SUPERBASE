import type { Producto } from "../entities/producto.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

export async function getProductoById(
  repo: IProductoRepository,
  tenantId: string,
  id: string
): Promise<Producto | null> {
  return repo.findById(tenantId, id);
}
