import type { CreateModeloInput, UpdateModeloInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { ModeloResponse, ModelosListResponse, ModelosParams } from "../types/modelo";

function buildQueryString(params: Omit<ModelosParams, "enabled">): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  if (params.marca_id !== undefined) q.set("marca_id", params.marca_id);
  if (params.categoria_id !== undefined) q.set("categoria_id", params.categoria_id);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useModelos(params: ModelosParams = {}) {
  const { enabled = true, ...rest } = params;
  return useQuery<ModelosListResponse>({
    queryKey: ["modelos", rest],
    queryFn: () => apiClient.get<ModelosListResponse>(`/modelos${buildQueryString(rest)}`),
    enabled,
  });
}

export function useCreateModelo() {
  const queryClient = useQueryClient();
  return useMutation<ModeloResponse, Error, CreateModeloInput>({
    mutationFn: (body) => apiClient.post<ModeloResponse>("/modelos", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["modelos"] });
    },
  });
}

export function useUpdateModelo() {
  const queryClient = useQueryClient();
  return useMutation<ModeloResponse, Error, { id: string } & UpdateModeloInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<ModeloResponse>(`/modelos/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["modelos"] });
    },
  });
}

export function useDeleteModelo() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/modelos/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["modelos"] });
    },
  });
}
