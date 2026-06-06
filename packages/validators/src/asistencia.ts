import { z } from "zod";
import { uuidSchema } from "./common.js";

const diasLaboralesValues = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;

// ─── turno_trabajo ────────────────────────────────────────────────────────────

export const createTurnoTrabajoSchema = z.object({
  nombre: z.string().min(1).max(100),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  tolerancia_minutos: z.number().int().min(0).max(60).optional(),
  dias_laborales: z.array(z.enum(diasLaboralesValues)).min(1),
  activo: z.boolean().optional(),
});
export type CreateTurnoTrabajoInput = z.infer<typeof createTurnoTrabajoSchema>;

export const updateTurnoTrabajoSchema = createTurnoTrabajoSchema.partial();
export type UpdateTurnoTrabajoInput = z.infer<typeof updateTurnoTrabajoSchema>;

// ─── punto_control_wifi ───────────────────────────────────────────────────────

export const createPuntoControlWifiSchema = z.object({
  sucursal_id: uuidSchema,
  nombre: z.string().min(1).max(100),
  ssid: z.string().min(1).max(100),
  bssid: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, "Formato MAC inválido (ej: AA:BB:CC:DD:EE:FF)")
    .nullable()
    .optional(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  radio_metros: z.number().int().min(1).max(500).optional(),
  activo: z.boolean().optional(),
});
export type CreatePuntoControlWifiInput = z.infer<typeof createPuntoControlWifiSchema>;

export const updatePuntoControlWifiSchema = createPuntoControlWifiSchema.partial();
export type UpdatePuntoControlWifiInput = z.infer<typeof updatePuntoControlWifiSchema>;

// ─── trabajador_config ────────────────────────────────────────────────────────

export const createTrabajadorConfigSchema = z.object({
  usuario_id: uuidSchema,
  turno_id: uuidSchema,
  sucursal_id: uuidSchema,
  tipo_contrato: z.enum(["PLANILLA", "HONORARIOS", "PRACTICANTE"]),
  sueldo_base: z.number().positive(),
  modalidad_pago: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]),
  fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  fecha_cese: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .optional(),
  factor_hora_extra: z.number().min(1).max(3).optional(),
  descuento_x_tardanza: z.enum(["POR_MINUTO", "POR_RANGO", "SIN_DESCUENTO"]),
  monto_descuento_min: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});
export type CreateTrabajadorConfigInput = z.infer<typeof createTrabajadorConfigSchema>;

export const updateTrabajadorConfigSchema = createTrabajadorConfigSchema
  .omit({ usuario_id: true })
  .partial();
export type UpdateTrabajadorConfigInput = z.infer<typeof updateTrabajadorConfigSchema>;

// ─── marcado de asistencia (POST /asistencia/marcar) ──────────────────────────

export const marcarAsistenciaSchema = z.object({
  ssid: z.string().min(1).max(100),
  bssid: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, "Formato MAC inválido")
    .nullable()
    .optional(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  tipo_evento: z.enum(["ENTRADA", "SALIDA", "BREAK_INICIO", "BREAK_FIN"]),
});
export type MarcarAsistenciaInput = z.infer<typeof marcarAsistenciaSchema>;

// ─── registro manual (admin) ──────────────────────────────────────────────────

export const registroManualAsistenciaSchema = z.object({
  usuario_id: uuidSchema,
  tipo_evento: z.enum(["ENTRADA", "SALIDA", "BREAK_INICIO", "BREAK_FIN"]),
  fecha_hora: z.string().datetime({ offset: true }),
  observacion: z.string().max(500).optional(),
});
export type RegistroManualAsistenciaInput = z.infer<typeof registroManualAsistenciaSchema>;

// ─── calcular planilla individual ─────────────────────────────────────────────

export const calcularPlanillaSchema = z.object({
  usuario_id: uuidSchema,
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
});
export type CalcularPlanillaInput = z.infer<typeof calcularPlanillaSchema>;

// ─── calcular planilla todos ──────────────────────────────────────────────────

export const calcularPlanillaTodosSchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
});
export type CalcularPlanillaTodosInput = z.infer<typeof calcularPlanillaTodosSchema>;

// ─── permiso_asistencia ───────────────────────────────────────────────────────

export const createPermisoAsistenciaSchema = z.object({
  usuario_id: uuidSchema,
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  tipo_permiso: z.enum(["MEDICO", "PERSONAL", "VACACIONES", "CAPACITACION", "LICENCIA", "OTRO"]),
  motivo: z.string().min(1).max(1000),
  archivo_url: z.string().url().optional(),
  afecta_pago: z.boolean().optional(),
});
export type CreatePermisoAsistenciaInput = z.infer<typeof createPermisoAsistenciaSchema>;

export const aprobarPermisoSchema = z.object({
  estado: z.enum(["APROBADO", "RECHAZADO"]),
  afecta_pago: z.boolean().optional(),
});
export type AprobarPermisoInput = z.infer<typeof aprobarPermisoSchema>;

// ─── filtros de listado ───────────────────────────────────────────────────────

export const listAsistenciaParamsSchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM")
    .optional(),
  estado: z
    .enum(["VALIDO", "TARDANZA", "FUERA_DE_ZONA", "WIFI_NO_AUTORIZADO", "MANUAL", "ANULADO"])
    .optional(),
  usuario_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAsistenciaParamsInput = z.infer<typeof listAsistenciaParamsSchema>;

export const listPlanillaParamsSchema = z.object({
  periodo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM")
    .optional(),
  estado: z.enum(["BORRADOR", "CALCULADO", "APROBADO", "PAGADO"]).optional(),
  usuario_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPlanillaParamsInput = z.infer<typeof listPlanillaParamsSchema>;

export const listPermisosQuerySchema = z.object({
  usuario_id: uuidSchema.optional(),
  estado: z.enum(["PENDIENTE", "APROBADO", "RECHAZADO"]).optional(),
  tipo_permiso: z
    .enum(["MEDICO", "PERSONAL", "VACACIONES", "CAPACITACION", "LICENCIA", "OTRO"])
    .optional(),
  fecha_desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .optional(),
  fecha_hasta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPermisosQueryInput = z.infer<typeof listPermisosQuerySchema>;

export const pagarPlanillaSchema = z.object({
  fecha_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
});
export type PagarPlanillaInput = z.infer<typeof pagarPlanillaSchema>;

export const rechazarPermisoSchema = z.object({
  motivo_rechazo: z.string().max(500).optional(),
});
export type RechazarPermisoInput = z.infer<typeof rechazarPermisoSchema>;

export const reporteQuerySchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  formato: z.enum(["xlsx", "pdf"]),
});
export type ReporteQueryInput = z.infer<typeof reporteQuerySchema>;

export const portalTrabajadorLoginSchema = z.object({
  numero_doc: z.string().min(1),
  password: z.string().min(1),
});
export type PortalTrabajadorLoginInput = z.infer<typeof portalTrabajadorLoginSchema>;

export const portalTrabajadorHistorialQuerySchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
});
export type PortalTrabajadorHistorialQueryInput = z.infer<
  typeof portalTrabajadorHistorialQuerySchema
>;

export const portalTrabajadorPlanillaQuerySchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
});
export type PortalTrabajadorPlanillaQueryInput = z.infer<
  typeof portalTrabajadorPlanillaQuerySchema
>;
