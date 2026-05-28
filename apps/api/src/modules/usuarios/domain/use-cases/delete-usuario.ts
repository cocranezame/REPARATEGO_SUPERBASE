import type { IUsuarioRepository } from "../ports/usuario.repository.js";

export async function deleteUsuario(
  repo: IUsuarioRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  return repo.softDelete(tenantId, id);
}
