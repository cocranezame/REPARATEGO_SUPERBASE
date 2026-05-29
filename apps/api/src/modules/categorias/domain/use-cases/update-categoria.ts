import type { Categoria } from "../entities/categoria.js";
import type { ICategoriaRepository, UpdateCategoriaData } from "../ports/categoria.repository.js";

export interface UpdateCategoriaInput {
  nombre?: string;
  descripcion?: string;
  categoria_padre_id?: string;
  orden?: number;
  activo?: boolean;
}

export async function updateCategoria(
  repo: ICategoriaRepository,
  tenantId: string,
  id: string,
  input: UpdateCategoriaInput
): Promise<Categoria | null> {
  const data: UpdateCategoriaData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
    ...(input.categoria_padre_id !== undefined
      ? { categoria_padre_id: input.categoria_padre_id }
      : {}),
    ...(input.orden !== undefined ? { orden: input.orden } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
