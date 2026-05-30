import type { CreateTasaPrecioInput } from "@kallpasoft/validators";
import type { TasaPrecio } from "../entities/tasa-precio.js";
import type { ITasaPrecioRepository } from "../ports/tasa-precio.repository.js";

export async function createTasaPrecio(
  repo: ITasaPrecioRepository,
  tenantId: string,
  input: CreateTasaPrecioInput
): Promise<TasaPrecio> {
  return repo.create(tenantId, { nombre: input.nombre, porcentaje: input.porcentaje });
}
