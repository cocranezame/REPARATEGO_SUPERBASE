import type { CreateComponenteInput, UpdateComponenteInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  ComponenteResponse,
  ComponentesListResponse,
  ComponentesParams,
} from "../types/componente";

function buildQueryString(params: ComponentesParams): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  if (params.categoria_id !== undefined) q.set("categoria_id", params.categoria_id);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useComponentes(params: ComponentesParams = {}) {
  return useQuery<ComponentesListResponse>({
    queryKey: ["componentes", params],
    queryFn: () =>
      apiClient.get<ComponentesListResponse>(`/componentes${buildQueryString(params)}`),
  });
}

export function useCreateComponente() {
  const queryClient = useQueryClient();
  return useMutation<ComponenteResponse, Error, CreateComponenteInput>({
    mutationFn: (body) => apiClient.post<ComponenteResponse>("/componentes", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
  });
}

export function useUpdateComponente() {
  const queryClient = useQueryClient();
  return useMutation<ComponenteResponse, Error, { id: string } & UpdateComponenteInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<ComponenteResponse>(`/componentes/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
  });
}

export function useDeleteComponente() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/componentes/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
  });
}
