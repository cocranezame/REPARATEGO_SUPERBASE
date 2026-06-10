import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { ProductoDto, ProductosListResponse } from "../types/inventario";

export type ProductosParams = {
  categoria_id?: string;
  componente_id?: string;
  marca_id?: string;
  modelo_id?: string;
  tipo?: string;
  search?: string;
  activo?: boolean;
  con_imagen?: boolean;
  sin_cotizacion?: boolean;
  sin_tasa?: boolean;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

function buildQueryString(params: Omit<ProductosParams, "enabled">): string {
  const q = new URLSearchParams();
  if (params.categoria_id) q.set("categoria_id", params.categoria_id);
  if (params.componente_id) q.set("componente_id", params.componente_id);
  if (params.marca_id) q.set("marca_id", params.marca_id);
  if (params.modelo_id) q.set("modelo_id", params.modelo_id);
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.search) q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  if (params.con_imagen !== undefined) q.set("con_imagen", String(params.con_imagen));
  if (params.sin_cotizacion !== undefined) q.set("sin_cotizacion", String(params.sin_cotizacion));
  if (params.sin_tasa !== undefined) q.set("sin_tasa", String(params.sin_tasa));
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

export type CreateProductoBody = {
  tipo: "PRODUCTO" | "SERVICIO";
  nombre: string;
  categoria_id?: string;
  marca_id?: string;
  modelo_id?: string;
  alcance?: "GLOBAL" | "CATEGORIA" | "MARCA" | "COMPATIBILIDAD";
};

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: ProductoDto }, Error, CreateProductoBody>({
    mutationFn: (body) => apiClient.post<{ success: true; data: ProductoDto }>("/productos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}
