import type { LoginInput } from "@kallpasoft/validators";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../../../../lib/jwt.js";
import { addRefreshToken } from "../../../../lib/token-store.js";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { IAuthRepository } from "../ports/auth.repository.js";

export async function login(repo: IAuthRepository, tenantId: string, input: LoginInput) {
  const user = await repo.findUserForAuth(tenantId, input.numero_documento);

  if (!user || !user.activo) {
    throw new ApiError("AUTH_INVALID_CREDENTIALS", "Credenciales incorrectas", 401);
  }

  const validPassword = await bcrypt.compare(input.password, user.password_hash);
  if (!validPassword) {
    throw new ApiError("AUTH_INVALID_CREDENTIALS", "Credenciales incorrectas", 401);
  }

  const accessToken = signAccessToken({
    tenant_id: user.tenant_id,
    user_id: user.id,
    rol: user.rol,
    sucursal_id: user.sucursal_id,
  });
  const { token: refreshToken, jti } = signRefreshToken(user.id, user.tenant_id);

  addRefreshToken(jti);
  await repo.updateUltimoLogin(tenantId, user.id);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
      tenant_id: user.tenant_id,
      sucursal_id: user.sucursal_id,
    },
  };
}
