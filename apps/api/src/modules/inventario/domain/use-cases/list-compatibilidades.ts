import type { ProductoCompatibilidad } from "../entities/producto-compatibilidad.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

export async function listCompatibilidades(
  repo: IProductoRepository,
  tenantId: string,
  productoId: string
): Promise<ProductoCompatibilidad[]> {
  return repo.listCompatibilidades(tenantId, productoId);
}
