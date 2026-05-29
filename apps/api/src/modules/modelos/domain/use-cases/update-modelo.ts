import type { Modelo } from "../entities/modelo.js";
import type { IModeloRepository, UpdateModeloData } from "../ports/modelo.repository.js";

export interface UpdateModeloInput {
  marca_id?: string;
  categoria_id?: string;
  nombre?: string;
  activo?: boolean;
}

export async function updateModelo(
  repo: IModeloRepository,
  tenantId: string,
  id: string,
  input: UpdateModeloInput
): Promise<Modelo | null> {
  const data: UpdateModeloData = {
    ...(input.marca_id !== undefined ? { marca_id: input.marca_id } : {}),
    ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
