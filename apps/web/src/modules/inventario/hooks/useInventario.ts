import type {
  CreateMetodoPagoInput,
  CreateProductoInput,
  CreateTasaPrecioInput,
  SyncCompatibilidadesInput,
  UpdateMetodoPagoInput,
  UpdateProductoInput,
  UpdateTasaPrecioInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CompatibilidadesListResponse,
  MetodoPagoResponse,
  MetodosPagoListResponse,
  ProductoResponse,
  ProductosListResponse,
  ProductosParams,
  TasaPrecioResponse,
  TasasPrecioListResponse,
} from "../types/inventario";

function buildProductosQS(params: ProductosParams): string {
  const q = new URLSearchParams();
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.categoria_id) q.set("categoria_id", params.categoria_id);
  if (params.componente_id) q.set("componente_id", params.componente_id);
  if (params.marca_id) q.set("marca_id", params.marca_id);
  if (params.search) q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

// ─── Productos ────────────────────────────────────────────────────────────────

export function useProductos(params: ProductosParams = {}) {
  return useQuery<ProductosListResponse>({
    queryKey: ["productos", params],
    queryFn: () => apiClient.get<ProductosListResponse>(`/productos${buildProductosQS(params)}`),
  });
}

export function useProducto(id: string) {
  return useQuery<ProductoResponse>({
    queryKey: ["productos", id],
    queryFn: () => apiClient.get<ProductoResponse>(`/productos/${id}`),
    enabled: id !== "",
  });
}

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation<ProductoResponse, Error, CreateProductoInput>({
    mutationFn: (body) => apiClient.post<ProductoResponse>("/productos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  return useMutation<ProductoResponse, Error, { id: string } & UpdateProductoInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<ProductoResponse>(`/productos/${id}`, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["productos"] });
      void qc.invalidateQueries({ queryKey: ["productos", vars.id] });
    },
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/productos/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}

// ─── Compatibilidades ─────────────────────────────────────────────────────────

export function useCompatibilidades(productoId: string) {
  return useQuery<CompatibilidadesListResponse>({
    queryKey: ["productos", productoId, "compatibilidades"],
    queryFn: () =>
      apiClient.get<CompatibilidadesListResponse>(`/productos/${productoId}/compatibilidades`),
    enabled: productoId !== "",
  });
}

export function useSyncCompatibilidades() {
  const qc = useQueryClient();
  return useMutation<
    CompatibilidadesListResponse,
    Error,
    SyncCompatibilidadesInput & { productoId: string }
  >({
    mutationFn: ({ productoId, modelo_ids }) =>
      apiClient.post<CompatibilidadesListResponse>(`/productos/${productoId}/compatibilidades`, {
        modelo_ids,
      }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["productos", vars.productoId, "compatibilidades"],
      });
      void qc.invalidateQueries({ queryKey: ["productos", vars.productoId] });
    },
  });
}

// ─── Tasas de precio ──────────────────────────────────────────────────────────

export function useTasasPrecio(activo?: boolean) {
  return useQuery<TasasPrecioListResponse>({
    queryKey: ["tasas-precio", { activo }],
    queryFn: () => {
      const q = activo !== undefined ? `?activo=${activo}` : "";
      return apiClient.get<TasasPrecioListResponse>(`/tasas-precio${q}`);
    },
  });
}

export function useCreateTasaPrecio() {
  const qc = useQueryClient();
  return useMutation<TasaPrecioResponse, Error, CreateTasaPrecioInput>({
    mutationFn: (body) => apiClient.post<TasaPrecioResponse>("/tasas-precio", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasas-precio"] });
    },
  });
}

export function useUpdateTasaPrecio() {
  const qc = useQueryClient();
  return useMutation<TasaPrecioResponse, Error, { id: string } & UpdateTasaPrecioInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<TasaPrecioResponse>(`/tasas-precio/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasas-precio"] });
    },
  });
}

export function useDeleteTasaPrecio() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/tasas-precio/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasas-precio"] });
    },
  });
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────

export function useMetodosPago(activo?: boolean) {
  return useQuery<MetodosPagoListResponse>({
    queryKey: ["metodos-pago", { activo }],
    queryFn: () => {
      const q = activo !== undefined ? `?activo=${activo}` : "";
      return apiClient.get<MetodosPagoListResponse>(`/metodos-pago${q}`);
    },
  });
}

export function useCreateMetodoPago() {
  const qc = useQueryClient();
  return useMutation<MetodoPagoResponse, Error, CreateMetodoPagoInput>({
    mutationFn: (body) => apiClient.post<MetodoPagoResponse>("/metodos-pago", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["metodos-pago"] });
    },
  });
}

export function useUpdateMetodoPago() {
  const qc = useQueryClient();
  return useMutation<MetodoPagoResponse, Error, { id: string } & UpdateMetodoPagoInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<MetodoPagoResponse>(`/metodos-pago/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["metodos-pago"] });
    },
  });
}

export function useDeleteMetodoPago() {
  const qc = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/metodos-pago/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["metodos-pago"] });
    },
  });
}
