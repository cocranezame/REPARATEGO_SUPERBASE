import type { Marca } from "../entities/marca.js";
import type { IMarcaRepository, UpdateMarcaData } from "../ports/marca.repository.js";

export interface UpdateMarcaInput {
  nombre?: string;
  logo_url?: string;
  activo?: boolean;
}

export async function updateMarca(
  repo: IMarcaRepository,
  tenantId: string,
  id: string,
  input: UpdateMarcaInput
): Promise<Marca | null> {
  const data: UpdateMarcaData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.logo_url !== undefined ? { logo_url: input.logo_url } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
