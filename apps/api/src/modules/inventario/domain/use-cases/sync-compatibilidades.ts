import type { SyncCompatibilidadesInput } from "@kallpasoft/validators";
import type { ProductoCompatibilidad } from "../entities/producto-compatibilidad.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

export async function syncCompatibilidades(
  repo: IProductoRepository,
  tenantId: string,
  productoId: string,
  input: SyncCompatibilidadesInput
): Promise<ProductoCompatibilidad[]> {
  return repo.syncCompatibilidades(tenantId, productoId, input.modelo_ids);
}
