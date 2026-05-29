import type { CreateSucursalInput, UpdateSucursalInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { SucursalesListResponse, SucursalesParams, SucursalResponse } from "../types/sucursal";

function buildQueryString(params: SucursalesParams): string {
  const q = new URLSearchParams();
  if (params.search !== undefined && params.search !== "") q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useSucursales(params: SucursalesParams = {}) {
  return useQuery<SucursalesListResponse>({
    queryKey: ["sucursales", params],
    queryFn: () => apiClient.get<SucursalesListResponse>(`/sucursales${buildQueryString(params)}`),
  });
}

export function useSucursal(id: string) {
  return useQuery<SucursalResponse>({
    queryKey: ["sucursales", id],
    queryFn: () => apiClient.get<SucursalResponse>(`/sucursales/${id}`),
    enabled: id !== "",
  });
}

export function useCreateSucursal() {
  const queryClient = useQueryClient();
  return useMutation<SucursalResponse, Error, CreateSucursalInput>({
    mutationFn: (body) => apiClient.post<SucursalResponse>("/sucursales", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    },
  });
}

export function useUpdateSucursal() {
  const queryClient = useQueryClient();
  return useMutation<SucursalResponse, Error, { id: string } & UpdateSucursalInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<SucursalResponse>(`/sucursales/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    },
  });
}

export function useDeleteSucursal() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/sucursales/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    },
  });
}
