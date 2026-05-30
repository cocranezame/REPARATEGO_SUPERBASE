import type {
  CreateLoteInput,
  CreateMetodoPagoInput,
  CreateMovimientoInput,
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
  LoteResponse,
  LotesListResponse,
  LotesParams,
  MetodoPagoResponse,
  MetodosPagoListResponse,
  MovimientoResponse,
  MovimientosListResponse,
  MovimientosParams,
  ProductoResponse,
  ProductosListResponse,
  ProductosParams,
  StockDetalleResponse,
  StockListResponse,
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

// ─── Stock ────────────────────────────────────────────────────────────────────

function buildStockQS(params: {
  producto_id?: string;
  sucursal_id?: string;
  alerta_minimo?: boolean;
}): string {
  const q = new URLSearchParams();
  if (params.producto_id) q.set("producto_id", params.producto_id);
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  if (params.alerta_minimo !== undefined) q.set("alerta_minimo", String(params.alerta_minimo));
  return q.toString() ? `?${q.toString()}` : "";
}

export function useStock(
  params: { producto_id?: string; sucursal_id?: string; alerta_minimo?: boolean } = {}
) {
  return useQuery<StockListResponse>({
    queryKey: ["stock", params],
    queryFn: () => apiClient.get<StockListResponse>(`/stock${buildStockQS(params)}`),
  });
}

export function useStockDetalle(productoId: string) {
  return useQuery<StockDetalleResponse>({
    queryKey: ["stock", productoId, "detalle"],
    queryFn: () => apiClient.get<StockDetalleResponse>(`/stock/${productoId}/detalle`),
    enabled: productoId !== "",
  });
}

// ─── Lotes ────────────────────────────────────────────────────────────────────

function buildLotesQS(params: LotesParams): string {
  const q = new URLSearchParams();
  if (params.producto_id) q.set("producto_id", params.producto_id);
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useLotes(params: LotesParams = {}) {
  return useQuery<LotesListResponse>({
    queryKey: ["lotes", params],
    queryFn: () => apiClient.get<LotesListResponse>(`/lotes${buildLotesQS(params)}`),
  });
}

export function useCreateLote() {
  const qc = useQueryClient();
  return useMutation<LoteResponse, Error, CreateLoteInput>({
    mutationFn: (body) => apiClient.post<LoteResponse>("/lotes", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lotes"] });
      void qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

function buildMovimientosQS(params: MovimientosParams): string {
  const q = new URLSearchParams();
  if (params.producto_id) q.set("producto_id", params.producto_id);
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useMovimientos(params: MovimientosParams = {}) {
  return useQuery<MovimientosListResponse>({
    queryKey: ["movimientos", params],
    queryFn: () =>
      apiClient.get<MovimientosListResponse>(`/movimientos${buildMovimientosQS(params)}`),
  });
}

export function useCreateMovimiento() {
  const qc = useQueryClient();
  return useMutation<MovimientoResponse, Error, CreateMovimientoInput>({
    mutationFn: (body) => apiClient.post<MovimientoResponse>("/movimientos", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["movimientos"] });
      void qc.invalidateQueries({ queryKey: ["stock"] });
      void qc.invalidateQueries({ queryKey: ["lotes"] });
    },
  });
}
