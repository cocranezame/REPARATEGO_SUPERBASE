import type { IClienteDireccionRepository } from "../ports/cliente-direccion.repository.js";

export async function deleteClienteDireccion(
  repo: IClienteDireccionRepository,
  tenantId: string,
  id: string,
  clienteId: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id, clienteId);
}
