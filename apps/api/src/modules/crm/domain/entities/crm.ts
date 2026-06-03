export type WaCuenta = {
  id: string;
  tenant_id: string;
  negocio_nombre: string;
  phone_number_id: string;
  waba_id: string;
  webhook_verify_token: string;
  nombre: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CrmEtapa = {
  id: string;
  tenant_id: string;
  nombre: string;
  codigo: string;
  orden: number;
  objetivo: string | null;
  operador: string;
  bot_id: string | null;
  bot_nombre: string | null;
  tiempo_espera_horas: number | null;
  max_intentos_recordatorio: number | null;
  color: string | null;
  activo: boolean;
  leads_count: number;
  created_at: Date;
  updated_at: Date;
};

export type CrmEtapaTransicion = {
  id: string;
  tenant_id: string;
  etapa_origen_id: string;
  etapa_destino_id: string;
  destino_nombre: string;
  destino_codigo: string;
  created_at: Date;
};

export type CrmEtiqueta = {
  id: string;
  tenant_id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  descripcion: string | null;
  activo: boolean;
  created_at: Date;
};

export type CrmLeadEtiquetaItem = {
  etiqueta_id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  asignado_por: string;
  created_at: Date;
};

export type CrmMensajeItem = {
  id: string;
  contenido: string | null;
  origen: string;
  direccion: string;
  tipo: string;
  created_at: Date;
};

export type CrmNota = {
  id: string;
  tenant_id: string;
  lead_id: string;
  contenido: string;
  origen: string;
  created_by: string | null;
  created_at: Date;
};

export type CrmEvento = {
  id: string;
  tenant_id: string;
  tipo: string;
  origen: string;
  lead_id: string | null;
  conversacion_id: string | null;
  datos: unknown;
  created_at: Date;
};

export type CrmLead = {
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
  etiquetas: CrmLeadEtiquetaItem[];
  ultimo_mensaje: CrmMensajeItem | null;
  notas: CrmNota[];
  eventos: CrmEvento[];
  created_at: Date;
  updated_at: Date;
};

export type CrmMensaje = {
  id: string;
  tenant_id: string;
  conversacion_id: string;
  wa_message_id: string | null;
  direccion: string;
  origen: string;
  tipo: string;
  contenido: string | null;
  metadata: unknown;
  created_at: Date;
};

export type CrmConversacion = {
  id: string;
  tenant_id: string;
  wa_cuenta_id: string;
  lead_id: string;
  lead_nombre: string | null;
  lead_celular: string;
  lead_etapa_id: string | null;
  lead_etapa_nombre: string | null;
  celular: string;
  modo: string;
  estado: string;
  ultimo_mensaje_at: Date | null;
  mensajes_sin_leer: number;
  ultimo_mensaje: CrmMensajeItem | null;
  created_at: Date;
  updated_at: Date;
};
