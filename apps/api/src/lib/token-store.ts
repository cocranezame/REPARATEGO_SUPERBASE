// In-memory refresh token store. Cleared on server restart (acceptable for MVP).
// Replace with Redis or DB table in production for persistence across restarts.
const validJtis = new Set<string>();

export function addRefreshToken(jti: string): void {
  validJtis.add(jti);
}

export function revokeRefreshToken(jti: string): void {
  validJtis.delete(jti);
}

export function isRefreshTokenValid(jti: string): boolean {
  return validJtis.has(jti);
}
