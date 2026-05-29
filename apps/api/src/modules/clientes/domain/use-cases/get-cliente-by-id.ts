import type { Cliente } from "../entities/cliente.js";
import type { IClienteRepository } from "../ports/cliente.repository.js";

export async function getClienteById(
  repo: IClienteRepository,
  tenantId: string,
  id: string
): Promise<Cliente | null> {
  return repo.findById(tenantId, id);
}
