import type { CreateMetodoPagoInput } from "@kallpasoft/validators";
import type { MetodoPagoCatalogo } from "../entities/metodo-pago-catalogo.js";
import type { IMetodoPagoRepository } from "../ports/metodo-pago.repository.js";

export async function createMetodoPago(
  repo: IMetodoPagoRepository,
  tenantId: string,
  input: CreateMetodoPagoInput
): Promise<MetodoPagoCatalogo> {
  return repo.create(tenantId, { nombre: input.nombre });
}
