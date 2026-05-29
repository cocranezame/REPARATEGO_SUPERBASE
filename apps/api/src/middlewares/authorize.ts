import type { RolUsuario } from "@kallpasoft/shared";
import type { MiddlewareHandler } from "hono";
import type { HonoVariables } from "../types/context.js";

export function authorize(...roles: RolUsuario[]): MiddlewareHandler<{ Variables: HonoVariables }> {
  return async (c, next) => {
    const rol = c.get("rol");
    if (!roles.includes(rol)) {
      return c.json(
        {
          success: false,
          error: { code: "AUTH_FORBIDDEN", message: "No tienes permisos para esta acción" },
        },
        403
      );
    }
    return await next();
  };
}
