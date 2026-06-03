// Types for CRM module — C005

// ─── WA Cuentas ───────────────────────────────────────────────────────────────

export type WaCuentaDto = {
  id: string;
  tenant_id: string;
  negocio_nombre: string;
  phone_number_id: string;
  waba_id: string;
  webhook_verify_token: string;
  nombre: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type WaCuentaListResponse = { success: boolean; data: WaCuentaDto[] };
export type WaCuentaResponse = { success: boolean; data: WaCuentaDto };

// ─── Etapas ───────────────────────────────────────────────────────────────────

export type CrmEtapaDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  codigo: string;
  orden: number;
  objetivo: string | null;
  operador: "IA" | "BOT" | "HUMANO" | "SISTEMA";
  bot_id: string | null;
  bot_nombre: string | null;
  tiempo_espera_horas: number | null;
  max_intentos_recordatorio: number | null;
  color: string | null;
  activo: boolean;
  leads_count: number;
  created_at: string;
  updated_at: string;
};

export type EtapaListResponse = { success: boolean; data: CrmEtapaDto[] };
export type EtapaResponse = { success: boolean; data: CrmEtapaDto };

export type TransicionDto = {
  id: string;
  tenant_id: string;
  etapa_origen_id: string;
  etapa_destino_id: string;
  destino_nombre: string;
  destino_codigo: string;
  created_at: string;
};

export type TransicionListResponse = { success: boolean; data: TransicionDto[] };

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export type CrmEtiquetaDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  codigo: string;
  grupo: "IDENTIFICACION" | "RUTA_ACTIVA" | "CAPTURA_DATOS" | "ESTADO_OPERATIVO";
  descripcion: string | null;
  activo: boolean;
  created_at: string;
};

export type EtiquetaListResponse = { success: boolean; data: CrmEtiquetaDto[] };
export type EtiquetaResponse = { success: boolean; data: CrmEtiquetaDto };

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadEtiquetaItem = {
  etiqueta_id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  asignado_por: string;
  created_at: string;
};

export type MensajeItemDto = {
  id: string;
  contenido: string | null;
  origen: string;
  direccion: string;
  tipo: string;
  created_at: string;
};

export type NotaDto = {
  id: string;
  tenant_id: string;
  lead_id: string;
  contenido: string;
  origen: string;
  created_by: string | null;
  created_at: string;
};

export type EventoCrmDto = {
  id: string;
  tenant_id: string;
  tipo: string;
  origen: string;
  lead_id: string | null;
  conversacion_id: string | null;
  datos: unknown;
  created_at: string;
};

export type LeadDto = {
  id: string;
  tenant_id: string;
  wa_cuenta_id: string;
  celular: string;
  nombre: string | null;
  equipo_descripcion: string | null;
  falla_descripcion: string | null;
  ubicacion: string | null;
  etapa_id: string;
  etapa_nombre: string | null;
  etapa_codigo: string | null;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  cliente_id: string | null;
  sucursal_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  activo: boolean;
  etiquetas: LeadEtiquetaItem[];
  ultimo_mensaje: MensajeItemDto | null;
  notas: NotaDto[];
  eventos: EventoCrmDto[];
  created_at: string;
  updated_at: string;
};

export type LeadListResponse = {
  success: boolean;
  data: LeadDto[];
  total: number;
};
export type LeadResponse = { success: boolean; data: LeadDto };

export type LeadsParams = {
  etapa_id?: string | undefined;
  vendedor_id?: string | undefined;
  utm_source?: string | undefined;
  activo?: boolean | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

// ─── Conversaciones ───────────────────────────────────────────────────────────

export type ConversacionDto = {
  id: string;
  tenant_id: string;
  wa_cuenta_id: string;
  lead_id: string;
  lead_nombre: string | null;
  lead_celular: string;
  lead_etapa_id: string | null;
  lead_etapa_nombre: string | null;
  celular: string;
  modo: "NICO" | "VENDEDOR";
  estado: "ACTIVA" | "CERRADA";
  ultimo_mensaje_at: string | null;
  mensajes_sin_leer: number;
  ultimo_mensaje: MensajeItemDto | null;
  created_at: string;
  updated_at: string;
};

export type ConversacionListResponse = {
  success: boolean;
  data: ConversacionDto[];
  total: number;
};
export type ConversacionResponse = { success: boolean; data: ConversacionDto };

export type ConversacionesParams = {
  modo?: "NICO" | "VENDEDOR" | undefined;
  estado?: "ACTIVA" | "CERRADA" | undefined;
  wa_cuenta_id?: string | undefined;
  vendedor_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export type MensajeDto = {
  id: string;
  tenant_id: string;
  conversacion_id: string;
  wa_message_id: string | null;
  direccion: "ENTRANTE" | "SALIENTE";
  origen: "CLIENTE" | "NICO" | "VENDEDOR" | "BOT" | "SISTEMA";
  tipo: "TEXTO" | "IMAGEN" | "AUDIO" | "VIDEO" | "DOCUMENTO" | "LINK" | "PLANTILLA";
  contenido: string | null;
  metadata: unknown;
  created_at: string;
};

export type MensajeListResponse = {
  success: boolean;
  data: MensajeDto[];
  total: number;
};

// ─── Plantillas ───────────────────────────────────────────────────────────────

export type PlantillaDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  contenido: string;
  variables: string[] | null;
  meta_template_name: string | null;
  estado_meta: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PlantillaListResponse = { success: boolean; data: PlantillaDto[] };

// ─── Bots ─────────────────────────────────────────────────────────────────────

export type BotDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  config: unknown;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type BotListResponse = { success: boolean; data: BotDto[] };
export type BotResponse = { success: boolean; data: BotDto };

// ─── Agentes ──────────────────────────────────────────────────────────────────

export type AgenteDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  canal: string;
  modelo_ia: string;
  tono: string | null;
  prompt_base: string | null;
  max_mensajes_contexto: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type AgenteListResponse = { success: boolean; data: AgenteDto[] };
export type AgenteResponse = { success: boolean; data: AgenteDto };

export type AccionAgenteDto = {
  id: string;
  agente_id: string;
  conversacion_id: string;
  lead_id: string;
  tool_name: string;
  tool_input: unknown;
  tool_output: unknown;
  exitoso: boolean;
  duracion_ms: number | null;
  error: string | null;
  created_at: string;
};

export type AccionAgenteListResponse = {
  success: boolean;
  data: AccionAgenteDto[];
  total: number;
};

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type EventoListResponse = {
  success: boolean;
  data: EventoCrmDto[];
  total: number;
};

export type EventosParams = {
  tipo?: string | undefined;
  origen?: string | undefined;
  lead_id?: string | undefined;
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

// ─── Mensajería interna ───────────────────────────────────────────────────────

export type MensajeInternoDto = {
  id: string;
  tenant_id: string;
  remitente_id: string;
  destinatario_id: string;
  contenido: string;
  leido: boolean;
  remitente_nombre: string | null;
  destinatario_nombre: string | null;
  created_at: string;
};

export type ConversacionInternaDto = {
  usuario_id: string;
  usuario_nombre: string | null;
  ultimo_mensaje: string | null;
  ultimo_at: string | null;
  no_leidos: number;
};

export type MensajeriaListResponse = {
  success: boolean;
  data: ConversacionInternaDto[];
};
export type MensajesInternosListResponse = {
  success: boolean;
  data: MensajeInternoDto[];
  total: number;
};
export type MensajeInternoResponse = { success: boolean; data: MensajeInternoDto };

// ─── Métricas ─────────────────────────────────────────────────────────────────

export type MetricasDashboardDto = {
  leads_activos: number;
  leads_por_etapa: Array<{ etapa_id: string; etapa_nombre: string; total: number }>;
  tasa_conversion: number;
  tiempo_promedio_respuesta_minutos: number;
  total_leads_periodo: number;
  leads_por_canal_utm: Array<{ canal: string; total: number }>;
};

export type MetricasNicoDto = {
  mensajes_procesados: number;
  tools_usadas: Array<{ tool: string; total: number }>;
  tasa_exito: number;
  tiempo_promedio_respuesta_ms: number;
  errores: Array<{ error: string; total: number }>;
};

export type MetricaLeadDto = {
  id: string;
  fecha: string;
  estado: string;
  convertido: boolean;
  dias_para_convertir: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
};

export type MetricasClientesDto = {
  ticket_promedio: number;
  frecuencia_compra: number;
  ultima_compra: string | null;
  riesgo_abandono: number;
};

export type MetricasVentasDto = {
  ingresos_brutos: number;
  total_transacciones: number;
  top_productos: Array<{ nombre: string; cantidad: number; ingresos: number }>;
  ingresos_por_canal: Array<{ canal: string; ingresos: number }>;
};

export type AudienciaDto = {
  id: string;
  nombre: string;
  criterio: string;
  total_contactos: number;
};

export type MetricasDashboardResponse = {
  success: boolean;
  data: MetricasDashboardDto;
};
export type MetricasNicoResponse = { success: boolean; data: MetricasNicoDto };
export type MetricasLeadsResponse = { success: boolean; data: MetricaLeadDto[] };
export type MetricasClientesResponse = { success: boolean; data: MetricasClientesDto };
export type MetricasVentasResponse = { success: boolean; data: MetricasVentasDto };
export type AudienciasResponse = { success: boolean; data: AudienciaDto[] };
