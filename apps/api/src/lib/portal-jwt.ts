import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-secret-change-me-in-production";

export interface PortalTokenPayload {
  cliente_id: string;
  tenant_id: string;
  type: "portal";
}

export function signPortalToken(clienteId: string, tenantId: string): string {
  return jwt.sign({ cliente_id: clienteId, tenant_id: tenantId, type: "portal" }, secret, {
    expiresIn: "24h",
  });
}

export function verifyPortalToken(token: string): PortalTokenPayload {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  if (payload.type !== "portal") throw new Error("Not a portal token");
  return {
    cliente_id: payload.cliente_id as string,
    tenant_id: payload.tenant_id as string,
    type: "portal",
  };
}
