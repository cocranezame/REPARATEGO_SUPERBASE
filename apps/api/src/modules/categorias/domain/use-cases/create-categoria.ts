import type { CreateCategoriaInput } from "@kallpasoft/validators";
import type { Categoria } from "../entities/categoria.js";
import type { CreateCategoriaData, ICategoriaRepository } from "../ports/categoria.repository.js";

export async function createCategoria(
  repo: ICategoriaRepository,
  tenantId: string,
  input: CreateCategoriaInput
): Promise<Categoria> {
  const data: CreateCategoriaData = {
    nombre: input.nombre,
    orden: input.orden,
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
    ...(input.categoria_padre_id !== undefined
      ? { categoria_padre_id: input.categoria_padre_id }
      : {}),
  };
  return repo.create(tenantId, data);
}
