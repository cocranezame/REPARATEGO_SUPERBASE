import type {
  ConfirmarOrdenCompraInput,
  GenerarOrdenCompraInput,
  UpdateEstadoOrdenCompraInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { OrdenesListResponse, OrdenesParams, OrdenResponse } from "../types/orden";

function buildQS(params: OrdenesParams): string {
  const q = new URLSearchParams();
  if (params.estado) q.set("estado", params.estado);
  if (params.proveedor_id) q.set("proveedor_id", params.proveedor_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 100));
  return `?${q.toString()}`;
}

export function useOrdenes(params: OrdenesParams = {}) {
  return useQuery<OrdenesListResponse>({
    queryKey: ["ordenes-compra", params],
    queryFn: () => apiClient.get<OrdenesListResponse>(`/ordenes-compra${buildQS(params)}`),
  });
}

export function useOrden(id: string) {
  return useQuery<OrdenResponse>({
    queryKey: ["ordenes-compra", id],
    queryFn: () => apiClient.get<OrdenResponse>(`/ordenes-compra/${id}`),
    enabled: id !== "",
  });
}

export function useGenerarOrden() {
  const queryClient = useQueryClient();
  return useMutation<OrdenResponse, Error, GenerarOrdenCompraInput>({
    mutationFn: (body) => apiClient.post<OrdenResponse>("/ordenes-compra/generar", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-compra"] });
      void queryClient.invalidateQueries({ queryKey: ["solicitudes-compra"] });
    },
  });
}

export function useUpdateEstadoOrden() {
  const queryClient = useQueryClient();
  return useMutation<OrdenResponse, Error, { id: string } & UpdateEstadoOrdenCompraInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<OrdenResponse>(`/ordenes-compra/${id}/estado`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-compra"] });
    },
  });
}

export function useConfirmarOrden() {
  const queryClient = useQueryClient();
  return useMutation<OrdenResponse, Error, { id: string } & ConfirmarOrdenCompraInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.post<OrdenResponse>(`/ordenes-compra/${id}/confirmar`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordenes-compra"] });
      void queryClient.invalidateQueries({ queryKey: ["solicitudes-compra"] });
    },
  });
}
