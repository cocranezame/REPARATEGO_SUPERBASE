import type {
  IClienteRepository,
  ListClientesParams,
  ListClientesResult,
} from "../ports/cliente.repository.js";

export async function listClientes(
  repo: IClienteRepository,
  tenantId: string,
  params: ListClientesParams
): Promise<ListClientesResult> {
  return repo.list(tenantId, params);
}
