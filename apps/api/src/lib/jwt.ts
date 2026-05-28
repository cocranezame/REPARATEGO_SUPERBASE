import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-secret-change-me-in-production";

export interface AccessTokenPayload {
  tenant_id: string;
  user_id: string;
  rol: string;
  sucursal_id: string | null;
}

export interface RefreshTokenPayload {
  tenant_id: string;
  user_id: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

export function signRefreshToken(userId: string, tenantId: string): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign({ user_id: userId, tenant_id: tenantId, jti }, secret, {
    expiresIn: "7d",
  });
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  return {
    tenant_id: payload.tenant_id as string,
    user_id: payload.user_id as string,
    rol: payload.rol as string,
    sucursal_id: (payload.sucursal_id as string | null | undefined) ?? null,
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  return {
    tenant_id: payload.tenant_id as string,
    user_id: payload.user_id as string,
    jti: payload.jti as string,
  };
}
