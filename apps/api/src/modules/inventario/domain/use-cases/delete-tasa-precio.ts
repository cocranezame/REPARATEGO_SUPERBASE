import type { ITasaPrecioRepository } from "../ports/tasa-precio.repository.js";

export async function deleteTasaPrecio(
  repo: ITasaPrecioRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.hardDelete(tenantId, id);
}
