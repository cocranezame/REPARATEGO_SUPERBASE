import type { CreateComponenteInput } from "@kallpasoft/validators";
import type { Componente } from "../entities/componente.js";
import type {
  CreateComponenteData,
  IComponenteRepository,
} from "../ports/componente.repository.js";

export async function createComponente(
  repo: IComponenteRepository,
  tenantId: string,
  input: CreateComponenteInput
): Promise<Componente> {
  const data: CreateComponenteData = {
    categoria_id: input.categoria_id,
    nombre: input.nombre,
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
  };
  return repo.create(tenantId, data);
}
