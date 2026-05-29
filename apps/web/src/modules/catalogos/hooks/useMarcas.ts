import type { CreateMarcaInput, UpdateMarcaInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { MarcaResponse, MarcasListResponse, MarcasParams } from "../types/marca";

function buildQueryString(params: MarcasParams): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useMarcas(params: MarcasParams = {}) {
  return useQuery<MarcasListResponse>({
    queryKey: ["marcas", params],
    queryFn: () => apiClient.get<MarcasListResponse>(`/marcas${buildQueryString(params)}`),
  });
}

export function useCreateMarca() {
  const queryClient = useQueryClient();
  return useMutation<MarcaResponse, Error, CreateMarcaInput>({
    mutationFn: (body) => apiClient.post<MarcaResponse>("/marcas", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marcas"] });
    },
  });
}

export function useUpdateMarca() {
  const queryClient = useQueryClient();
  return useMutation<MarcaResponse, Error, { id: string } & UpdateMarcaInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<MarcaResponse>(`/marcas/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marcas"] });
    },
  });
}

export function useDeleteMarca() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/marcas/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marcas"] });
    },
  });
}
