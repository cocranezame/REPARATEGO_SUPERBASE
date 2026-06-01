import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PortalAuthUser = {
  clienteId: string;
  clienteNombre: string;
  tenantId: string;
  token: string;
};

type PortalAuthState = {
  user: PortalAuthUser | null;
  isAuthenticated: boolean;
  login: (user: PortalAuthUser) => void;
  logout: () => void;
};

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: "reparatego-portal",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
