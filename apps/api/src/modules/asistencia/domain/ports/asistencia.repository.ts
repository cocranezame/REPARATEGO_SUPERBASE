import type {
  EventoAsistencia,
  HistorialDia,
  MarcadoResult,
  PanelHoyItem,
  PermisoAsistencia,
  PlanillaMensual,
  PortalEstado,
  PuntoControlWifi,
  TrabajadorConfig,
  TurnoTrabajo,
} from "../entities/asistencia.js";

// ─── Turnos ───────────────────────────────────────────────────────────────────

export type CreateTurnoData = {
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos?: number | undefined;
  dias_laborales: string[];
  activo?: boolean | undefined;
};

export type UpdateTurnoData = {
  nombre?: string | undefined;
  hora_inicio?: string | undefined;
  hora_fin?: string | undefined;
  tolerancia_minutos?: number | undefined;
  dias_laborales?: string[] | undefined;
  activo?: boolean | undefined;
};

// ─── Puntos control ───────────────────────────────────────────────────────────

export type CreatePuntoControlData = {
  sucursal_id: string;
  nombre: string;
  ssid: string;
  bssid?: string | null | undefined;
  latitud: number;
  longitud: number;
  radio_metros?: number | undefined;
  activo?: boolean | undefined;
};

export type UpdatePuntoControlData = {
  sucursal_id?: string | undefined;
  nombre?: string | undefined;
  ssid?: string | undefined;
  bssid?: string | null | undefined;
  latitud?: number | undefined;
  longitud?: number | undefined;
  radio_metros?: number | undefined;
  activo?: boolean | undefined;
};

// ─── Trabajadores ─────────────────────────────────────────────────────────────

export type CreateTrabajadorData = {
  usuario_id: string;
  turno_id: string;
  sucursal_id: string;
  tipo_contrato: string;
  sueldo_base: number;
  modalidad_pago: string;
  fecha_ingreso: string;
  fecha_cese?: string | undefined;
  factor_hora_extra?: number | undefined;
  descuento_x_tardanza: string;
  monto_descuento_min?: number | undefined;
  activo?: boolean | undefined;
};

export type UpdateTrabajadorData = {
  turno_id?: string | undefined;
  sucursal_id?: string | undefined;
  tipo_contrato?: string | undefined;
  sueldo_base?: number | undefined;
  modalidad_pago?: string | undefined;
  fecha_ingreso?: string | undefined;
  fecha_cese?: string | undefined;
  factor_hora_extra?: number | undefined;
  descuento_x_tardanza?: string | undefined;
  monto_descuento_min?: number | undefined;
  activo?: boolean | undefined;
};

// ─── Marcado ──────────────────────────────────────────────────────────────────

export type MarcarAsistenciaData = {
  ssid: string;
  bssid?: string | null | undefined;
  latitud: number;
  longitud: number;
  tipo_evento: string;
  dispositivo_info: Record<string, unknown>;
};

export type RegistroManualData = {
  usuario_id: string;
  tipo_evento: string;
  fecha_hora: string;
  observacion?: string | undefined;
};

// ─── Planilla ────────────────────────────────────────────────────────────────

export type CalcularPlanillaData = {
  usuario_id: string;
  periodo: string;
};

export type ListPlanillasParams = {
  periodo?: string | undefined;
  estado?: string | undefined;
  usuario_id?: string | undefined;
  page: number;
  limit: number;
};

export type ListPlanillasResult = {
  items: PlanillaMensual[];
  total: number;
};

// ─── Permisos ────────────────────────────────────────────────────────────────

export type CreatePermisoData = {
  usuario_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_permiso: string;
  motivo: string;
  archivo_url?: string | undefined;
  afecta_pago?: boolean | undefined;
};

export type ListPermisosParams = {
  usuario_id?: string | undefined;
  estado?: string | undefined;
  tipo_permiso?: string | undefined;
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  page: number;
  limit: number;
};

export type ListPermisosResult = {
  items: PermisoAsistencia[];
  total: number;
};

// ─── Portal trabajador ────────────────────────────────────────────────────────

export type LoginTrabajadorResult = {
  token: string;
  usuario_id: string;
  nombre: string;
};

// ─── Repository interface ─────────────────────────────────────────────────────

export interface IAsistenciaRepository {
  // Turnos
  listTurnos(tenantId: string): Promise<TurnoTrabajo[]>;
  findTurnoById(tenantId: string, id: string): Promise<TurnoTrabajo | null>;
  createTurno(tenantId: string, data: CreateTurnoData): Promise<TurnoTrabajo>;
  updateTurno(tenantId: string, id: string, data: UpdateTurnoData): Promise<TurnoTrabajo | null>;
  deleteTurno(tenantId: string, id: string): Promise<boolean>;

  // Puntos de control WiFi
  listPuntosControl(tenantId: string): Promise<PuntoControlWifi[]>;
  findPuntoControlById(tenantId: string, id: string): Promise<PuntoControlWifi | null>;
  createPuntoControl(tenantId: string, data: CreatePuntoControlData): Promise<PuntoControlWifi>;
  updatePuntoControl(
    tenantId: string,
    id: string,
    data: UpdatePuntoControlData
  ): Promise<PuntoControlWifi | null>;
  deletePuntoControl(tenantId: string, id: string): Promise<boolean>;

  // Trabajadores config
  listTrabajadores(tenantId: string): Promise<TrabajadorConfig[]>;
  findTrabajadorById(tenantId: string, id: string): Promise<TrabajadorConfig | null>;
  createTrabajador(tenantId: string, data: CreateTrabajadorData): Promise<TrabajadorConfig>;
  updateTrabajador(
    tenantId: string,
    id: string,
    data: UpdateTrabajadorData
  ): Promise<TrabajadorConfig | null>;
  deleteTrabajador(tenantId: string, id: string): Promise<boolean>;

  // Marcado
  marcar(tenantId: string, usuarioId: string, data: MarcarAsistenciaData): Promise<MarcadoResult>;
  getHistorial(tenantId: string, usuarioId: string, mes: string): Promise<HistorialDia[]>;
  registroManual(
    tenantId: string,
    adminId: string,
    data: RegistroManualData
  ): Promise<EventoAsistencia>;
  getPanelHoy(tenantId: string): Promise<PanelHoyItem[]>;

  // Planilla
  calcularPlanilla(
    tenantId: string,
    adminId: string,
    data: CalcularPlanillaData
  ): Promise<PlanillaMensual>;
  calcularPlanillaTodos(
    tenantId: string,
    adminId: string,
    periodo: string
  ): Promise<{ cantidad_calculados: number; errores: string[] }>;
  listPlanillas(tenantId: string, params: ListPlanillasParams): Promise<ListPlanillasResult>;
  findPlanillaDetalle(tenantId: string, id: string): Promise<PlanillaMensual | null>;
  aprobarPlanilla(tenantId: string, adminId: string, id: string): Promise<PlanillaMensual | null>;
  pagarPlanilla(tenantId: string, id: string, fechaPago: string): Promise<PlanillaMensual | null>;

  // Permisos
  listPermisos(tenantId: string, params: ListPermisosParams): Promise<ListPermisosResult>;
  findPermisoById(tenantId: string, id: string): Promise<PermisoAsistencia | null>;
  createPermiso(tenantId: string, data: CreatePermisoData): Promise<PermisoAsistencia>;
  aprobarPermiso(
    tenantId: string,
    adminId: string,
    id: string,
    afectaPago?: boolean | undefined
  ): Promise<PermisoAsistencia | null>;
  rechazarPermiso(
    tenantId: string,
    adminId: string,
    id: string,
    motivoRechazo?: string | undefined
  ): Promise<PermisoAsistencia | null>;

  // Reportes
  getReporteAsistenciaData(
    tenantId: string,
    periodo: string
  ): Promise<
    {
      trabajador: string;
      fecha: string;
      estado_dia: string;
      entrada: string | null;
      salida: string | null;
      tardanza: number;
      extra: number;
    }[]
  >;
  getReportePlanillaData(tenantId: string, periodo: string): Promise<PlanillaMensual[]>;

  // Portal trabajador
  loginTrabajador(
    tenantId: string,
    numeroDoc: string,
    password: string
  ): Promise<LoginTrabajadorResult>;
  getPortalEstado(tenantId: string, usuarioId: string): Promise<PortalEstado>;
  getPortalHistorial(tenantId: string, usuarioId: string, mes: string): Promise<HistorialDia[]>;
  getPortalPlanilla(
    tenantId: string,
    usuarioId: string,
    periodo: string
  ): Promise<PlanillaMensual | null>;
}
