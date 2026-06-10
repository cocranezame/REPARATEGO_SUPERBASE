import type { CreateTipoRepuestoInput, UpdateTipoRepuestoInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  TipoRepuestoResponse,
  TiposRepuestoListResponse,
  TiposRepuestoParams,
} from "../types/tipo-repuesto";

function buildQueryString(params: TiposRepuestoParams): string {
  const q = new URLSearchParams();
  if (params.componente_id !== undefined) q.set("componente_id", params.componente_id);
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 100));
  return `?${q.toString()}`;
}

export function useTiposRepuesto(params: TiposRepuestoParams = {}) {
  return useQuery<TiposRepuestoListResponse>({
    queryKey: ["tipos-repuesto", params],
    queryFn: () =>
      apiClient.get<TiposRepuestoListResponse>(`/tipos-repuesto${buildQueryString(params)}`),
    enabled: params.componente_id !== undefined,
  });
}

export function useCreateTipoRepuesto() {
  const queryClient = useQueryClient();
  return useMutation<TipoRepuestoResponse, Error, CreateTipoRepuestoInput>({
    mutationFn: (body) => apiClient.post<TipoRepuestoResponse>("/tipos-repuesto", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tipos-repuesto"] });
    },
  });
}

export function useUpdateTipoRepuesto() {
  const queryClient = useQueryClient();
  return useMutation<TipoRepuestoResponse, Error, { id: string } & UpdateTipoRepuestoInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<TipoRepuestoResponse>(`/tipos-repuesto/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tipos-repuesto"] });
    },
  });
}

export function useDeleteTipoRepuesto() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/tipos-repuesto/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tipos-repuesto"] });
    },
  });
}
