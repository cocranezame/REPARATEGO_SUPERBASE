import type { CreateCategoriaInput, UpdateCategoriaInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CategoriaResponse,
  CategoriasListResponse,
  CategoriasParams,
} from "../types/categoria";

function buildQueryString(params: CategoriasParams): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  if (params.padre_id !== undefined) q.set("padre_id", params.padre_id);
  if (params.incluir_hijos !== undefined) q.set("incluir_hijos", String(params.incluir_hijos));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useCategorias(params: CategoriasParams = {}) {
  return useQuery<CategoriasListResponse>({
    queryKey: ["categorias", params],
    queryFn: () => apiClient.get<CategoriasListResponse>(`/categorias${buildQueryString(params)}`),
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  return useMutation<CategoriaResponse, Error, CreateCategoriaInput>({
    mutationFn: (body) => apiClient.post<CategoriaResponse>("/categorias", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation<CategoriaResponse, Error, { id: string } & UpdateCategoriaInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<CategoriaResponse>(`/categorias/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/categorias/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
  });
}
