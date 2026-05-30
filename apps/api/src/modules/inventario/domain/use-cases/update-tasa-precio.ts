import type { UpdateTasaPrecioInput } from "@kallpasoft/validators";
import type { TasaPrecio } from "../entities/tasa-precio.js";
import type {
  ITasaPrecioRepository,
  UpdateTasaPrecioData,
} from "../ports/tasa-precio.repository.js";

export type { UpdateTasaPrecioInput };

export async function updateTasaPrecio(
  repo: ITasaPrecioRepository,
  tenantId: string,
  id: string,
  input: UpdateTasaPrecioInput
): Promise<TasaPrecio | null> {
  const data: UpdateTasaPrecioData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.porcentaje !== undefined ? { porcentaje: input.porcentaje } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
