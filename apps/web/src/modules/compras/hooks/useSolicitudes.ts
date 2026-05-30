import type {
  CreateSolicitudCompraInput,
  UpdateSolicitudCompraInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  SolicitudesListResponse,
  SolicitudesParams,
  SolicitudResponse,
  StockBajoResponse,
} from "../types/solicitud";

function buildQS(params: SolicitudesParams): string {
  const q = new URLSearchParams();
  if (params.estado) q.set("estado", params.estado);
  if (params.prioridad) q.set("prioridad", params.prioridad);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useSolicitudes(params: SolicitudesParams = {}) {
  return useQuery<SolicitudesListResponse>({
    queryKey: ["solicitudes-compra", params],
    queryFn: () => apiClient.get<SolicitudesListResponse>(`/solicitudes-compra${buildQS(params)}`),
  });
}

export function useStockBajo() {
  return useQuery<StockBajoResponse>({
    queryKey: ["solicitudes-compra", "stock-bajo"],
    queryFn: () => apiClient.get<StockBajoResponse>("/solicitudes-compra/stock-bajo"),
  });
}

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  return useMutation<SolicitudResponse, Error, CreateSolicitudCompraInput>({
    mutationFn: (body) => apiClient.post<SolicitudResponse>("/solicitudes-compra", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["solicitudes-compra"] });
    },
  });
}

export function useUpdateSolicitud() {
  const queryClient = useQueryClient();
  return useMutation<SolicitudResponse, Error, { id: string } & UpdateSolicitudCompraInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<SolicitudResponse>(`/solicitudes-compra/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["solicitudes-compra"] });
    },
  });
}

export function useDeleteSolicitud() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`/solicitudes-compra/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["solicitudes-compra"] });
    },
  });
}
