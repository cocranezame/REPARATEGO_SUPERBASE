import type { CreateUsuarioInput } from "@kallpasoft/validators";
import bcrypt from "bcryptjs";
import type { Usuario } from "../entities/usuario.js";
import type { CreateUsuarioData, IUsuarioRepository } from "../ports/usuario.repository.js";

export async function createUsuario(
  repo: IUsuarioRepository,
  tenantId: string,
  input: CreateUsuarioInput
): Promise<Usuario> {
  const { password, sucursal_id, email, telefono, ...rest } = input;
  const password_hash = await bcrypt.hash(password, 10);

  const data: CreateUsuarioData = {
    ...rest,
    password_hash,
    ...(sucursal_id !== undefined ? { sucursal_id } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(telefono !== undefined ? { telefono } : {}),
  };

  return repo.create(tenantId, data);
}
