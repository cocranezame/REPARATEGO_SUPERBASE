export type DiasLaborales = "LUN" | "MAR" | "MIE" | "JUE" | "VIE" | "SAB" | "DOM";

export type TurnoDto = {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos: number;
  dias_laborales: DiasLaborales[];
  activo: boolean;
};

export type TurnoListResponse = { success: true; data: TurnoDto[]; meta: PaginationMeta };
export type TurnoResponse = { success: true; data: TurnoDto };

export type PuntoControlDto = {
  id: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  nombre: string;
  ssid: string;
  bssid: string | null;
  latitud: number;
  longitud: number;
  radio_metros: number;
  activo: boolean;
};

export type PuntoControlListResponse = {
  success: true;
  data: PuntoControlDto[];
  meta: PaginationMeta;
};
export type PuntoControlResponse = { success: true; data: PuntoControlDto };

export type TrabajadorConfigDto = {
  id: string;
  usuario_id: string;
  usuario_nombre?: string;
  usuario_apellidos?: string;
  usuario_rol?: string;
  turno_id: string;
  turno_nombre?: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  tipo_contrato: "PLANILLA" | "HONORARIOS" | "PRACTICANTE";
  sueldo_base: number;
  modalidad_pago: "MENSUAL" | "QUINCENAL" | "SEMANAL";
  fecha_ingreso: string;
  fecha_cese?: string | null;
  factor_hora_extra: number;
  descuento_x_tardanza: "POR_MINUTO" | "POR_RANGO" | "SIN_DESCUENTO";
  monto_descuento_min: number | null;
  activo: boolean;
};

export type TrabajadorConfigListResponse = {
  success: true;
  data: TrabajadorConfigDto[];
  meta: PaginationMeta;
};
export type TrabajadorConfigResponse = { success: true; data: TrabajadorConfigDto };

export type AsistenciaHoyRegistroDto = {
  usuario_id: string;
  nombre: string;
  turno_nombre: string;
  hora_inicio_prog: string;
  hora_fin_prog: string;
  hora_entrada_real: string | null;
  hora_salida_real: string | null;
  estado: "PRESENTE" | "TARDANZA" | "FALTA" | "PERMISO" | "DESCANSO";
  minutos_tardanza: number;
  observacion?: string | null;
};

export type AsistenciaHoyData = {
  fecha: string;
  presentes: number;
  tardanzas: number;
  faltas: number;
  con_permiso: number;
  registros: AsistenciaHoyRegistroDto[];
};

export type AsistenciaHoyResponse = { success: true; data: AsistenciaHoyData };

export type PlanillaDto = {
  id: string;
  usuario_id: string;
  nombre?: string;
  periodo: string;
  turno_nombre?: string;
  tipo_contrato?: string;
  dias_laborables: number;
  dias_asistidos: number;
  dias_falta: number;
  tardanzas_min: number;
  horas_extra: number;
  sueldo_base: number;
  descuentos: number;
  bonificaciones: number;
  total_bruto: number;
  total_neto: number;
  estado: "BORRADOR" | "CALCULADO" | "APROBADO" | "PAGADO";
  fecha_pago?: string | null;
};

export type PlanillaListResponse = { success: true; data: PlanillaDto[]; meta: PaginationMeta };
export type PlanillaResponse = { success: true; data: PlanillaDto };

export type PlanillaDetalleItemDto = {
  id: string;
  fecha: string;
  dia_semana: string;
  estado_dia: "ASISTIO" | "FALTA" | "TARDANZA" | "PERMISO" | "DESCANSO" | "FERIADO" | "NO_LABORAL";
  hora_entrada_prog?: string | null;
  hora_entrada_real?: string | null;
  hora_salida_prog?: string | null;
  hora_salida_real?: string | null;
  minutos_tardanza: number;
  minutos_extra: number;
  descuento_dia: number;
  observacion?: string | null;
};

export type PlanillaDetalleData = {
  planilla: PlanillaDto;
  detalle: PlanillaDetalleItemDto[];
};

export type PlanillaDetalleResponse = { success: true; data: PlanillaDetalleData };

export type PermisoDto = {
  id: string;
  usuario_id: string;
  nombre?: string;
  tipo_permiso: "MEDICO" | "PERSONAL" | "VACACIONES" | "CAPACITACION" | "LICENCIA" | "OTRO";
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  archivo_url?: string | null;
  afecta_pago: boolean;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  aprobado_por_nombre?: string | null;
  aprobado_at?: string | null;
  motivo_rechazo?: string | null;
};

export type PermisoListResponse = { success: true; data: PermisoDto[]; meta: PaginationMeta };
export type PermisoResponse = { success: true; data: PermisoDto };

export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CalcularTodosResponse = {
  success: true;
  data: { calculados: number; periodo: string };
};

export type AsistenciaHoyParams = {
  turno_id?: string;
  sucursal_id?: string;
};
