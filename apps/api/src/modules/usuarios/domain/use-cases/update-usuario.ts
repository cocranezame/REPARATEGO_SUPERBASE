import type { RolUsuario, TipoDocumento } from "@kallpasoft/shared";
import bcrypt from "bcryptjs";
import type { Usuario } from "../entities/usuario.js";
import type { IUsuarioRepository, UpdateUsuarioData } from "../ports/usuario.repository.js";

export type UpdateUsuarioInput = {
  sucursal_id?: string | null;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  nombres?: string;
  apellidos?: string;
  email?: string | null;
  telefono?: string | null;
  password?: string;
  rol?: RolUsuario;
};

export async function updateUsuario(
  repo: IUsuarioRepository,
  tenantId: string,
  id: string,
  input: UpdateUsuarioInput
): Promise<Usuario | null> {
  const { password, ...rest } = input;
  const data: UpdateUsuarioData = { ...rest };
  if (password) {
    data.password_hash = await bcrypt.hash(password, 10);
  }
  return repo.update(tenantId, id, data);
}
