import type {
  ITipoRepuestoRepository,
  ListTiposRepuestoParams,
  ListTiposRepuestoResult,
} from "../ports/tipo-repuesto.repository.js";

export async function listTiposRepuesto(
  repo: ITipoRepuestoRepository,
  tenantId: string,
  params: ListTiposRepuestoParams
): Promise<ListTiposRepuestoResult> {
  return repo.list(tenantId, params);
}
