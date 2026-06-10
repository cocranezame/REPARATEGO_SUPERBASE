import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PortalAsistenciaUser = {
  usuarioId: string;
  nombre: string;
  tenantId: string;
  token: string;
};

type PortalAsistenciaAuthState = {
  user: PortalAsistenciaUser | null;
  isAuthenticated: boolean;
  login: (user: PortalAsistenciaUser) => void;
  logout: () => void;
};

export const usePortalAsistenciaAuthStore = create<PortalAsistenciaAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: "reparatego-portal-asistencia",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
