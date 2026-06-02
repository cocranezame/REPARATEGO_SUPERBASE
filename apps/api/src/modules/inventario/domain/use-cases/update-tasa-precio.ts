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
    ...(input.tasa_tipo !== undefined ? { tasa_tipo: input.tasa_tipo } : {}),
    ...(input.tasa_valor !== undefined ? { tasa_valor: input.tasa_valor } : {}),
  };
  return repo.update(tenantId, id, data);
}
