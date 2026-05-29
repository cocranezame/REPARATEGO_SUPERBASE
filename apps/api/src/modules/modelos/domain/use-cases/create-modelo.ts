import type { CreateModeloInput } from "@kallpasoft/validators";
import type { Modelo } from "../entities/modelo.js";
import type { CreateModeloData, IModeloRepository } from "../ports/modelo.repository.js";

export async function createModelo(
  repo: IModeloRepository,
  tenantId: string,
  input: CreateModeloInput
): Promise<Modelo> {
  const data: CreateModeloData = {
    marca_id: input.marca_id,
    categoria_id: input.categoria_id,
    nombre: input.nombre,
  };
  return repo.create(tenantId, data);
}
