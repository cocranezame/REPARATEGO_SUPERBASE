import type { ITipoRepuestoRepository } from "../ports/tipo-repuesto.repository.js";

export async function deleteTipoRepuesto(
  repo: ITipoRepuestoRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
