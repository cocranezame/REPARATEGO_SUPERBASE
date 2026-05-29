import type { CreateMarcaInput } from "@kallpasoft/validators";
import type { Marca } from "../entities/marca.js";
import type { CreateMarcaData, IMarcaRepository } from "../ports/marca.repository.js";

export async function createMarca(
  repo: IMarcaRepository,
  tenantId: string,
  input: CreateMarcaInput
): Promise<Marca> {
  const data: CreateMarcaData = {
    nombre: input.nombre,
    ...(input.logo_url !== undefined ? { logo_url: input.logo_url } : {}),
  };
  return repo.create(tenantId, data);
}
