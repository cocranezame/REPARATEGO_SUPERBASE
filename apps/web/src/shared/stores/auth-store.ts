import type { RolUsuario } from "@kallpasoft/shared";
import { create } from "zustand";

type AuthUser = {
  id: string;
  tenantId: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
};

type AuthStore = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ isAuthenticated: true, token, user }),
  clearAuth: () => set({ isAuthenticated: false, token: null, user: null }),
}));
