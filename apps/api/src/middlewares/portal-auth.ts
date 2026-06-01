import type { MiddlewareHandler } from "hono";
import { verifyPortalToken } from "../lib/portal-jwt.js";

export type PortalVariables = {
  portalClienteId: string;
  portalTenantId: string;
};

export const portalAuthMiddleware: MiddlewareHandler<{ Variables: PortalVariables }> = async (
  c,
  next
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { success: false, error: { code: "AUTH_FORBIDDEN", message: "Token portal requerido" } },
      401
    );
  }

  try {
    const payload = verifyPortalToken(authHeader.slice(7));
    c.set("portalClienteId", payload.cliente_id);
    c.set("portalTenantId", payload.tenant_id);
  } catch {
    return c.json(
      { success: false, error: { code: "AUTH_INVALID_TOKEN", message: "Token portal inválido" } },
      401
    );
  }

  return await next();
};
