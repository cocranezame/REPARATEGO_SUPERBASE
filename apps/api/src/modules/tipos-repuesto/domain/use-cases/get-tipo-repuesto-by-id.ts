import type { TipoRepuesto } from "../entities/tipo-repuesto.js";
import type { ITipoRepuestoRepository } from "../ports/tipo-repuesto.repository.js";

export async function getTipoRepuestoById(
  repo: ITipoRepuestoRepository,
  tenantId: string,
  id: string
): Promise<TipoRepuesto | null> {
  return repo.findById(tenantId, id);
}
