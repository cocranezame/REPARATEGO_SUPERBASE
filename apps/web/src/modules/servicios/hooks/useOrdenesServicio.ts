// Hooks para /servicios-v2/ — C002
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  ApiList,
  ApiOk,
  BuscarPresupuestoParams,
  CostoRevision,
  EvidenciaOrden,
  Instancia,
  ListInstanciasParams,
  ListOrdenesParams,
  ObservacionOrden,
  OrdenServicioDetalle,
  OrdenServicioResumen,
  Periferico,
  PresupuestoBusquedaResult,
  RequerimientoOrden,
  SkuAsignadoOrden,
} from "../types/orden-servicio";

const BASE = "/servicios-v2";

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Instancias ───────────────────────────────────────────────────────────────

export function useInstancias(params: ListInstanciasParams = {}) {
  const { enabled = true, ...rest } = params;
  return useQuery<ApiList<Instancia>>({
    queryKey: ["instancias", rest],
    queryFn: () =>
      apiClient.get<ApiList<Instancia>>(
        `${BASE}/instancias${qs({ ...rest, page: rest.page ?? 1, pageSize: rest.pageSize ?? 20 })}`
      ),
    enabled,
  });
}

export function useCreateInstancia() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<Instancia>,
    Error,
    { cliente_id: string; producto_id: string; numero_serie?: string | undefined }
  >({
    mutationFn: (body) => apiClient.post<ApiOk<Instancia>>(`${BASE}/instancias`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
}

export function useAddInstanciaImagen() {
  return useMutation<
    ApiOk<unknown>,
    Error,
    {
      instanciaId: string;
      url: string;
      descripcion?: string | undefined;
      orden?: number | undefined;
    }
  >({
    mutationFn: ({ instanciaId, ...body }) =>
      apiClient.post<ApiOk<unknown>>(`${BASE}/instancias/${instanciaId}/imagenes`, body),
  });
}

// ─── Periféricos ─────────────────────────────────────────────────────────────

export function usePerifericosPorCategoria(categoriaId: string | undefined) {
  return useQuery<ApiOk<Periferico[]>>({
    queryKey: ["perifericos", categoriaId],
    queryFn: () =>
      apiClient.get<ApiOk<Periferico[]>>(
        `${BASE}/perifericos${qs({ categoria_id: categoriaId, activo: true })}`
      ),
    enabled: !!categoriaId,
  });
}

// ─── Costos de revisión ───────────────────────────────────────────────────────

export function useCostosRevision() {
  return useQuery<ApiOk<CostoRevision[]>>({
    queryKey: ["costos-revision"],
    queryFn: () => apiClient.get<ApiOk<CostoRevision[]>>(`${BASE}/costos-revision`),
  });
}

// ─── Órdenes ──────────────────────────────────────────────────────────────────

export function useOrdenes(params: ListOrdenesParams = {}) {
  return useQuery<ApiList<OrdenServicioResumen>>({
    queryKey: ["ordenes-sv2", params],
    queryFn: () =>
      apiClient.get<ApiList<OrdenServicioResumen>>(
        `${BASE}/ordenes${qs({ ...params, page: params.page ?? 1, pageSize: params.pageSize ?? 20 })}`
      ),
  });
}

export function useOrden(id: string) {
  return useQuery<ApiOk<OrdenServicioDetalle>>({
    queryKey: ["ordenes-sv2", id],
    queryFn: () => apiClient.get<ApiOk<OrdenServicioDetalle>>(`${BASE}/ordenes/${id}`),
    enabled: id !== "",
  });
}

export function useCreateOrden() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<OrdenServicioResumen>,
    Error,
    {
      instancia_id: string;
      canal: string;
      tipo_servicio?: string;
      falla_ingreso: string;
      costo_revision: number;
      sucursal_id?: string | undefined;
      perifericos?: string[] | undefined;
    }
  >({
    mutationFn: (body) => apiClient.post<ApiOk<OrdenServicioResumen>>(`${BASE}/ordenes`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2"] });
    },
  });
}

export function useUpdateOrden() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<OrdenServicioResumen>,
    Error,
    {
      id: string;
      tecnico_id?: string | undefined;
      diagnostico_tecnico?: string | undefined;
      solucion?: string | undefined;
    }
  >({
    mutationFn: ({ id, ...body }) =>
      apiClient.patch<ApiOk<OrdenServicioResumen>>(`${BASE}/ordenes/${id}`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.id] });
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2"] });
    },
  });
}

export function useCambiarEstado() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<{
      estado_anterior: string;
      estado_nuevo: string;
      orden_id: string;
      venta_id?: string | undefined;
    }>,
    Error,
    {
      id: string;
      estado: string;
      observacion?: string | undefined;
      motivo_devolucion?: string | undefined;
    }
  >({
    mutationFn: ({ id, ...body }) => apiClient.patch(`${BASE}/ordenes/${id}/estado`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2"] });
    },
  });
}

// ─── Componentes ──────────────────────────────────────────────────────────────

export function useComponentesOrden(ordenId: string) {
  return useQuery<ApiOk<import("../types/orden-servicio").ComponenteOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "componentes"],
    queryFn: () =>
      apiClient.get<ApiOk<import("../types/orden-servicio").ComponenteOrden[]>>(
        `${BASE}/ordenes/${ordenId}/componentes`
      ),
    enabled: ordenId !== "",
  });
}

export function useSaveComponentes() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<import("../types/orden-servicio").ComponenteOrden[]>,
    Error,
    {
      ordenId: string;
      etapa: "PRELIMINAR" | "FINAL";
      items: Array<{
        componente_id: string;
        tipo_afectacion: "PREVENTIVO" | "CORRECTIVO";
        tipo_accion: "REPARACION" | "CAMBIO";
        etapa: "PRELIMINAR" | "FINAL";
      }>;
    }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.put(`${BASE}/ordenes/${ordenId}/componentes`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "componentes"] });
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId] });
    },
  });
}

// ─── Presupuesto / cotización ─────────────────────────────────────────────────

export function useBuscarPresupuesto(params: BuscarPresupuestoParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;
  return useQuery<ApiOk<PresupuestoBusquedaResult>>({
    queryKey: ["presupuesto", rest],
    queryFn: () =>
      apiClient.get<ApiOk<PresupuestoBusquedaResult>>(
        `${BASE}/presupuesto/buscar${qs({ ...rest, page: rest.page ?? 1, pageSize: rest.pageSize ?? 50 })}`
      ),
    enabled,
  });
}

export function useCotizacion(ordenId: string) {
  return useQuery<ApiOk<import("../types/orden-servicio").CotizacionOrden>>({
    queryKey: ["ordenes-sv2", ordenId, "cotizacion"],
    queryFn: () =>
      apiClient.get<ApiOk<import("../types/orden-servicio").CotizacionOrden>>(
        `${BASE}/ordenes/${ordenId}/cotizacion`
      ),
    enabled: ordenId !== "",
  });
}

export function useCreateCotizacion() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<import("../types/orden-servicio").CotizacionOrden>,
    Error,
    {
      ordenId: string;
      items: Array<{
        tipo_item: "REPUESTO" | "SERVICIO" | "MANUAL";
        producto_id?: string | undefined;
        componente_id?: string | undefined;
        descripcion_manual?: string | undefined;
        cantidad: number;
        precio_unitario: number;
        es_preventivo: boolean;
      }>;
      observacion?: string | undefined;
    }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post(`${BASE}/ordenes/${ordenId}/cotizacion`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "cotizacion"] });
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId] });
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2"] });
    },
  });
}

// ─── Evidencias ───────────────────────────────────────────────────────────────

export function useEvidencias(ordenId: string) {
  return useQuery<ApiOk<EvidenciaOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "evidencias"],
    queryFn: () => apiClient.get<ApiOk<EvidenciaOrden[]>>(`${BASE}/ordenes/${ordenId}/evidencias`),
    enabled: ordenId !== "",
  });
}

export function useCreateEvidencia() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<EvidenciaOrden>,
    Error,
    { ordenId: string; url: string; etapa?: string | undefined; descripcion?: string | undefined }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post<ApiOk<EvidenciaOrden>>(`${BASE}/ordenes/${ordenId}/evidencias`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "evidencias"] });
    },
  });
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

export function useSkus(ordenId: string) {
  return useQuery<ApiOk<SkuAsignadoOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "skus"],
    queryFn: () => apiClient.get<ApiOk<SkuAsignadoOrden[]>>(`${BASE}/ordenes/${ordenId}/skus`),
    enabled: ordenId !== "",
  });
}

export function useAsignarSku() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<SkuAsignadoOrden>,
    Error,
    {
      ordenId: string;
      lote_id: string;
      producto_id: string;
      cantidad: number;
      precio_presupuesto: number;
    }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post<ApiOk<SkuAsignadoOrden>>(`${BASE}/ordenes/${ordenId}/skus`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "skus"] });
    },
  });
}

export function useEliminarSku() {
  const qc = useQueryClient();
  return useMutation<ApiOk<boolean>, Error, { ordenId: string; skuId: string }>({
    mutationFn: ({ ordenId, skuId }) =>
      apiClient.delete<ApiOk<boolean>>(`${BASE}/ordenes/${ordenId}/skus/${skuId}`),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "skus"] });
    },
  });
}

// ─── Requerimientos ───────────────────────────────────────────────────────────

export function useRequerimientos(ordenId: string) {
  return useQuery<ApiOk<RequerimientoOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "requerimientos"],
    queryFn: () =>
      apiClient.get<ApiOk<RequerimientoOrden[]>>(`${BASE}/ordenes/${ordenId}/requerimientos`),
    enabled: ordenId !== "",
  });
}

export function useCreateRequerimiento() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<RequerimientoOrden>,
    Error,
    {
      ordenId: string;
      descripcion: string;
      cantidad: number;
      producto_id?: string | undefined;
      imagen_url?: string | undefined;
      observacion?: string | undefined;
    }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post<ApiOk<RequerimientoOrden>>(`${BASE}/ordenes/${ordenId}/requerimientos`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "requerimientos"] });
    },
  });
}

export function useCambiarEstadoRequerimiento() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<RequerimientoOrden>,
    Error,
    { requerimientoId: string; ordenId: string; estado: string }
  >({
    mutationFn: ({ requerimientoId, estado }) =>
      apiClient.patch<ApiOk<RequerimientoOrden>>(
        `${BASE}/requerimientos/${requerimientoId}/estado`,
        { estado }
      ),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "requerimientos"] });
    },
  });
}

// ─── Aceptaciones ─────────────────────────────────────────────────────────────

export function useCreateAceptacion() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<{ aceptacion_id: string; estado_nuevo: string }>,
    Error,
    {
      ordenId: string;
      tipo: string;
      canal_aceptacion: string;
      password?: string | undefined;
      evidence_image_url?: string | undefined;
      preventivo_accepted?: boolean | undefined;
      manual_reason?: string | undefined;
    }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post(`${BASE}/ordenes/${ordenId}/aceptaciones`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2"] });
    },
  });
}

// ─── Historial ────────────────────────────────────────────────────────────────

export function useHistorial(ordenId: string) {
  return useQuery<ApiOk<import("../types/orden-servicio").HistorialOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "historial"],
    queryFn: () =>
      apiClient.get<ApiOk<import("../types/orden-servicio").HistorialOrden[]>>(
        `${BASE}/ordenes/${ordenId}/historial`
      ),
    enabled: ordenId !== "",
  });
}

// ─── Observaciones ────────────────────────────────────────────────────────────

export function useObservaciones(ordenId: string) {
  return useQuery<ApiOk<ObservacionOrden[]>>({
    queryKey: ["ordenes-sv2", ordenId, "observaciones"],
    queryFn: () =>
      apiClient.get<ApiOk<ObservacionOrden[]>>(`${BASE}/ordenes/${ordenId}/observaciones`),
    enabled: ordenId !== "",
  });
}

export function useCreateObservacion() {
  const qc = useQueryClient();
  return useMutation<
    ApiOk<ObservacionOrden>,
    Error,
    { ordenId: string; etapa: string; texto: string }
  >({
    mutationFn: ({ ordenId, ...body }) =>
      apiClient.post<ApiOk<ObservacionOrden>>(`${BASE}/ordenes/${ordenId}/observaciones`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ordenes-sv2", vars.ordenId, "observaciones"] });
    },
  });
}
