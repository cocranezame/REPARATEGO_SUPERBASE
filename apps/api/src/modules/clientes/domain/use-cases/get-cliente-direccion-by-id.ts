import type { ClienteDireccion } from "../entities/cliente-direccion.js";
import type { IClienteDireccionRepository } from "../ports/cliente-direccion.repository.js";

export async function getClienteDireccionById(
  repo: IClienteDireccionRepository,
  tenantId: string,
  id: string,
  clienteId: string
): Promise<ClienteDireccion | null> {
  return repo.findById(tenantId, id, clienteId);
}
