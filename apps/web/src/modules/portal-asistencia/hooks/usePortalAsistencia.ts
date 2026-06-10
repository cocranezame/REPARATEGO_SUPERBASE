import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePortalAsistenciaAuthStore } from "../../../shared/stores/portal-asistencia-auth-store";
import {
  type MarcadoResultDto,
  type MarcarPayload,
  type PortalAsistenciaLoginResponse,
  portalAsistenciaApi,
} from "../lib/portal-asistencia-api";

const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function usePortalAsistenciaAuth() {
  const user = usePortalAsistenciaAuthStore((s) => s.user);
  const isAuthenticated = usePortalAsistenciaAuthStore((s) => s.isAuthenticated);
  const loginStore = usePortalAsistenciaAuthStore((s) => s.login);
  const logoutStore = usePortalAsistenciaAuthStore((s) => s.logout);

  const loginMutation = useMutation<
    PortalAsistenciaLoginResponse,
    Error,
    { numero_doc: string; password: string }
  >({
    mutationFn: ({ numero_doc, password }) => portalAsistenciaApi.login(numero_doc, password),
    onSuccess: (res) => {
      loginStore({
        usuarioId: res.data.usuario_id,
        nombre: res.data.nombre,
        tenantId: TENANT_ID,
        token: res.data.token,
      });
    },
  });

  return { user, isAuthenticated, loginMutation, logout: logoutStore };
}

// ─── Estado ───────────────────────────────────────────────────────────────────

export function usePortalEstado() {
  return useQuery({
    queryKey: ["portal-asistencia-estado"],
    queryFn: () => portalAsistenciaApi.getEstado().then((r) => r.data),
    refetchInterval: 60_000,
  });
}

// ─── Marcar ───────────────────────────────────────────────────────────────────

export function usePortalMarcar() {
  const qc = useQueryClient();
  return useMutation<MarcadoResultDto, Error, MarcarPayload>({
    mutationFn: (payload) => portalAsistenciaApi.marcar(payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal-asistencia-estado"] });
    },
  });
}

// ─── Historial ────────────────────────────────────────────────────────────────

export function usePortalHistorial(mes: string) {
  return useQuery({
    queryKey: ["portal-asistencia-historial", mes],
    queryFn: () => portalAsistenciaApi.getHistorial(mes).then((r) => r.data),
    enabled: mes !== "",
  });
}

// ─── Planilla ─────────────────────────────────────────────────────────────────

export function usePortalPlanilla(periodo: string) {
  return useQuery({
    queryKey: ["portal-asistencia-planilla", periodo],
    queryFn: () => portalAsistenciaApi.getPlanilla(periodo).then((r) => r.data),
    enabled: periodo !== "",
  });
}
