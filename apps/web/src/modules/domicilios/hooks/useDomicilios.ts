import type {
  CreateTarifaDistritoInput,
  CreateVisitaDomicilioInput,
  GenerarOsFromVisitaInput,
  UpdateEstadoVisitaInput,
  UpdateTarifaDistritoInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  DisponibilidadResponse,
  TarifaDistritoResponse,
  TarifasDistritoListResponse,
  TarifasDistritoParams,
  VisitaDomicilioResponse,
  VisitasDomicilioListResponse,
  VisitasDomicilioParams,
} from "../types/domicilios";

function buildVisitasQS(params: VisitasDomicilioParams): string {
  const q = new URLSearchParams();
  if (params.estado) q.set("estado", params.estado);
  if (params.tecnico_id) q.set("tecnico_id", params.tecnico_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

function buildTarifasQS(params: TarifasDistritoParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  return `?${q.toString()}`;
}

// ─── Tarifas ──────────────────────────────────────────────────────────────────

export function useTarifasDistrito(params: TarifasDistritoParams = {}) {
  return useQuery<TarifasDistritoListResponse>({
    queryKey: ["tarifas-distrito", params],
    queryFn: () =>
      apiClient.get<TarifasDistritoListResponse>(`/tarifas-distrito${buildTarifasQS(params)}`),
  });
}

export function useCreateTarifaDistrito() {
  const queryClient = useQueryClient();
  return useMutation<TarifaDistritoResponse, Error, CreateTarifaDistritoInput>({
    mutationFn: (body) => apiClient.post<TarifaDistritoResponse>("/tarifas-distrito", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tarifas-distrito"] });
    },
  });
}

export function useUpdateTarifaDistrito() {
  const queryClient = useQueryClient();
  return useMutation<TarifaDistritoResponse, Error, { id: string } & UpdateTarifaDistritoInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<TarifaDistritoResponse>(`/tarifas-distrito/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tarifas-distrito"] });
    },
  });
}

export function useDeleteTarifaDistrito() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; data: null }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ success: boolean; data: null }>(`/tarifas-distrito/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tarifas-distrito"] });
    },
  });
}

// ─── Visitas ──────────────────────────────────────────────────────────────────

export function useVisitasDomicilio(params: VisitasDomicilioParams = {}) {
  return useQuery<VisitasDomicilioListResponse>({
    queryKey: ["visitas-domicilio", params],
    queryFn: () =>
      apiClient.get<VisitasDomicilioListResponse>(`/visitas-domicilio${buildVisitasQS(params)}`),
  });
}

export function useVisitaDomicilio(id: string) {
  return useQuery<VisitaDomicilioResponse>({
    queryKey: ["visitas-domicilio", id],
    queryFn: () => apiClient.get<VisitaDomicilioResponse>(`/visitas-domicilio/${id}`),
    enabled: id !== "",
  });
}

export function useCreateVisitaDomicilio() {
  const queryClient = useQueryClient();
  return useMutation<VisitaDomicilioResponse, Error, CreateVisitaDomicilioInput>({
    mutationFn: (body) => apiClient.post<VisitaDomicilioResponse>("/visitas-domicilio", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["visitas-domicilio"] });
    },
  });
}

export function useUpdateEstadoVisita() {
  const queryClient = useQueryClient();
  return useMutation<VisitaDomicilioResponse, Error, { id: string } & UpdateEstadoVisitaInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<VisitaDomicilioResponse>(`/visitas-domicilio/${id}/estado`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["visitas-domicilio"] });
    },
  });
}

export function useGenerarOsFromVisita() {
  const queryClient = useQueryClient();
  return useMutation<VisitaDomicilioResponse, Error, { id: string } & GenerarOsFromVisitaInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.post<VisitaDomicilioResponse>(`/visitas-domicilio/${id}/generar-os`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["visitas-domicilio"] });
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio"] });
    },
  });
}

// ─── Disponibilidad técnicos ──────────────────────────────────────────────────

export function useDisponibilidadTecnicos(fecha: string, tecnicoId?: string) {
  const q = new URLSearchParams({ fecha });
  if (tecnicoId) q.set("tecnico_id", tecnicoId);
  return useQuery<DisponibilidadResponse>({
    queryKey: ["tecnicos-disponibilidad", fecha, tecnicoId],
    queryFn: () =>
      apiClient.get<DisponibilidadResponse>(`/tecnicos/disponibilidad?${q.toString()}`),
    enabled: fecha !== "",
  });
}
