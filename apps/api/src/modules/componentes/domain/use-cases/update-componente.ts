import type { Componente } from "../entities/componente.js";
import type {
  IComponenteRepository,
  UpdateComponenteData,
} from "../ports/componente.repository.js";

export interface UpdateComponenteInput {
  categoria_id?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export async function updateComponente(
  repo: IComponenteRepository,
  tenantId: string,
  id: string,
  input: UpdateComponenteInput
): Promise<Componente | null> {
  const data: UpdateComponenteData = {
    ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
