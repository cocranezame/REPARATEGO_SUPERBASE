// Hooks for ventas module — C003
import type {
  AbrirCajaInput,
  AddVentaPagoInput,
  AnularVentaInput,
  CerrarCajaInput,
  CreateCotizacionVentaInput,
  CreateVentaInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  AddPagoResponse,
  AnularVentaResponse,
  CajaResponse,
  CalendarioEnviosResponse,
  CotizacionesVentaListResponse,
  CotizacionesVentaParams,
  CotizacionVentaResponse,
  ResumenCajaResponse,
  VentaDetalleResponse,
  VentaResponse,
  VentasEnviosListResponse,
  VentasListResponse,
  VentasParams,
} from "../types/ventas";

// ─── Caja ─────────────────────────────────────────────────────────────────────

export function useCajaActiva() {
  return useQuery<CajaResponse>({
    queryKey: ["ventas-caja-activa"],
    queryFn: () => apiClient.get<CajaResponse>("/ventas/caja/activa"),
    retry: false,
    staleTime: 30_000,
  });
}

export function useReporteCaja(cajaId: string) {
  return useQuery<ResumenCajaResponse>({
    queryKey: ["ventas-caja", cajaId, "reporte"],
    queryFn: () => apiClient.get<ResumenCajaResponse>(`/ventas/caja/${cajaId}/reporte`),
    enabled: cajaId !== "",
  });
}

export function useAbrirCaja() {
  const qc = useQueryClient();
  return useMutation<CajaResponse, Error, AbrirCajaInput>({
    mutationFn: (body) => apiClient.post<CajaResponse>("/ventas/caja/apertura", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas-caja-activa"] });
    },
  });
}

export function useCerrarCaja() {
  const qc = useQueryClient();
  return useMutation<ResumenCajaResponse, Error, CerrarCajaInput>({
    mutationFn: (body) => apiClient.post<ResumenCajaResponse>("/ventas/caja/cierre", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas-caja-activa"] });
    },
  });
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

function buildVentasQS(params: VentasParams): string {
  const q = new URLSearchParams();
  if (params.estado_pago) q.set("estado_pago", params.estado_pago);
  if (params.estado_despacho) q.set("estado_despacho", params.estado_despacho);
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.caja_id) q.set("caja_id", params.caja_id);
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
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

export function useVentasEnvios(params: { page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  });
  return useQuery<VentasEnviosListResponse>({
    queryKey: ["ventas-envios", params],
    queryFn: () => apiClient.get<VentasEnviosListResponse>(`/ventas/envios?${q.toString()}`),
  });
}

export function useVenta(id: string) {
  return useQuery<VentaDetalleResponse>({
    queryKey: ["ventas", id],
    queryFn: () => apiClient.get<VentaDetalleResponse>(`/ventas/${id}`),
    enabled: id !== "",
  });
}

export function useCrearVenta() {
  const qc = useQueryClient();
  return useMutation<VentaResponse, Error, CreateVentaInput>({
    mutationFn: (body) => apiClient.post<VentaResponse>("/ventas", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas"] });
      void qc.invalidateQueries({ queryKey: ["ventas-caja-activa"] });
      void qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useRegistrarPago() {
  const qc = useQueryClient();
  return useMutation<AddPagoResponse, Error, { ventaId: string } & AddVentaPagoInput>({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.post<AddPagoResponse>(`/ventas/${ventaId}/pago`, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["ventas", vars.ventaId] });
      void qc.invalidateQueries({ queryKey: ["ventas"] });
      void qc.invalidateQueries({ queryKey: ["ventas-caja-activa"] });
    },
  });
}

export function useAnularVenta() {
  const qc = useQueryClient();
  return useMutation<AnularVentaResponse, Error, { ventaId: string } & AnularVentaInput>({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.patch<AnularVentaResponse>(`/ventas/${ventaId}/anular`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas"] });
      void qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

// ─── Envío ────────────────────────────────────────────────────────────────────

export function useActualizarEnvio() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    {
      ventaId: string;
      direccion_id?: string | undefined;
      metodo_envio?: string | undefined;
      fecha_programada?: string | undefined;
      costo_envio?: number | undefined;
    }
  >({
    mutationFn: ({ ventaId, ...body }) =>
      apiClient.patch<{ success: boolean; data: unknown }>(`/ventas/${ventaId}/envio`, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["ventas", vars.ventaId] });
    },
  });
}

export function useDespachar() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean; data: unknown }, Error, string>({
    mutationFn: (ventaId) =>
      apiClient.patch<{ success: boolean; data: unknown }>(
        `/ventas/${ventaId}/envio/despachar`,
        {}
      ),
    onSuccess: (_data, ventaId) => {
      void qc.invalidateQueries({ queryKey: ["ventas", ventaId] });
      void qc.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useUpdateEnvioEstado() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; data: unknown },
    Error,
    { ventaId: string; estado: "PENDIENTE" | "DESPACHADO" }
  >({
    mutationFn: ({ ventaId }) =>
      apiClient.patch<{ success: boolean; data: unknown }>(
        `/ventas/${ventaId}/envio/despachar`,
        {}
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas-envios"] });
      void qc.invalidateQueries({ queryKey: ["ventas"] });
    },
  });
}

export function useCalendarioEnvios(params: {
  fecha_desde: string;
  fecha_hasta: string;
  sucursal_id?: string | undefined;
}) {
  const q = new URLSearchParams({
    fecha_desde: params.fecha_desde,
    fecha_hasta: params.fecha_hasta,
  });
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  return useQuery<CalendarioEnviosResponse>({
    queryKey: ["ventas-envios-calendario", params],
    queryFn: () =>
      apiClient.get<CalendarioEnviosResponse>(`/ventas/envios/calendario?${q.toString()}`),
    enabled: params.fecha_desde !== "" && params.fecha_hasta !== "",
  });
}

// ─── Cotizaciones referenciales ───────────────────────────────────────────────

function buildCotQS(params: CotizacionesVentaParams): string {
  const q = new URLSearchParams();
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.fecha_desde) q.set("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) q.set("fecha_hasta", params.fecha_hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useCotizacionesVenta(params: CotizacionesVentaParams = {}) {
  return useQuery<CotizacionesVentaListResponse>({
    queryKey: ["ventas-cotizaciones", params],
    queryFn: () =>
      apiClient.get<CotizacionesVentaListResponse>(`/ventas/cotizaciones${buildCotQS(params)}`),
  });
}

export function useCotizacionVenta(id: string) {
  return useQuery<CotizacionVentaResponse>({
    queryKey: ["ventas-cotizaciones", id],
    queryFn: () => apiClient.get<CotizacionVentaResponse>(`/ventas/cotizaciones/${id}`),
    enabled: id !== "",
  });
}

export function useCrearCotizacionVenta() {
  const qc = useQueryClient();
  return useMutation<CotizacionVentaResponse, Error, CreateCotizacionVentaInput>({
    mutationFn: (body) => apiClient.post<CotizacionVentaResponse>("/ventas/cotizaciones", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ventas-cotizaciones"] });
    },
  });
}
