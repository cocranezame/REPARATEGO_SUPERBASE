import type { RolUsuario } from "@kallpasoft/shared";
import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";
import type { HonoVariables } from "../types/context.js";

export const authMiddleware: MiddlewareHandler<{ Variables: HonoVariables }> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_FORBIDDEN", message: "Authorization header required" },
      },
      401
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    c.set("tenantId", payload.tenant_id);
    c.set("userId", payload.user_id);
    c.set("rol", payload.rol as RolUsuario);
  } catch {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_INVALID_TOKEN", message: "Token inválido o expirado" },
      },
      401
    );
  }

  return await next();
};
