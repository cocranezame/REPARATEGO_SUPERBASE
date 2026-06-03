import type {
  CrmConversacion,
  CrmEtapa,
  CrmEtapaTransicion,
  CrmEtiqueta,
  CrmLead,
  CrmMensaje,
  CrmNota,
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
}
