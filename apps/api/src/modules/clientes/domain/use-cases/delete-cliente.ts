import type { IClienteRepository } from "../ports/cliente.repository.js";

export async function deleteCliente(
  repo: IClienteRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
