import type { UpdateTipoRepuestoInput } from "@kallpasoft/validators";
import type { TipoRepuesto } from "../entities/tipo-repuesto.js";
import type {
  ITipoRepuestoRepository,
  UpdateTipoRepuestoData,
} from "../ports/tipo-repuesto.repository.js";

export type { UpdateTipoRepuestoInput };

export async function updateTipoRepuesto(
  repo: ITipoRepuestoRepository,
  tenantId: string,
  id: string,
  input: UpdateTipoRepuestoInput
): Promise<TipoRepuesto | null> {
  const data: UpdateTipoRepuestoData = {
    ...(input.componente_id !== undefined ? { componente_id: input.componente_id } : {}),
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
  };
  return repo.update(tenantId, id, data);
}
