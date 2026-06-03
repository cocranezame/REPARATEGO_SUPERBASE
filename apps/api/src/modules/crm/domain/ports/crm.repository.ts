import type {
  Audiencia,
  CrmAccionAgenteItem,
  CrmAgente,
  CrmBot,
  CrmConversacion,
  CrmConversacionInterna,
  CrmEtapa,
  CrmEtapaTransicion,
  CrmEtiqueta,
  CrmLead,
  CrmMensaje,
  CrmMensajeInterno,
  CrmNota,
  CrmPlantilla,
  MetricaLead,
  MetricasClientes,
  MetricasDashboard,
  MetricasNico,
  MetricasVentas,
  WaCuenta,
} from "../entities/crm.js";

export type CreateWaCuentaData = {
  negocio_nombre: string;
  phone_number_id: string;
  waba_id: string;
  access_token: string;
  webhook_verify_token: string;
  nombre?: string | undefined;
};

export type UpdateWaCuentaData = {
  negocio_nombre?: string | undefined;
  access_token?: string | undefined;
  webhook_verify_token?: string | undefined;
  nombre?: string | undefined;
  activo?: boolean | undefined;
};

export type CreateEtapaData = {
  nombre: string;
  codigo: string;
  orden: number;
  objetivo?: string | undefined;
  operador: string;
  bot_id?: string | undefined;
  tiempo_espera_horas?: number | undefined;
  max_intentos_recordatorio?: number | undefined;
  color?: string | undefined;
};

export type UpdateEtapaData = {
  nombre?: string | undefined;
  orden?: number | undefined;
  objetivo?: string | undefined;
  operador?: string | undefined;
  bot_id?: string | undefined;
  tiempo_espera_horas?: number | undefined;
  max_intentos_recordatorio?: number | undefined;
  color?: string | undefined;
  activo?: boolean | undefined;
};

export type CreateEtiquetaData = {
  nombre: string;
  codigo: string;
  grupo: string;
  descripcion?: string | undefined;
};

export type UpdateEtiquetaData = {
  nombre?: string | undefined;
  grupo?: string | undefined;
  descripcion?: string | undefined;
  activo?: boolean | undefined;
};

export type ListLeadsParams = {
  etapa_id?: string | undefined;
  vendedor_id?: string | undefined;
  cliente_id?: string | undefined;
  sucursal_id?: string | undefined;
  utm_source?: string | undefined;
  utm_campaign?: string | undefined;
  utm_medium?: string | undefined;
  activo?: boolean | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListConversacionesParams = {
  modo?: string | undefined;
  estado?: string | undefined;
  wa_cuenta_id?: string | undefined;
  vendedor_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListMensajesParams = {
  antes_de?: string | undefined;
  page: number;
  pageSize: number;
};

export type GuardarMensajeData = {
  conversacion_id: string;
  wa_message_id?: string | undefined;
  direccion: string;
  origen: string;
  tipo?: string | undefined;
  contenido: string;
  metadata?: unknown;
};

export interface ICrmRepository {
  listWaCuentas(tenantId: string): Promise<WaCuenta[]>;
  createWaCuenta(tenantId: string, data: CreateWaCuentaData, userId: string): Promise<WaCuenta>;
  updateWaCuenta(tenantId: string, id: string, data: UpdateWaCuentaData): Promise<WaCuenta | null>;
  deleteWaCuenta(tenantId: string, id: string): Promise<boolean>;
  getWaCuentaWithToken(
    tenantId: string,
    id: string
  ): Promise<{ phone_number_id: string; access_token: string } | null>;

  listEtapas(tenantId: string): Promise<CrmEtapa[]>;
  createEtapa(tenantId: string, data: CreateEtapaData): Promise<CrmEtapa>;
  updateEtapa(tenantId: string, id: string, data: UpdateEtapaData): Promise<CrmEtapa | null>;
  deleteEtapa(tenantId: string, id: string): Promise<boolean>;

  listTransiciones(tenantId: string, etapaOrigenId: string): Promise<CrmEtapaTransicion[]>;
  createTransicion(
    tenantId: string,
    etapaOrigenId: string,
    etapaDestinoId: string
  ): Promise<CrmEtapaTransicion>;
  deleteTransicion(
    tenantId: string,
    etapaOrigenId: string,
    etapaDestinoId: string
  ): Promise<boolean>;

  listEtiquetas(tenantId: string): Promise<CrmEtiqueta[]>;
  createEtiqueta(tenantId: string, data: CreateEtiquetaData): Promise<CrmEtiqueta>;
  updateEtiqueta(
    tenantId: string,
    id: string,
    data: UpdateEtiquetaData
  ): Promise<CrmEtiqueta | null>;
  deleteEtiqueta(tenantId: string, id: string): Promise<boolean>;

  listLeads(
    tenantId: string,
    params: ListLeadsParams
  ): Promise<{ items: CrmLead[]; total: number }>;
  findLeadById(tenantId: string, id: string): Promise<CrmLead | null>;
  moverEtapaLead(
    tenantId: string,
    id: string,
    etapaDestinoId: string,
    userId: string
  ): Promise<CrmLead>;
  asignarEtiquetas(
    tenantId: string,
    id: string,
    etiquetaIds: string[],
    asignadoPor: string
  ): Promise<CrmLead>;
  asignarVendedor(tenantId: string, id: string, vendedorId: string): Promise<CrmLead>;
  roundRobinVendedor(tenantId: string, sucursalId?: string | undefined): Promise<string | null>;
  createNota(tenantId: string, leadId: string, contenido: string, userId: string): Promise<CrmNota>;

  listConversaciones(
    tenantId: string,
    params: ListConversacionesParams
  ): Promise<{ items: CrmConversacion[]; total: number }>;
  findConversacionById(tenantId: string, id: string): Promise<CrmConversacion | null>;
  listMensajes(
    tenantId: string,
    conversacionId: string,
    params: ListMensajesParams
  ): Promise<{ items: CrmMensaje[]; total: number }>;
  guardarMensaje(tenantId: string, data: GuardarMensajeData): Promise<CrmMensaje>;
  cambiarModo(tenantId: string, id: string, modo: string): Promise<CrmConversacion | null>;
  asignarVendedorConv(
    tenantId: string,
    id: string,
    vendedorId: string
  ): Promise<CrmConversacion | null>;
  getUltimoMensajeEntrante(tenantId: string, conversacionId: string): Promise<Date | null>;

  // Webhook
  findWaCuentaByVerifyToken(verifyToken: string): Promise<WaCuenta | null>;
  findWaCuentaByPhoneNumberId(phoneNumberId: string): Promise<WaCuenta | null>;
  existsMensajeByWaId(tenantId: string, waMessageId: string): Promise<boolean>;
  findConversacionActivaByCelular(
    tenantId: string,
    waCuentaId: string,
    celular: string
  ): Promise<CrmConversacion | null>;
  crearConversacionConLead(tenantId: string, data: CrearConversacionData): Promise<CrmConversacion>;

  // Agent
  findLeadForAgent(tenantId: string, leadId: string): Promise<LeadForAgent | null>;
  findAgenteActivo(tenantId: string, canal: string): Promise<AgenteActivo | null>;
  listMensajesParaContexto(
    tenantId: string,
    conversacionId: string,
    limit: number
  ): Promise<MensajeContexto[]>;
  logAccionAgente(tenantId: string, data: LogAccionData): Promise<void>;

  // Tools
  guardarDatoLead(tenantId: string, leadId: string, campo: string, valor: string): Promise<void>;
  asignarEtiquetaNico(tenantId: string, leadId: string, codigoEtiqueta: string): Promise<void>;
  findEtapaByCodigo(
    tenantId: string,
    codigo: string
  ): Promise<{ id: string; nombre: string; codigo: string } | null>;
  buscarClientePorDocOrCelular(
    tenantId: string,
    numeroDoc?: string | undefined,
    celular?: string | undefined
  ): Promise<ClienteResult | null>;
  crearClienteNico(tenantId: string, data: CrearClienteData): Promise<ClienteResult>;
  crearServicioNico(tenantId: string, data: CrearServicioData): Promise<OrdenServicioResult>;
  derivarVendedorNico(
    tenantId: string,
    leadId: string,
    conversacionId: string,
    motivo: string
  ): Promise<{ vendedor_id: string | null; vendedor_nombre: string | null }>;
  findSucursalById(
    tenantId: string,
    sucursalId: string
  ): Promise<{ id: string; nombre: string; direccion: string | null } | null>;
  consultarRepuestos(
    tenantId: string,
    busqueda: string,
    categoriaId?: string | undefined
  ): Promise<RepuestoResult[]>;

  // Plantillas
  listPlantillas(tenantId: string): Promise<CrmPlantilla[]>;
  findPlantillaById(tenantId: string, id: string): Promise<CrmPlantilla | null>;
  createPlantilla(
    tenantId: string,
    data: CreatePlantillaData,
    userId: string
  ): Promise<CrmPlantilla>;
  updatePlantilla(
    tenantId: string,
    id: string,
    data: UpdatePlantillaData
  ): Promise<CrmPlantilla | null>;

  // Bots
  listBots(tenantId: string): Promise<CrmBot[]>;
  findBotById(tenantId: string, id: string): Promise<CrmBot | null>;
  updateBot(tenantId: string, id: string, data: UpdateBotData): Promise<CrmBot | null>;

  // Agentes
  listAgentes(tenantId: string): Promise<CrmAgente[]>;
  updateAgente(tenantId: string, id: string, data: UpdateAgenteData): Promise<CrmAgente | null>;
  listAccionesAgente(
    tenantId: string,
    agenteId: string,
    params: ListAccionesAgenteParams
  ): Promise<{ items: CrmAccionAgenteItem[]; total: number }>;

  // Eventos
  listEventos(
    tenantId: string,
    params: ListEventosParams
  ): Promise<{ items: import("../entities/crm.js").CrmEvento[]; total: number }>;

  // Mensajería interna
  listMensajeriaConversaciones(
    tenantId: string,
    userId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: CrmConversacionInterna[]; total: number }>;
  listMensajesInternos(
    tenantId: string,
    userId: string,
    otroUsuarioId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: CrmMensajeInterno[]; total: number }>;
  createMensajeInterno(
    tenantId: string,
    remitenteId: string,
    data: CreateMensajeInternoData
  ): Promise<CrmMensajeInterno>;
  marcarMensajeLeidoInterno(
    tenantId: string,
    mensajeId: string,
    destinatarioId: string
  ): Promise<boolean>;

  // Métricas
  metricasDashboard(tenantId: string, from: string, to: string): Promise<MetricasDashboard>;
  metricasNico(tenantId: string, from: string, to: string): Promise<MetricasNico>;
  metricasLeads(tenantId: string, from: string, to: string): Promise<MetricaLead[]>;
  metricasClientes(tenantId: string, from: string, to: string): Promise<MetricasClientes>;
  metricasVentas(tenantId: string, from: string, to: string): Promise<MetricasVentas>;
  listAudiencias(tenantId: string): Promise<Audiencia[]>;

  // Bot engine helpers
  getLastBotMessage(tenantId: string, conversacionId: string): Promise<LastBotMessage | null>;
  consultarServiciosCliente(tenantId: string, clienteId: string): Promise<ServicioClienteResult[]>;
  moverEtapaDesdeBot(tenantId: string, leadId: string, etapaCodigo: string): Promise<void>;
  getBotesRecordatorio(tenantId: string): Promise<
    Array<{
      lead_id: string;
      conversacion_id: string;
      tiempo_espera_horas: number;
      max_intentos: number;
      wa_cuenta_id: string;
      celular: string;
    }>
  >;
  countEventosBotLead(tenantId: string, leadId: string): Promise<number>;
  registrarEventoBot(
    tenantId: string,
    leadId: string,
    conversacionId: string,
    datos: unknown
  ): Promise<void>;
}

// ─── Nuevos tipos para webhook + agent ─────────────────────────────────────────

export type CrearConversacionData = {
  waCuentaId: string;
  celular: string;
  nombre?: string | undefined;
};

export type LeadForAgent = {
  id: string;
  celular: string;
  nombre: string | null;
  equipo_descripcion: string | null;
  falla_descripcion: string | null;
  ubicacion: string | null;
  etapa_id: string;
  etapa_codigo: string;
  etapa_nombre: string;
  etapa_objetivo: string | null;
  etapa_operador: string;
  etapa_bot_id: string | null;
  vendedor_id: string | null;
  cliente_id: string | null;
  sucursal_id: string | null;
};

export type AgenteActivo = {
  id: string;
  nombre: string;
  modelo_ia: string;
  tono: string | null;
  prompt_base: string | null;
  max_mensajes_contexto: number;
};

export type MensajeContexto = {
  id: string;
  direccion: string;
  origen: string;
  contenido: string | null;
  created_at: Date;
};

export type LogAccionData = {
  agente_id: string;
  conversacion_id: string;
  lead_id: string;
  tool_name: string;
  tool_input: unknown;
  tool_output: unknown;
  exitoso: boolean;
  duracion_ms: number;
  error?: string | undefined;
};

export type ClienteResult = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
  numero_documento: string;
  tipo_documento: string;
  telefono: string | null;
};

export type CrearClienteData = {
  nombre: string;
  numero_doc: string;
  celular: string;
  tipo_documento?: string | undefined;
  leadId?: string | undefined;
};

export type CrearServicioData = {
  leadId: string;
  clienteId: string;
  falla_ingreso: string;
  categoria_id?: string | undefined;
  canal?: string | undefined;
};

export type OrdenServicioResult = {
  id: string;
  codigo: string;
  estado: string;
};

export type RepuestoResult = {
  id: string;
  nombre: string;
  codigo: string;
  stock_disponible: number;
  precio_venta: string;
};

// ─── Nuevos tipos para grupos 1-8 ─────────────────────────────────────────────

export type CreatePlantillaData = {
  nombre: string;
  contenido: string;
  variables?: string[] | undefined;
  meta_template_name?: string | undefined;
};

export type UpdatePlantillaData = {
  nombre?: string | undefined;
  contenido?: string | undefined;
  variables?: string[] | undefined;
  meta_template_name?: string | undefined;
  estado_meta?: string | undefined;
};

export type UpdateBotData = {
  activo?: boolean | undefined;
  config?: unknown | undefined;
  nombre?: string | undefined;
};

export type UpdateAgenteData = {
  tono?: string | undefined;
  prompt_base?: string | undefined;
  max_mensajes_contexto?: number | undefined;
  activo?: boolean | undefined;
};

export type ListAccionesAgenteParams = {
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  tool_name?: string | undefined;
  exitoso?: boolean | undefined;
  page: number;
  pageSize: number;
};

export type ListEventosParams = {
  tipo?: string | undefined;
  origen?: string | undefined;
  lead_id?: string | undefined;
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  page: number;
  pageSize: number;
};

export type CreateMensajeInternoData = {
  destinatario_id: string;
  contenido: string;
};

export type ServicioClienteResult = {
  codigo: string;
  estado: string;
  falla_ingreso: string;
  created_at: Date;
};

export type LastBotMessage = {
  id: string;
  metadata: unknown;
  created_at: Date;
};
