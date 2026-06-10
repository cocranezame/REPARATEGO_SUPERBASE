import type {
  CreateCotizacionCompraInput,
  UpdateCotizacionCompraInput,
} from "@kallpasoft/validators";
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
  if (params.producto_id) q.set("producto_id", params.producto_id);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
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
  const qc = useQueryClient();
  return useMutation<CotizacionResponse, Error, CreateCotizacionCompraInput>({
    mutationFn: (body) => apiClient.post<CotizacionResponse>("/cotizaciones-compra", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cotizaciones-compra"] });
    },
  });
}

export function useUpdateCotizacion() {
  const qc = useQueryClient();
  return useMutation<CotizacionResponse, Error, { id: string } & UpdateCotizacionCompraInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<CotizacionResponse>(`/cotizaciones-compra/${id}`, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["cotizaciones-compra"] });
      void qc.invalidateQueries({ queryKey: ["cotizaciones-compra", vars.id] });
    },
  });
}

export function useDeleteCotizacion() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ success: true; data: null }>(`/cotizaciones-compra/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cotizaciones-compra"] });
    },
  });
}
