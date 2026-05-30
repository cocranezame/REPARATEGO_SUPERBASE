import type {
  AddComponentesOrdenServicioInput,
  AddCotizacionOrdenServicioInput,
  AddEvidenciaInput,
  AprobarCotizacionInput,
  CreateOrdenServicioInput,
  UpdateEstadoOrdenServicioInput,
  UpdateOrdenServicioInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CotizacionResponse,
  OrdenesServicioListResponse,
  OrdenesServicioParams,
  OrdenServicioComponenteDto,
  OrdenServicioEvidenciaDto,
  OrdenServicioResponse,
} from "../types/orden-servicio";

function buildQS(params: OrdenesServicioParams): string {
  const q = new URLSearchParams();
  if (params.estado) q.set("estado", params.estado);
  if (params.tecnico_id) q.set("tecnico_id", params.tecnico_id);
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  if (params.search) q.set("search", params.search);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useOrdenesServicio(params: OrdenesServicioParams = {}) {
  return useQuery<OrdenesServicioListResponse>({
    queryKey: ["ordenes-servicio", params],
    queryFn: () =>
      apiClient.get<OrdenesServicioListResponse>(`/ordenes-servicio${buildQS(params)}`),
  });
}

export function useOrdenServicio(id: string) {
  return useQuery<OrdenServicioResponse>({
    queryKey: ["ordenes-servicio", id],
    queryFn: () => apiClient.get<OrdenServicioResponse>(`/ordenes-servicio/${id}`),
    enabled: id !== "",
  });
}

export function useCreateOrdenServicio() {
  const queryClient = useQueryClient();
  return useMutation<OrdenServicioResponse, Error, CreateOrdenServicioInput>({
    mutationFn: (body) => apiClient.post<OrdenServicioResponse>("/ordenes-servicio", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio"] });
    },
  });
}

export function useUpdateOrdenServicio() {
  const queryClient = useQueryClient();
  return useMutation<OrdenServicioResponse, Error, { id: string } & UpdateOrdenServicioInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<OrdenServicioResponse>(`/ordenes-servicio/${id}`, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio", vars.id] });
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio"] });
    },
  });
}

export function useUpdateEstadoOrdenServicio() {
  const queryClient = useQueryClient();
  return useMutation<OrdenServicioResponse, Error, { id: string } & UpdateEstadoOrdenServicioInput>(
    {
      mutationFn: ({ id, ...body }) =>
        apiClient.put<OrdenServicioResponse>(`/ordenes-servicio/${id}/estado`, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio"] });
      },
    }
  );
}

export function useOrdenServicioComponentes(id: string) {
  return useQuery<{ success: boolean; data: OrdenServicioComponenteDto[] }>({
    queryKey: ["ordenes-servicio", id, "componentes"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: OrdenServicioComponenteDto[] }>(
        `/ordenes-servicio/${id}/componentes`
      ),
    enabled: id !== "",
  });
}

export function useAddComponentes() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: OrdenServicioComponenteDto[] },
    Error,
    { id: string } & AddComponentesOrdenServicioInput
  >({
    mutationFn: ({ id, ...body }) =>
      apiClient.post<{ success: boolean; data: OrdenServicioComponenteDto[] }>(
        `/ordenes-servicio/${id}/componentes`,
        body
      ),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["ordenes-servicio", vars.id, "componentes"],
      });
    },
  });
}

export function useOrdenServicioCotizacion(id: string) {
  return useQuery<CotizacionResponse>({
    queryKey: ["ordenes-servicio", id, "cotizacion"],
    queryFn: () => apiClient.get<CotizacionResponse>(`/ordenes-servicio/${id}/cotizacion`),
    enabled: id !== "",
  });
}

export function useAddCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<CotizacionResponse, Error, { id: string } & AddCotizacionOrdenServicioInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.post<CotizacionResponse>(`/ordenes-servicio/${id}/cotizacion`, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio", vars.id] });
      void queryClient.invalidateQueries({
        queryKey: ["ordenes-servicio", vars.id, "cotizacion"],
      });
    },
  });
}

export function useAprobarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<OrdenServicioResponse, Error, { id: string } & AprobarCotizacionInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<OrdenServicioResponse>(`/ordenes-servicio/${id}/cotizacion/aprobar`, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-servicio", vars.id] });
      void queryClient.invalidateQueries({
        queryKey: ["ordenes-servicio", vars.id, "cotizacion"],
      });
    },
  });
}

export function useOrdenServicioEvidencias(id: string) {
  return useQuery<{ success: boolean; data: OrdenServicioEvidenciaDto[] }>({
    queryKey: ["ordenes-servicio", id, "evidencias"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: OrdenServicioEvidenciaDto[] }>(
        `/ordenes-servicio/${id}/evidencias`
      ),
    enabled: id !== "",
  });
}

export function useAddEvidencia() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: OrdenServicioEvidenciaDto },
    Error,
    { id: string } & AddEvidenciaInput
  >({
    mutationFn: ({ id, ...body }) =>
      apiClient.post<{ success: boolean; data: OrdenServicioEvidenciaDto }>(
        `/ordenes-servicio/${id}/evidencias`,
        body
      ),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["ordenes-servicio", vars.id, "evidencias"],
      });
    },
  });
}

export function useDeleteEvidencia() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: null },
    Error,
    { osId: string; evidenciaId: string }
  >({
    mutationFn: ({ osId, evidenciaId }) =>
      apiClient.delete<{ success: boolean; data: null }>(
        `/ordenes-servicio/${osId}/evidencias/${evidenciaId}`
      ),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["ordenes-servicio", vars.osId, "evidencias"],
      });
    },
  });
}
