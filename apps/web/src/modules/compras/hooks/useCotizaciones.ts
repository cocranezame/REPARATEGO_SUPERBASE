import type { CotizarCotizacionInput, CreateCotizacionCompraInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CotizacionesListResponse,
  CotizacionesParams,
  CotizacionResponse,
} from "../types/cotizacion";

function buildQS(params: CotizacionesParams): string {
  const q = new URLSearchParams();
  if (params.proveedor_id) q.set("proveedor_id", params.proveedor_id);
  if (params.estado) q.set("estado", params.estado);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useCotizaciones(params: CotizacionesParams = {}) {
  return useQuery<CotizacionesListResponse>({
    queryKey: ["cotizaciones-compra", params],
    queryFn: () =>
      apiClient.get<CotizacionesListResponse>(`/cotizaciones-compra${buildQS(params)}`),
  });
}

export function useCotizacion(id: string) {
  return useQuery<CotizacionResponse>({
    queryKey: ["cotizaciones-compra", id],
    queryFn: () => apiClient.get<CotizacionResponse>(`/cotizaciones-compra/${id}`),
    enabled: id !== "",
  });
}

export function useCreateCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<CotizacionResponse, Error, CreateCotizacionCompraInput>({
    mutationFn: (body) => apiClient.post<CotizacionResponse>("/cotizaciones-compra", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cotizaciones-compra"] });
    },
  });
}

export function useCotizarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<CotizacionResponse, Error, { id: string } & CotizarCotizacionInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<CotizacionResponse>(`/cotizaciones-compra/${id}/cotizar`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cotizaciones-compra"] });
    },
  });
}
