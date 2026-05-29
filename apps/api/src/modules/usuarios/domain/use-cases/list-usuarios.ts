import type {
  IUsuarioRepository,
  ListUsuariosParams,
  ListUsuariosResult,
} from "../ports/usuario.repository.js";

export async function listUsuarios(
  repo: IUsuarioRepository,
  tenantId: string,
  params: ListUsuariosParams
): Promise<ListUsuariosResult> {
  return repo.list(tenantId, params);
}
