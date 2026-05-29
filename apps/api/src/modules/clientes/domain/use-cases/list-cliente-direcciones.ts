import type { ClienteDireccion } from "../entities/cliente-direccion.js";
import type { IClienteDireccionRepository } from "../ports/cliente-direccion.repository.js";

export async function listClienteDirecciones(
  repo: IClienteDireccionRepository,
  tenantId: string,
  clienteId: string
): Promise<ClienteDireccion[]> {
  return repo.listByCliente(tenantId, clienteId);
}
