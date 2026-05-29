import type { LoginInput, LogoutInput, RefreshTokenInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IAuthRepository } from "../domain/ports/auth.repository.js";
import { login } from "../domain/use-cases/login.js";
import { logout } from "../domain/use-cases/logout.js";
import { refreshToken } from "../domain/use-cases/refresh-token.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createAuthHandlers(repo: IAuthRepository) {
  async function loginHandler(c: HonoCtx) {
    const body = c.req.valid("json") as LoginInput;
    const tenantId = c.req.header("X-Tenant-Id");

    if (!tenantId) {
      throw new ApiError("MISSING_TENANT", "Header X-Tenant-Id requerido", 400);
    }

    const result = await login(repo, tenantId, body);
    return c.json({ success: true, data: result });
  }

  async function refreshHandler(c: HonoCtx) {
    const body = c.req.valid("json") as RefreshTokenInput;
    const tokens = await refreshToken(repo, body.refresh_token);
    return c.json({ success: true, data: tokens });
  }

  function logoutHandler(c: HonoCtx) {
    const body = c.req.valid("json") as LogoutInput;
    logout(body.refresh_token);
    return c.json({ success: true, data: null });
  }

  return { login: loginHandler, refresh: refreshHandler, logout: logoutHandler };
}
