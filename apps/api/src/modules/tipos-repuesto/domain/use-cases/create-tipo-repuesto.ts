import type { CreateTipoRepuestoInput } from "@kallpasoft/validators";
import type { TipoRepuesto } from "../entities/tipo-repuesto.js";
import type { ITipoRepuestoRepository } from "../ports/tipo-repuesto.repository.js";

export async function createTipoRepuesto(
  repo: ITipoRepuestoRepository,
  tenantId: string,
  input: CreateTipoRepuestoInput
): Promise<TipoRepuesto> {
  return repo.create(tenantId, { componente_id: input.componente_id, nombre: input.nombre });
}
