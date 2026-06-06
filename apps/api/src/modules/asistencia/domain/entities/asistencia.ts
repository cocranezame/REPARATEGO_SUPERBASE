export type TurnoTrabajo = {
  id: string;
  tenant_id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos: number;
  dias_laborales: string[];
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PuntoControlWifi = {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  sucursal_nombre?: string | undefined;
  nombre: string;
  ssid: string;
  bssid: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TrabajadorConfig = {
  id: string;
  tenant_id: string;
  usuario_id: string;
  usuario_nombres?: string | undefined;
  usuario_apellidos?: string | undefined;
  usuario_rol?: string | undefined;
  turno_id: string;
  turno_nombre?: string | undefined;
  turno_hora_inicio?: string | undefined;
  turno_hora_fin?: string | undefined;
  turno_dias_laborales?: string[] | undefined;
  turno_tolerancia?: number | undefined;
  sucursal_id: string;
  tipo_contrato: string;
  sueldo_base: number;
  modalidad_pago: string;
  moneda: string;
  fecha_ingreso: string;
  fecha_cese?: string | undefined;
  factor_hora_extra: number;
  descuento_x_tardanza: string;
  monto_descuento_min: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type EventoAsistencia = {
  id: string;
  tenant_id: string;
  usuario_id: string;
  turno_id: string;
  tipo_evento: string;
  fecha_hora: Date;
  fecha: string;
  ssid_detectado?: string | undefined;
  bssid_detectado?: string | undefined;
  latitud_marcado?: number | undefined;
  longitud_marcado?: number | undefined;
  distancia_metros?: number | undefined;
  punto_control_id?: string | undefined;
  validacion_wifi: boolean;
  validacion_gps: boolean;
  validacion_aprobada: boolean;
  estado: string;
  minutos_tardanza: number;
  es_hora_extra: boolean;
  minutos_extra: number;
  dispositivo_info?: Record<string, unknown> | undefined;
  registrado_por?: string | undefined;
  observacion?: string | undefined;
  created_at: Date;
  updated_at: Date;
};

export type MarcadoResult = {
  aprobado: boolean;
  estado: string;
  minutos_tardanza: number;
  minutos_extra: number;
  distancia_metros: number;
  mensaje: string;
  validacion_wifi: boolean;
  validacion_gps: boolean;
  evento: EventoAsistencia;
};

export type PanelHoyItem = {
  usuario_id: string;
  usuario_nombres: string;
  usuario_apellidos: string;
  turno_id: string;
  turno_nombre: string;
  hora_entrada_prog: string;
  hora_salida_prog: string;
  hora_entrada_real?: Date | undefined;
  hora_salida_real?: Date | undefined;
  estado: "PRESENTE" | "TARDANZA" | "FALTA" | "PERMISO";
  minutos_tardanza: number;
};

export type PermisoAsistencia = {
  id: string;
  tenant_id: string;
  usuario_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_permiso: string;
  motivo: string;
  archivo_url?: string | undefined;
  estado: string;
  aprobado_por?: string | undefined;
  afecta_pago: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PlanillaDetalle = {
  id: string;
  tenant_id: string;
  planilla_id: string;
  usuario_id: string;
  fecha: string;
  estado_dia: string;
  hora_entrada_real?: Date | undefined;
  hora_salida_real?: Date | undefined;
  hora_entrada_prog: string;
  hora_salida_prog: string;
  minutos_tardanza: number;
  minutos_extra: number;
  descuento_dia: number;
  observacion?: string | undefined;
  created_at: Date;
  updated_at: Date;
};

export type PlanillaMensual = {
  id: string;
  tenant_id: string;
  usuario_id: string;
  usuario_nombres?: string | undefined;
  usuario_apellidos?: string | undefined;
  periodo: string;
  dias_laborables: number;
  dias_asistidos: number;
  dias_falta: number;
  dias_falta_justificada: number;
  dias_vacaciones: number;
  minutos_tardanza_total: number;
  minutos_extra_total: number;
  horas_extra_total: number;
  sueldo_base: number;
  valor_dia: number;
  valor_hora: number;
  descuento_tardanzas: number;
  descuento_faltas: number;
  monto_horas_extra: number;
  bonificaciones: number;
  otros_descuentos: number;
  total_bruto: number;
  total_neto: number;
  estado: string;
  aprobado_por?: string | undefined;
  fecha_aprobacion?: Date | undefined;
  fecha_pago?: string | undefined;
  observaciones?: string | undefined;
  detalles?: PlanillaDetalle[] | undefined;
  created_at: Date;
  updated_at: Date;
};

export type PortalEstado = {
  turno: TurnoTrabajo | null;
  hora_entrada_prog: string | null;
  hora_salida_prog: string | null;
  ultimo_evento: { tipo: string; hora: Date } | null;
  puede_marcar_entrada: boolean;
  puede_marcar_salida: boolean;
};

export type HistorialDia = {
  fecha: string;
  eventos: Pick<
    EventoAsistencia,
    "id" | "tipo_evento" | "fecha_hora" | "estado" | "minutos_tardanza" | "minutos_extra"
  >[];
  estado_dia: string;
};
