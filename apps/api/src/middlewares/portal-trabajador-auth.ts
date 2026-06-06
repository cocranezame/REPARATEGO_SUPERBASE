import type { MiddlewareHandler } from "hono";
import { verifyPortalTrabajadorToken } from "../lib/portal-trabajador-jwt.js";

export type PortalTrabajadorVariables = {
  portalUsuarioId: string;
  portalTenantId: string;
};

export const portalTrabajadorAuthMiddleware: MiddlewareHandler<{
  Variables: PortalTrabajadorVariables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_FORBIDDEN", message: "Token portal trabajador requerido" },
      },
      401
    );
  }

  try {
    const payload = verifyPortalTrabajadorToken(authHeader.slice(7));
    c.set("portalUsuarioId", payload.usuario_id);
    c.set("portalTenantId", payload.tenant_id);
  } catch {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_INVALID_TOKEN", message: "Token portal trabajador inválido" },
      },
      401
    );
  }

  return await next();
};
