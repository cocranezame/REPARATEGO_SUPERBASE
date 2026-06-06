import type {
  CalcularPlanillaInput,
  CalcularPlanillaTodosInput,
  CreatePermisoAsistenciaInput,
  CreatePuntoControlWifiInput,
  CreateTrabajadorConfigInput,
  CreateTurnoTrabajoInput,
  PagarPlanillaInput,
  RechazarPermisoInput,
  RegistroManualAsistenciaInput,
  UpdatePuntoControlWifiInput,
  UpdateTrabajadorConfigInput,
  UpdateTurnoTrabajoInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import { useAuthStore } from "../../../shared/stores/auth-store";
import type {
  AsistenciaHoyParams,
  AsistenciaHoyResponse,
  CalcularTodosResponse,
  PermisoDto,
  PermisoListResponse,
  PermisoResponse,
  PlanillaDetalleResponse,
  PlanillaDto,
  PlanillaListResponse,
  PlanillaResponse,
  PuntoControlDto,
  PuntoControlListResponse,
  PuntoControlResponse,
  TrabajadorConfigDto,
  TrabajadorConfigListResponse,
  TrabajadorConfigResponse,
  TurnoDto,
  TurnoListResponse,
  TurnoResponse,
} from "../types/asistencia";

// ─── Turnos ───────────────────────────────────────────────────────────────────

export function useTurnos() {
  return useQuery<TurnoListResponse>({
    queryKey: ["asistencia-turnos"],
    queryFn: () => apiClient.get<TurnoListResponse>("/asistencia/turnos"),
  });
}

export function useCreateTurno() {
  const qc = useQueryClient();
  return useMutation<TurnoResponse, Error, CreateTurnoTrabajoInput>({
    mutationFn: (body) => apiClient.post<TurnoResponse>("/asistencia/turnos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-turnos"] });
    },
  });
}

export function useUpdateTurno() {
  const qc = useQueryClient();
  return useMutation<TurnoResponse, Error, { id: string } & UpdateTurnoTrabajoInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<TurnoResponse>(`/asistencia/turnos/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-turnos"] });
    },
  });
}

export function useDeleteTurno() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/asistencia/turnos/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-turnos"] });
    },
  });
}

// Re-export types for pages
export type { TurnoDto };

// ─── Puntos de Control ────────────────────────────────────────────────────────

export function usePuntosControl() {
  return useQuery<PuntoControlListResponse>({
    queryKey: ["asistencia-puntos-control"],
    queryFn: () => apiClient.get<PuntoControlListResponse>("/asistencia/puntos-control"),
  });
}

export function useCreatePuntoControl() {
  const qc = useQueryClient();
  return useMutation<PuntoControlResponse, Error, CreatePuntoControlWifiInput>({
    mutationFn: (body) => apiClient.post<PuntoControlResponse>("/asistencia/puntos-control", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-puntos-control"] });
    },
  });
}

export function useUpdatePuntoControl() {
  const qc = useQueryClient();
  return useMutation<PuntoControlResponse, Error, { id: string } & UpdatePuntoControlWifiInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<PuntoControlResponse>(`/asistencia/puntos-control/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-puntos-control"] });
    },
  });
}

export function useDeletePuntoControl() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ success: true; data: null }>(`/asistencia/puntos-control/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-puntos-control"] });
    },
  });
}

export type { PuntoControlDto };

// ─── Trabajadores Config ──────────────────────────────────────────────────────

export function useTrabajadores() {
  return useQuery<TrabajadorConfigListResponse>({
    queryKey: ["asistencia-trabajadores"],
    queryFn: () => apiClient.get<TrabajadorConfigListResponse>("/asistencia/trabajadores"),
  });
}

export function useCreateTrabajador() {
  const qc = useQueryClient();
  return useMutation<TrabajadorConfigResponse, Error, CreateTrabajadorConfigInput>({
    mutationFn: (body) =>
      apiClient.post<TrabajadorConfigResponse>("/asistencia/trabajadores", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-trabajadores"] });
    },
  });
}

export function useUpdateTrabajador() {
  const qc = useQueryClient();
  return useMutation<TrabajadorConfigResponse, Error, { id: string } & UpdateTrabajadorConfigInput>(
    {
      mutationFn: ({ id, ...body }) =>
        apiClient.put<TrabajadorConfigResponse>(`/asistencia/trabajadores/${id}`, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ["asistencia-trabajadores"] });
      },
    }
  );
}

export function useDeleteTrabajador() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ success: true; data: null }>(`/asistencia/trabajadores/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-trabajadores"] });
    },
  });
}

export type { TrabajadorConfigDto };

// ─── Panel Hoy ────────────────────────────────────────────────────────────────

export function useAsistenciaHoy(params: AsistenciaHoyParams = {}) {
  const qs = new URLSearchParams();
  if (params.turno_id) qs.set("turno_id", params.turno_id);
  if (params.sucursal_id) qs.set("sucursal_id", params.sucursal_id);
  const qstring = qs.size > 0 ? `?${qs.toString()}` : "";

  return useQuery<AsistenciaHoyResponse>({
    queryKey: ["asistencia-hoy", params],
    queryFn: () => apiClient.get<AsistenciaHoyResponse>(`/asistencia/hoy${qstring}`),
    refetchInterval: 60_000,
  });
}

export function useRegistroManual() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: { id: string } }, Error, RegistroManualAsistenciaInput>(
    {
      mutationFn: (body) =>
        apiClient.post<{ success: true; data: { id: string } }>(
          "/asistencia/registro-manual",
          body
        ),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ["asistencia-hoy"] });
      },
    }
  );
}

// ─── Planilla ─────────────────────────────────────────────────────────────────

export function usePlanillaPeriodo(periodo: string) {
  return useQuery<PlanillaListResponse>({
    queryKey: ["asistencia-planilla", periodo],
    queryFn: () => apiClient.get<PlanillaListResponse>(`/asistencia/planilla/${periodo}`),
    enabled: periodo !== "",
  });
}

export function usePlanillaDetalle(id: string) {
  return useQuery<PlanillaDetalleResponse>({
    queryKey: ["asistencia-planilla-detalle", id],
    queryFn: () => apiClient.get<PlanillaDetalleResponse>(`/asistencia/planilla/detalle/${id}`),
    enabled: id !== "",
  });
}

export function useCalcularPlanilla() {
  const qc = useQueryClient();
  return useMutation<PlanillaResponse, Error, CalcularPlanillaInput>({
    mutationFn: (body) => apiClient.post<PlanillaResponse>("/asistencia/planilla/calcular", body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla", vars.periodo] });
    },
  });
}

export function useCalcularTodos() {
  const qc = useQueryClient();
  return useMutation<CalcularTodosResponse, Error, CalcularPlanillaTodosInput>({
    mutationFn: (body) =>
      apiClient.post<CalcularTodosResponse>("/asistencia/planilla/calcular-todos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla"] });
    },
  });
}

export function useAprobarPlanilla() {
  const qc = useQueryClient();
  return useMutation<PlanillaResponse, Error, string>({
    mutationFn: (id) => apiClient.put<PlanillaResponse>(`/asistencia/planilla/${id}/aprobar`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla"] });
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla-detalle"] });
    },
  });
}

export function usePagarPlanilla() {
  const qc = useQueryClient();
  return useMutation<PlanillaResponse, Error, { id: string } & PagarPlanillaInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<PlanillaResponse>(`/asistencia/planilla/${id}/pagar`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla"] });
      void qc.invalidateQueries({ queryKey: ["asistencia-planilla-detalle"] });
    },
  });
}

export type { PlanillaDto };

// ─── Permisos ─────────────────────────────────────────────────────────────────

type PermisosParams = {
  usuario_id?: string;
  estado?: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  tipo_permiso?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
};

export function usePermisos(params: PermisosParams = {}) {
  const qs = new URLSearchParams();
  if (params.usuario_id) qs.set("usuario_id", params.usuario_id);
  if (params.estado) qs.set("estado", params.estado);
  if (params.tipo_permiso) qs.set("tipo_permiso", params.tipo_permiso);
  if (params.fecha_desde) qs.set("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) qs.set("fecha_hasta", params.fecha_hasta);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", "20");

  return useQuery<PermisoListResponse>({
    queryKey: ["asistencia-permisos", params],
    queryFn: () => apiClient.get<PermisoListResponse>(`/asistencia/permisos?${qs.toString()}`),
  });
}

export function useCreatePermiso() {
  const qc = useQueryClient();
  return useMutation<PermisoResponse, Error, CreatePermisoAsistenciaInput>({
    mutationFn: (body) => apiClient.post<PermisoResponse>("/asistencia/permisos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-permisos"] });
    },
  });
}

export function useAprobarPermiso() {
  const qc = useQueryClient();
  return useMutation<PermisoResponse, Error, string>({
    mutationFn: (id) => apiClient.put<PermisoResponse>(`/asistencia/permisos/${id}/aprobar`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-permisos"] });
    },
  });
}

export function useRechazarPermiso() {
  const qc = useQueryClient();
  return useMutation<PermisoResponse, Error, { id: string } & RechazarPermisoInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<PermisoResponse>(`/asistencia/permisos/${id}/rechazar`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["asistencia-permisos"] });
    },
  });
}

export type { PermisoDto };

// ─── Reportes (descarga binaria) ──────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

async function downloadFile(url: string, filename: string) {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (TENANT_ID) headers["X-Tenant-Id"] = TENANT_ID;

  const res = await fetch(`${BASE_URL}${url}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function useReporteAsistencia() {
  return useMutation<void, Error, { periodo: string; formato: "xlsx" | "pdf" }>({
    mutationFn: ({ periodo, formato }) =>
      downloadFile(
        `/asistencia/reportes/asistencia?periodo=${periodo}&formato=${formato}`,
        `asistencia-${periodo}.${formato}`
      ),
  });
}

export function useReportePlanilla() {
  return useMutation<void, Error, { periodo: string; formato: "xlsx" | "pdf" }>({
    mutationFn: ({ periodo, formato }) =>
      downloadFile(
        `/asistencia/reportes/planilla?periodo=${periodo}&formato=${formato}`,
        `planilla-${periodo}.${formato}`
      ),
  });
}
