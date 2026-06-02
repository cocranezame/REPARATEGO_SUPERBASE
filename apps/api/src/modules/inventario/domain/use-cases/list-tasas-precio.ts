import type { TasaPrecio } from "../entities/tasa-precio.js";
import type { ITasaPrecioRepository } from "../ports/tasa-precio.repository.js";

export async function listTasasPrecio(
  repo: ITasaPrecioRepository,
  tenantId: string
): Promise<TasaPrecio[]> {
  return repo.list(tenantId);
}
