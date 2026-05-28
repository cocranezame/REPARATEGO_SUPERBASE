import type { RolUsuario } from "@kallpasoft/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  tenantId: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
  sucursalId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (tokens, user) =>
        set({
          isAuthenticated: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),
      logout: () =>
        set({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    {
      name: "reparatego-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
