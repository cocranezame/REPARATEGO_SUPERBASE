import type {
  ISucursalRepository,
  ListSucursalesParams,
  ListSucursalesResult,
} from "../ports/sucursal.repository.js";

export async function listSucursales(
  repo: ISucursalRepository,
  tenantId: string,
  params: ListSucursalesParams
): Promise<ListSucursalesResult> {
  return repo.list(tenantId, params);
}
