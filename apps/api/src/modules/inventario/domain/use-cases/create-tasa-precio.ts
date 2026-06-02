import type { CreateTasaPrecioInput } from "@kallpasoft/validators";
import type { TasaPrecio } from "../entities/tasa-precio.js";
import type { ITasaPrecioRepository } from "../ports/tasa-precio.repository.js";

export async function createTasaPrecio(
  repo: ITasaPrecioRepository,
  tenantId: string,
  userId: string,
  input: CreateTasaPrecioInput
): Promise<TasaPrecio> {
  return repo.create(tenantId, {
    nivel: input.nivel,
    tasa_tipo: input.tasa_tipo,
    tasa_valor: input.tasa_valor,
    created_by: userId,
    ...(input.producto_id !== undefined ? { producto_id: input.producto_id } : {}),
    ...(input.tipo_registro !== undefined ? { tipo_registro: input.tipo_registro } : {}),
    ...(input.componente_id !== undefined ? { componente_id: input.componente_id } : {}),
  });
}
