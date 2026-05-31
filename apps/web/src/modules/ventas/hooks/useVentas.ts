import type {
  AbrirCajaInput,
  AddVentaPagoInput,
  AnularVentaInput,
  CerrarCajaInput,
  CreateCotizacionVentaInput,
  CreateVentaEnvioInput,
  CreateVentaInput,
  UpdateCotizacionVentaEstadoInput,
  UpdateEnvioEstadoInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CajaResponse,
  CajasListResponse,
  CotizacionesVentaListResponse,
  CotizacionesVentaParams,
  CotizacionVentaResponse,
  ResumenCajaResponse,
  VentaDetalleResponse,
  VentaResponse,
  VentasEnvioListResponse,
  VentasListResponse,
  VentasParams,
} from "../types/ventas";

// ─── Caja ─────────────────────────────────────────────────────────────────────

export function useCajas(params: { sucursal_id?: string; estado?: string } = {}) {
  const q = new URLSearchParams();
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  if (params.estado) q.set("estado", params.estado);
  q.set("pageSize", "50");
  return useQuery<CajasListResponse>({
    queryKey: ["cajas", params],
    queryFn: () => apiClient.get<CajasListResponse>(`/cajas?${q.toString()}`),
  });
}

export function useCajaActual() {
  return useQuery<CajaResponse>({
    queryKey: ["cajas", "actual"],
    queryFn: () => apiClient.get<CajaResponse>("/cajas/actual"),
  });
}

export function useResumenCaja(id: string) {
  return useQuery<ResumenCajaResponse>({
    queryKey: ["cajas", id, "resumen"],
    queryFn: () => apiClient.get<ResumenCajaResponse>(`/cajas/${id}/resumen`),
    enabled: id !== "",
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  return useMutation<CajaResponse, Error, AbrirCajaInput>({
    mutationFn: (body) => apiClient.post<CajaResponse>("/cajas/abrir", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cajas"] });
    },
  });
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  return useMutation<CajaResponse, Error, { id: string } & CerrarCajaInput>({
    mutationFn: ({ id, ...body }) => apiClient.post<CajaResponse>(`/cajas/${id}/cerrar`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cajas"] });
    },
  });
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

function buildVentasQS(params: VentasParams): string {
  const q = new URLSearchParams();
  if (params.tipo_venta) q.set("tipo_venta", params.tipo_venta);
  if (params.estado) q.set("estado", params.estado);
  if (params.caja_id) q.set("caja_id", params.caja_id);
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  if (params.search) q.set("search", params.search);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useVentas(params: VentasParams = {}) {
  return useQuery<VentasListResponse>({
    queryKey: ["ventas", params],
    queryFn: () => apiClient.get<VentasListResponse>(`/ventas${buildVentasQS(params)}`),
  });
}

export function useVenta(id: string) {
  return useQuery<VentaDetalleResponse>({
    queryKey: ["ventas", id],
    queryFn: () => apiClient.get<VentaDetalleResponse>(`/ventas/${id}`),
    enabled: id !== "",
  });
}

export function useCreateVenta() {
  const queryClient = useQueryClient();
  return useMutation<VentaResponse, Error, CreateVentaInput>({
    mutationFn: (body) => apiClient.post<VentaResponse>("/ventas", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useAnularVenta() {
  const queryClient = useQueryClient();
  return useMutation<VentaResponse, Error, { id: string } & AnularVentaInput>({
    mutationFn: ({ id, ...body }) => apiClient.post<VentaResponse>(`/ventas/${id}/anular`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useAddVentaPago() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    { ventaId: string } & AddVentaPagoInput
  >({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.post<{ success: boolean; data: unknown }>(`/ventas/${ventaId}/pagos`, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", vars.ventaId] });
      void queryClient.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useCreateVentaEnvio() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    { ventaId: string } & CreateVentaEnvioInput
  >({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.post<{ success: boolean; data: unknown }>(`/ventas/${ventaId}/envio`, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", vars.ventaId] });
    },
  });
}

export function useUpdateEnvioEstado() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    { ventaId: string } & UpdateEnvioEstadoInput
  >({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.put<{ success: boolean; data: unknown }>(`/ventas/${ventaId}/envio/estado`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas-envios"] });
      void queryClient.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useVentasEnvios(params: { page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return useQuery<VentasEnvioListResponse>({
    queryKey: ["ventas-envios", params],
    queryFn: () => apiClient.get<VentasEnvioListResponse>(`/ventas/envios?${q.toString()}`),
  });
}

// ─── Cotizaciones de venta ────────────────────────────────────────────────────

function buildCotQS(params: CotizacionesVentaParams): string {
  const q = new URLSearchParams();
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.estado) q.set("estado", params.estado);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useCotizacionesVenta(params: CotizacionesVentaParams = {}) {
  return useQuery<CotizacionesVentaListResponse>({
    queryKey: ["cotizaciones-venta", params],
    queryFn: () =>
      apiClient.get<CotizacionesVentaListResponse>(`/cotizaciones-venta${buildCotQS(params)}`),
  });
}

export function useCotizacionVenta(id: string) {
  return useQuery<CotizacionVentaResponse>({
    queryKey: ["cotizaciones-venta", id],
    queryFn: () => apiClient.get<CotizacionVentaResponse>(`/cotizaciones-venta/${id}`),
    enabled: id !== "",
  });
}

export function useCreateCotizacionVenta() {
  const queryClient = useQueryClient();
  return useMutation<CotizacionVentaResponse, Error, CreateCotizacionVentaInput>({
    mutationFn: (body) => apiClient.post<CotizacionVentaResponse>("/cotizaciones-venta", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cotizaciones-venta"] });
    },
  });
}

export function useUpdateCotizacionVentaEstado() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    { id: string } & UpdateCotizacionVentaEstadoInput
  >({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<{ success: boolean; data: unknown }>(`/cotizaciones-venta/${id}/estado`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cotizaciones-venta"] });
    },
  });
}
