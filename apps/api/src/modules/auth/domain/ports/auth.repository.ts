import type { UserForAuth, UserForRefresh } from "../entities/auth.js";

export interface IAuthRepository {
  findUserForAuth(tenantId: string, numeroDocumento: string): Promise<UserForAuth | null>;
  findUserForRefresh(tenantId: string, userId: string): Promise<UserForRefresh | null>;
  updateUltimoLogin(tenantId: string, userId: string): Promise<void>;
}
