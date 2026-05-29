import type { Usuario } from "../entities/usuario.js";
import type { IUsuarioRepository } from "../ports/usuario.repository.js";

export async function getUsuarioById(
  repo: IUsuarioRepository,
  tenantId: string,
  id: string
): Promise<Usuario | null> {
  return repo.findById(tenantId, id);
}
