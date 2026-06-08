import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { ProductosListResponse } from "../types/inventario";

export type ProductosParams = {
  categoria_id?: string;
  marca_id?: string;
  tipo?: string;
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

function buildQueryString(params: Omit<ProductosParams, "enabled">): string {
  const q = new URLSearchParams();
  if (params.categoria_id) q.set("categoria_id", params.categoria_id);
  if (params.marca_id) q.set("marca_id", params.marca_id);
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.search) q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useProductos(params: ProductosParams = {}) {
  const { enabled = true, ...rest } = params;
  return useQuery<ProductosListResponse>({
    queryKey: ["productos", rest],
    queryFn: () => apiClient.get<ProductosListResponse>(`/productos${buildQueryString(rest)}`),
    enabled,
  });
}
