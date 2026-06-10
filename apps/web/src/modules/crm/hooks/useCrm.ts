// Hooks for CRM module — C005
import type {
  AsignarEtiquetasInput,
  AsignarVendedorConvInput,
  AsignarVendedorLeadInput,
  CambiarModoInput,
  CreateAgenteInput,
  CreateEtapaInput,
  CreateEtiquetaInput,
  CreateMensajeInternoInput,
  CreateNotaInput,
  CreatePlantillaInput,
  CreateTransicionInput,
  CreateWaCuentaInput,
  EnviarMensajeInput,
  EnviarPlantillaInput,
  MoverEtapaInput,
  UpdateAgenteInput,
  UpdateBotInput,
  UpdateEtapaInput,
  UpdateEtiquetaInput,
  UpdatePlantillaInput,
  UpdateWaCuentaInput,
} from "@kallpasoft/validators";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  AccionAgenteListResponse,
  AgenteListResponse,
  AgenteResponse,
  AudienciasResponse,
  BotListResponse,
  BotResponse,
  ConversacionesParams,
  ConversacionListResponse,
  ConversacionResponse,
  EtapaListResponse,
  EtapaResponse,
  EtiquetaListResponse,
  EtiquetaResponse,
  EventoListResponse,
  EventosParams,
  LeadListResponse,
  LeadResponse,
  LeadsParams,
  MensajeInternoResponse,
  MensajeListResponse,
  MensajeriaListResponse,
  MensajesInternosListResponse,
  MetricasClientesResponse,
  MetricasDashboardResponse,
  MetricasLeadsResponse,
  MetricasNicoResponse,
  MetricasVentasResponse,
  PlantillaListResponse,
  TransicionListResponse,
  WaCuentaListResponse,
  WaCuentaResponse,
} from "../types/crm";

// ─── WA Cuentas ───────────────────────────────────────────────────────────────

export function useWaCuentas() {
  return useQuery<WaCuentaListResponse>({
    queryKey: ["crm-wa-cuentas"],
    queryFn: () => apiClient.get<WaCuentaListResponse>("/crm/wa-cuentas"),
  });
}

export function useCreateWaCuenta() {
  const qc = useQueryClient();
  return useMutation<WaCuentaResponse, Error, CreateWaCuentaInput>({
    mutationFn: (body) => apiClient.post<WaCuentaResponse>("/crm/wa-cuentas", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-wa-cuentas"] });
    },
  });
}

export function useUpdateWaCuenta() {
  const qc = useQueryClient();
  return useMutation<WaCuentaResponse, Error, { id: string; data: UpdateWaCuentaInput }>({
    mutationFn: ({ id, data }) => apiClient.put<WaCuentaResponse>(`/crm/wa-cuentas/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-wa-cuentas"] });
    },
  });
}

export function useDeleteWaCuenta() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`/crm/wa-cuentas/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-wa-cuentas"] });
    },
  });
}

// ─── Etapas ───────────────────────────────────────────────────────────────────

export function useEtapas() {
  return useQuery<EtapaListResponse>({
    queryKey: ["crm-etapas"],
    queryFn: () => apiClient.get<EtapaListResponse>("/crm/etapas"),
    staleTime: 60_000,
  });
}

export function useCreateEtapa() {
  const qc = useQueryClient();
  return useMutation<EtapaResponse, Error, CreateEtapaInput>({
    mutationFn: (body) => apiClient.post<EtapaResponse>("/crm/etapas", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etapas"] });
    },
  });
}

export function useUpdateEtapa() {
  const qc = useQueryClient();
  return useMutation<EtapaResponse, Error, { id: string; data: UpdateEtapaInput }>({
    mutationFn: ({ id, data }) => apiClient.put<EtapaResponse>(`/crm/etapas/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etapas"] });
    },
  });
}

export function useDeleteEtapa() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`/crm/etapas/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etapas"] });
    },
  });
}

// ─── Transiciones ─────────────────────────────────────────────────────────────

export function useTransiciones(etapaId: string) {
  return useQuery<TransicionListResponse>({
    queryKey: ["crm-transiciones", etapaId],
    queryFn: () => apiClient.get<TransicionListResponse>(`/crm/etapas/${etapaId}/transiciones`),
    enabled: etapaId !== "",
    staleTime: 60_000,
  });
}

export function useCreateTransicion() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean },
    Error,
    { etapaOrigenId: string; data: CreateTransicionInput }
  >({
    mutationFn: ({ etapaOrigenId, data }) =>
      apiClient.post<{ success: boolean }>(`/crm/etapas/${etapaOrigenId}/transiciones`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-transiciones", vars.etapaOrigenId] });
    },
  });
}

export function useDeleteTransicion() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { origenId: string; destinoId: string }>({
    mutationFn: ({ origenId, destinoId }) =>
      apiClient.delete<{ success: boolean }>(`/crm/etapas/${origenId}/transiciones/${destinoId}`),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-transiciones", vars.origenId] });
    },
  });
}

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export function useEtiquetas() {
  return useQuery<EtiquetaListResponse>({
    queryKey: ["crm-etiquetas"],
    queryFn: () => apiClient.get<EtiquetaListResponse>("/crm/etiquetas"),
    staleTime: 60_000,
  });
}

export function useCreateEtiqueta() {
  const qc = useQueryClient();
  return useMutation<EtiquetaResponse, Error, CreateEtiquetaInput>({
    mutationFn: (body) => apiClient.post<EtiquetaResponse>("/crm/etiquetas", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etiquetas"] });
    },
  });
}

export function useUpdateEtiqueta() {
  const qc = useQueryClient();
  return useMutation<EtiquetaResponse, Error, { id: string; data: UpdateEtiquetaInput }>({
    mutationFn: ({ id, data }) => apiClient.put<EtiquetaResponse>(`/crm/etiquetas/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etiquetas"] });
    },
  });
}

export function useDeleteEtiqueta() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`/crm/etiquetas/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-etiquetas"] });
    },
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

function buildLeadsQS(params: LeadsParams): string {
  const q = new URLSearchParams();
  if (params.etapa_id) q.set("etapa_id", params.etapa_id);
  if (params.vendedor_id) q.set("vendedor_id", params.vendedor_id);
  if (params.utm_source) q.set("utm_source", params.utm_source);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  if (params.search) q.set("search", params.search);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  return `?${q.toString()}`;
}

export function useLeads(params: LeadsParams = {}) {
  return useQuery<LeadListResponse>({
    queryKey: ["crm-leads", params],
    queryFn: () => apiClient.get<LeadListResponse>(`/crm/leads${buildLeadsQS(params)}`),
  });
}

export function useLead(id: string) {
  return useQuery<LeadResponse>({
    queryKey: ["crm-lead", id],
    queryFn: () => apiClient.get<LeadResponse>(`/crm/leads/${id}`),
    enabled: id !== "",
  });
}

export function useMoverEtapaLead() {
  const qc = useQueryClient();
  return useMutation<LeadResponse, Error, { id: string; data: MoverEtapaInput }>({
    mutationFn: ({ id, data }) => apiClient.put<LeadResponse>(`/crm/leads/${id}/etapa`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-leads"] });
      void qc.invalidateQueries({ queryKey: ["crm-lead", vars.id] });
    },
  });
}

export function useAsignarEtiquetasLead() {
  const qc = useQueryClient();
  return useMutation<LeadResponse, Error, { id: string; data: AsignarEtiquetasInput }>({
    mutationFn: ({ id, data }) => apiClient.put<LeadResponse>(`/crm/leads/${id}/etiquetas`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-lead", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useAsignarVendedorLead() {
  const qc = useQueryClient();
  return useMutation<LeadResponse, Error, { id: string; data: AsignarVendedorLeadInput }>({
    mutationFn: ({ id, data }) => apiClient.put<LeadResponse>(`/crm/leads/${id}/vendedor`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-lead", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useCreateNotaLead() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; data: CreateNotaInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.post<{ success: boolean }>(`/crm/leads/${id}/nota`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-lead", vars.id] });
    },
  });
}

// ─── Conversaciones ───────────────────────────────────────────────────────────

function buildConvQS(params: ConversacionesParams): string {
  const q = new URLSearchParams();
  if (params.modo) q.set("modo", params.modo);
  if (params.estado) q.set("estado", params.estado);
  if (params.wa_cuenta_id) q.set("wa_cuenta_id", params.wa_cuenta_id);
  if (params.vendedor_id) q.set("vendedor_id", params.vendedor_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  return `?${q.toString()}`;
}

export function useConversaciones(params: ConversacionesParams = {}) {
  return useQuery<ConversacionListResponse>({
    queryKey: ["crm-conversaciones", params],
    queryFn: () =>
      apiClient.get<ConversacionListResponse>(`/crm/conversaciones${buildConvQS(params)}`),
    refetchInterval: 10_000,
  });
}

export function useConversacion(id: string) {
  return useQuery<ConversacionResponse>({
    queryKey: ["crm-conversacion", id],
    queryFn: () => apiClient.get<ConversacionResponse>(`/crm/conversaciones/${id}`),
    enabled: id !== "",
    refetchInterval: 5_000,
  });
}

export function useMensajesConversacion(conversacionId: string) {
  return useInfiniteQuery<MensajeListResponse>({
    queryKey: ["crm-mensajes", conversacionId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ pageSize: "50" });
      if (pageParam) q.set("antes_de", pageParam as string);
      return apiClient.get<MensajeListResponse>(
        `/crm/conversaciones/${conversacionId}/mensajes?${q.toString()}`
      );
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < 50) return undefined;
      const oldest = lastPage.data[lastPage.data.length - 1];
      return oldest?.created_at;
    },
    enabled: conversacionId !== "",
    refetchInterval: 5_000,
  });
}

export function useEnviarMensaje() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; data: EnviarMensajeInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.post<{ success: boolean }>(`/crm/conversaciones/${id}/mensaje`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-mensajes", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-conversacion", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-conversaciones"] });
    },
  });
}

export function useCambiarModo() {
  const qc = useQueryClient();
  return useMutation<ConversacionResponse, Error, { id: string; data: CambiarModoInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.put<ConversacionResponse>(`/crm/conversaciones/${id}/modo`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-conversacion", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-conversaciones"] });
    },
  });
}

export function useAsignarVendedorConversacion() {
  const qc = useQueryClient();
  return useMutation<ConversacionResponse, Error, { id: string; data: AsignarVendedorConvInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.put<ConversacionResponse>(`/crm/conversaciones/${id}/asignar`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-conversacion", vars.id] });
      void qc.invalidateQueries({ queryKey: ["crm-conversaciones"] });
    },
  });
}

// ─── Agentes ──────────────────────────────────────────────────────────────────

export function useAgentes() {
  return useQuery<AgenteListResponse>({
    queryKey: ["crm-agentes"],
    queryFn: () => apiClient.get<AgenteListResponse>("/crm/agentes"),
  });
}

export function useCreateAgente() {
  const qc = useQueryClient();
  return useMutation<AgenteResponse, Error, CreateAgenteInput>({
    mutationFn: (body) => apiClient.post<AgenteResponse>("/crm/agentes", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-agentes"] });
    },
  });
}

export function useUpdateAgente() {
  const qc = useQueryClient();
  return useMutation<AgenteResponse, Error, { id: string; data: UpdateAgenteInput }>({
    mutationFn: ({ id, data }) => apiClient.put<AgenteResponse>(`/crm/agentes/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-agentes"] });
    },
  });
}

export function useAccionesAgente(
  agenteId: string,
  params: {
    tool_name?: string | undefined;
    exitoso?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
  } = {}
) {
  const q = new URLSearchParams();
  if (params.tool_name) q.set("tool_name", params.tool_name);
  if (params.exitoso !== undefined) q.set("exitoso", String(params.exitoso));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  return useQuery<AccionAgenteListResponse>({
    queryKey: ["crm-acciones-agente", agenteId, params],
    queryFn: () =>
      apiClient.get<AccionAgenteListResponse>(`/crm/agentes/${agenteId}/acciones?${q.toString()}`),
    enabled: agenteId !== "",
  });
}

// ─── Plantillas ───────────────────────────────────────────────────────────────

export function usePlantillas() {
  return useQuery<PlantillaListResponse>({
    queryKey: ["crm-plantillas"],
    queryFn: () => apiClient.get<PlantillaListResponse>("/crm/plantillas"),
  });
}

export function useCreatePlantilla() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, CreatePlantillaInput>({
    mutationFn: (body) => apiClient.post<{ success: boolean }>("/crm/plantillas", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-plantillas"] });
    },
  });
}

export function useUpdatePlantilla() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; data: UpdatePlantillaInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.put<{ success: boolean }>(`/crm/plantillas/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-plantillas"] });
    },
  });
}

export function useEnviarPlantilla() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; data: EnviarPlantillaInput }>({
    mutationFn: ({ id, data }) =>
      apiClient.post<{ success: boolean }>(`/crm/plantillas/${id}/enviar`, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-mensajes", vars.data.conversacion_id] });
    },
  });
}

// ─── Bots ─────────────────────────────────────────────────────────────────────

export function useBots() {
  return useQuery<BotListResponse>({
    queryKey: ["crm-bots"],
    queryFn: () => apiClient.get<BotListResponse>("/crm/bots"),
  });
}

export function useUpdateBot() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; data: UpdateBotInput }>({
    mutationFn: ({ id, data }) => apiClient.put<{ success: boolean }>(`/crm/bots/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-bots"] });
    },
  });
}

export function useConfigBot(botId: string) {
  return useQuery<BotResponse>({
    queryKey: ["crm-bot-config", botId],
    queryFn: () => apiClient.get<BotResponse>(`/crm/bots/${botId}/config`),
    enabled: botId !== "",
  });
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export function useEventos(params: EventosParams = {}) {
  const q = new URLSearchParams();
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.origen) q.set("origen", params.origen);
  if (params.lead_id) q.set("lead_id", params.lead_id);
  if (params.fecha_desde) q.set("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) q.set("fecha_hasta", params.fecha_hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  return useQuery<EventoListResponse>({
    queryKey: ["crm-eventos", params],
    queryFn: () => apiClient.get<EventoListResponse>(`/crm/eventos?${q.toString()}`),
  });
}

// ─── Mensajería interna ───────────────────────────────────────────────────────

export function useMensajeriaInterna() {
  return useQuery<MensajeriaListResponse>({
    queryKey: ["crm-mensajeria"],
    queryFn: () => apiClient.get<MensajeriaListResponse>("/crm/mensajeria"),
    refetchInterval: 15_000,
  });
}

export function useMensajesConUsuario(usuarioId: string) {
  return useQuery<MensajesInternosListResponse>({
    queryKey: ["crm-mensajeria-conv", usuarioId],
    queryFn: () => apiClient.get<MensajesInternosListResponse>(`/crm/mensajeria/${usuarioId}`),
    enabled: usuarioId !== "",
    refetchInterval: 5_000,
  });
}

export function useEnviarMensajeInterno() {
  const qc = useQueryClient();
  return useMutation<MensajeInternoResponse, Error, CreateMensajeInternoInput>({
    mutationFn: (body) => apiClient.post<MensajeInternoResponse>("/crm/mensajeria", body),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm-mensajeria-conv", vars.destinatario_id] });
      void qc.invalidateQueries({ queryKey: ["crm-mensajeria"] });
    },
  });
}

export function useMarcarLeido() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (mensajeId) =>
      apiClient.put<{ success: boolean }>(`/crm/mensajeria/${mensajeId}/leer`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-mensajeria"] });
    },
  });
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

type MetricasParams = { from: string; to: string; sucursal_id?: string | undefined };

function buildMetricasQS(params: MetricasParams): string {
  const q = new URLSearchParams({ from: params.from, to: params.to });
  if (params.sucursal_id) q.set("sucursal_id", params.sucursal_id);
  return `?${q.toString()}`;
}

export function useMetricasDashboard(params: MetricasParams) {
  return useQuery<MetricasDashboardResponse>({
    queryKey: ["crm-metricas-dashboard", params],
    queryFn: () =>
      apiClient.get<MetricasDashboardResponse>(`/crm/metricas/dashboard${buildMetricasQS(params)}`),
    enabled: params.from !== "" && params.to !== "",
  });
}

export function useMetricasNico(params: MetricasParams) {
  return useQuery<MetricasNicoResponse>({
    queryKey: ["crm-metricas-nico", params],
    queryFn: () =>
      apiClient.get<MetricasNicoResponse>(`/crm/metricas/nico${buildMetricasQS(params)}`),
    enabled: params.from !== "" && params.to !== "",
  });
}

export function useMetricasLeads(params: MetricasParams) {
  return useQuery<MetricasLeadsResponse>({
    queryKey: ["crm-metricas-leads", params],
    queryFn: () =>
      apiClient.get<MetricasLeadsResponse>(`/crm/metricas/leads${buildMetricasQS(params)}`),
    enabled: params.from !== "" && params.to !== "",
  });
}

export function useMetricasClientes(params: MetricasParams) {
  return useQuery<MetricasClientesResponse>({
    queryKey: ["crm-metricas-clientes", params],
    queryFn: () =>
      apiClient.get<MetricasClientesResponse>(`/crm/metricas/clientes${buildMetricasQS(params)}`),
    enabled: params.from !== "" && params.to !== "",
  });
}

export function useMetricasVentas(params: MetricasParams) {
  return useQuery<MetricasVentasResponse>({
    queryKey: ["crm-metricas-ventas", params],
    queryFn: () =>
      apiClient.get<MetricasVentasResponse>(`/crm/metricas/ventas${buildMetricasQS(params)}`),
    enabled: params.from !== "" && params.to !== "",
  });
}

export function useAudiences() {
  return useQuery<AudienciasResponse>({
    queryKey: ["crm-audiences"],
    queryFn: () => apiClient.get<AudienciasResponse>("/crm/audiences"),
  });
}
