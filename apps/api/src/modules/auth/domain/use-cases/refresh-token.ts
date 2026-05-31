import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../../lib/jwt.js";
import {
  addRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from "../../../../lib/token-store.js";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { AuthTokens } from "../entities/auth.js";
import type { IAuthRepository } from "../ports/auth.repository.js";

export async function refreshToken(repo: IAuthRepository, token: string): Promise<AuthTokens> {
  let payload: { tenant_id: string; user_id: string; jti: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError("AUTH_INVALID_TOKEN", "Refresh token inválido o expirado", 401);
  }

  // In production, enforce JTI rotation (revocation via in-memory/Redis store).
  // In dev, skip: the store is cleared on every --watch restart, which would
  // invalidate all sessions after any file change.
  if (process.env.NODE_ENV === "production" && !isRefreshTokenValid(payload.jti)) {
    throw new ApiError("AUTH_INVALID_TOKEN", "Refresh token revocado", 401);
  }

  const user = await repo.findUserForRefresh(payload.tenant_id, payload.user_id);
  if (!user || !user.activo) {
    throw new ApiError("AUTH_INVALID_TOKEN", "Usuario no disponible", 401);
  }

  revokeRefreshToken(payload.jti);

  const accessToken = signAccessToken({
    tenant_id: user.tenant_id,
    user_id: user.id,
    rol: user.rol,
    sucursal_id: user.sucursal_id,
  });
  const { token: newRefreshToken, jti: newJti } = signRefreshToken(user.id, user.tenant_id);

  addRefreshToken(newJti);

  return { access_token: accessToken, refresh_token: newRefreshToken };
}
