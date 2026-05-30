import type {
  IProveedorRepository,
  ListProveedoresParams,
  ListProveedoresResult,
} from "../ports/proveedor.repository.js";

export async function listProveedores(
  repo: IProveedorRepository,
  tenantId: string,
  params: ListProveedoresParams
): Promise<ListProveedoresResult> {
  return repo.list(tenantId, params);
}
