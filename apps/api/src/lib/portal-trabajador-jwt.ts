import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-secret-change-me-in-production";

export interface PortalTrabajadorTokenPayload {
  usuario_id: string;
  tenant_id: string;
  type: "portal_trabajador";
}

export function signPortalTrabajadorToken(usuarioId: string, tenantId: string): string {
  return jwt.sign(
    { usuario_id: usuarioId, tenant_id: tenantId, type: "portal_trabajador" },
    secret,
    { expiresIn: "8h" }
  );
}

export function verifyPortalTrabajadorToken(token: string): PortalTrabajadorTokenPayload {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  if (payload.type !== "portal_trabajador") throw new Error("Not a portal_trabajador token");
  return {
    usuario_id: payload.usuario_id as string,
    tenant_id: payload.tenant_id as string,
    type: "portal_trabajador",
  };
}
