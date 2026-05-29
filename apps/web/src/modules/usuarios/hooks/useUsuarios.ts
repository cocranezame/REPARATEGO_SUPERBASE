import type { CreateUsuarioInput, UpdateUsuarioInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { UsuarioResponse, UsuariosListResponse, UsuariosParams } from "../types/usuario";

export type SucursalOption = {
  id: string;
  nombre: string;
};

type SucursalesListResponse = {
  success: true;
  data: SucursalOption[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

function buildQueryString(params: UsuariosParams): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.rol !== undefined) q.set("rol", params.rol);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useUsuarios(params: UsuariosParams = {}) {
  return useQuery<UsuariosListResponse>({
    queryKey: ["usuarios", params],
    queryFn: () => apiClient.get<UsuariosListResponse>(`/usuarios${buildQueryString(params)}`),
  });
}

export function useUsuario(id: string) {
  return useQuery<UsuarioResponse>({
    queryKey: ["usuarios", id],
    queryFn: () => apiClient.get<UsuarioResponse>(`/usuarios/${id}`),
    enabled: id !== "",
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation<UsuarioResponse, Error, CreateUsuarioInput>({
    mutationFn: (body) => apiClient.post<UsuarioResponse>("/usuarios", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation<UsuarioResponse, Error, { id: string } & UpdateUsuarioInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<UsuarioResponse>(`/usuarios/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/usuarios/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useSucursalesOptions() {
  return useQuery<SucursalesListResponse>({
    queryKey: ["sucursales", "options"],
    queryFn: () => apiClient.get<SucursalesListResponse>("/sucursales?page=1&pageSize=100"),
    staleTime: 10 * 60 * 1000,
  });
}
