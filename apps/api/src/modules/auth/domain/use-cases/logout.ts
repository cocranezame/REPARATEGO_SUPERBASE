import { verifyRefreshToken } from "../../../../lib/jwt.js";
import { revokeRefreshToken } from "../../../../lib/token-store.js";

export function logout(token: string): void {
  try {
    const payload = verifyRefreshToken(token);
    revokeRefreshToken(payload.jti);
  } catch {
    // Token already expired or invalid — treat as already logged out
  }
}
