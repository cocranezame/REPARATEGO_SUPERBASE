import { RolUsuario } from "@kallpasoft/shared";
import type { MiddlewareHandler } from "hono";
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

  // Stub: production will verify JWT with Supabase and extract real claims
  c.set("tenantId", "stub-tenant-id");
  c.set("userId", "stub-user-id");
  c.set("rol", RolUsuario.ADMIN);

  return await next();
};
