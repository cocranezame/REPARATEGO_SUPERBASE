import type { DbClient } from "@kallpasoft/db";
import {
  planillaDetalle as detalleTable,
  eventoAsistencia as eventoTable,
  permisoAsistencia as permisoTable,
  planillaMensual as planillaTable,
  puntoControlWifi as puntoTable,
  sucursal as sucursalTable,
  trabajadorConfig as trabajadorTable,
  turnoTrabajo as turnoTable,
  usuario as usuarioTable,
} from "@kallpasoft/db";
import { dentroDelRadio, haversine } from "@kallpasoft/shared";
import bcrypt from "bcryptjs";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { signPortalTrabajadorToken } from "../../../../lib/portal-trabajador-jwt.js";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type {
  EventoAsistencia,
  HistorialDia,
  MarcadoResult,
  PanelHoyItem,
  PermisoAsistencia,
  PlanillaDetalle,
  PlanillaMensual,
  PortalEstado,
  PuntoControlWifi,
  TrabajadorConfig,
  TurnoTrabajo,
} from "../../domain/entities/asistencia.js";
import type {
  CalcularPlanillaData,
  CreatePermisoData,
  CreatePuntoControlData,
  CreateTrabajadorData,
  CreateTurnoData,
  IAsistenciaRepository,
  ListPermisosParams,
  ListPermisosResult,
  ListPlanillasParams,
  ListPlanillasResult,
  LoginTrabajadorResult,
  MarcarAsistenciaData,
  RegistroManualData,
  UpdatePuntoControlData,
  UpdateTrabajadorData,
  UpdateTurnoData,
} from "../../domain/ports/asistencia.repository.js";

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"] as const;

function getDayAbbr(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!)).getUTCDay();
  return DAY_ABBR[dow]!;
}

function toLimaMinutes(date: Date): number {
  const limaDate = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return limaDate.getUTCHours() * 60 + limaDate.getUTCMinutes();
}

function turnoMinutes(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  return parts[0]! * 60 + parts[1]!;
}

function daysInPeriod(periodo: string): string[] {
  const parts = periodo.split("-").map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${periodo}-${d}`;
  });
}

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

function mapTurno(row: typeof turnoTable.$inferSelect): TurnoTrabajo {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    nombre: row.nombre,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    tolerancia_minutos: row.tolerancia_minutos,
    dias_laborales: row.dias_laborales,
    activo: row.activo,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPunto(
  row: typeof puntoTable.$inferSelect,
  sucursalNombre?: string | null
): PuntoControlWifi {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    sucursal_id: row.sucursal_id,
    sucursal_nombre: sucursalNombre ?? undefined,
    nombre: row.nombre,
    ssid: row.ssid,
    bssid: row.bssid,
    latitud: toNum(row.latitud),
    longitud: toNum(row.longitud),
    radio_metros: row.radio_metros,
    activo: row.activo,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

type TrabajadorRow = {
  t: typeof trabajadorTable.$inferSelect;
  u: typeof usuarioTable.$inferSelect | null;
  turno: typeof turnoTable.$inferSelect | null;
};

function mapTrabajador(r: TrabajadorRow): TrabajadorConfig {
  return {
    id: r.t.id,
    tenant_id: r.t.tenant_id,
    usuario_id: r.t.usuario_id,
    usuario_nombres: r.u?.nombres ?? undefined,
    usuario_apellidos: r.u?.apellidos ?? undefined,
    usuario_rol: r.u?.rol ?? undefined,
    turno_id: r.t.turno_id,
    turno_nombre: r.turno?.nombre ?? undefined,
    turno_hora_inicio: r.turno?.hora_inicio ?? undefined,
    turno_hora_fin: r.turno?.hora_fin ?? undefined,
    turno_dias_laborales: r.turno?.dias_laborales ?? undefined,
    turno_tolerancia: r.turno?.tolerancia_minutos ?? undefined,
    sucursal_id: r.t.sucursal_id,
    tipo_contrato: r.t.tipo_contrato,
    sueldo_base: toNum(r.t.sueldo_base),
    modalidad_pago: r.t.modalidad_pago,
    moneda: r.t.moneda,
    fecha_ingreso: r.t.fecha_ingreso,
    fecha_cese: r.t.fecha_cese ?? undefined,
    factor_hora_extra: toNum(r.t.factor_hora_extra),
    descuento_x_tardanza: r.t.descuento_x_tardanza,
    monto_descuento_min: toNum(r.t.monto_descuento_min),
    activo: r.t.activo,
    created_at: r.t.created_at,
    updated_at: r.t.updated_at,
  };
}

function mapEvento(row: typeof eventoTable.$inferSelect): EventoAsistencia {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    usuario_id: row.usuario_id,
    turno_id: row.turno_id,
    tipo_evento: row.tipo_evento,
    fecha_hora: row.fecha_hora,
    fecha: row.fecha,
    ssid_detectado: row.ssid_detectado ?? undefined,
    bssid_detectado: row.bssid_detectado ?? undefined,
    latitud_marcado: row.latitud_marcado ? toNum(row.latitud_marcado) : undefined,
    longitud_marcado: row.longitud_marcado ? toNum(row.longitud_marcado) : undefined,
    distancia_metros: row.distancia_metros ?? undefined,
    punto_control_id: row.punto_control_id ?? undefined,
    validacion_wifi: row.validacion_wifi,
    validacion_gps: row.validacion_gps,
    validacion_aprobada: row.validacion_aprobada,
    estado: row.estado,
    minutos_tardanza: row.minutos_tardanza,
    es_hora_extra: row.es_hora_extra,
    minutos_extra: row.minutos_extra,
    dispositivo_info: row.dispositivo_info as Record<string, unknown> | undefined,
    registrado_por: row.registrado_por ?? undefined,
    observacion: row.observacion ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPermiso(row: typeof permisoTable.$inferSelect): PermisoAsistencia {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    usuario_id: row.usuario_id,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    tipo_permiso: row.tipo_permiso,
    motivo: row.motivo,
    archivo_url: row.archivo_url ?? undefined,
    estado: row.estado,
    aprobado_por: row.aprobado_por ?? undefined,
    afecta_pago: row.afecta_pago,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDetalle(row: typeof detalleTable.$inferSelect): PlanillaDetalle {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    planilla_id: row.planilla_id,
    usuario_id: row.usuario_id,
    fecha: row.fecha,
    estado_dia: row.estado_dia,
    hora_entrada_real: row.hora_entrada_real ?? undefined,
    hora_salida_real: row.hora_salida_real ?? undefined,
    hora_entrada_prog: row.hora_entrada_prog,
    hora_salida_prog: row.hora_salida_prog,
    minutos_tardanza: row.minutos_tardanza,
    minutos_extra: row.minutos_extra,
    descuento_dia: toNum(row.descuento_dia),
    observacion: row.observacion ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPlanilla(
  row: typeof planillaTable.$inferSelect,
  detalles?: PlanillaDetalle[],
  usuarioNombres?: string | null,
  usuarioApellidos?: string | null
): PlanillaMensual {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    usuario_id: row.usuario_id,
    usuario_nombres: usuarioNombres ?? undefined,
    usuario_apellidos: usuarioApellidos ?? undefined,
    periodo: row.periodo,
    dias_laborables: row.dias_laborables,
    dias_asistidos: row.dias_asistidos,
    dias_falta: row.dias_falta,
    dias_falta_justificada: row.dias_falta_justificada,
    dias_vacaciones: row.dias_vacaciones,
    minutos_tardanza_total: row.minutos_tardanza_total,
    minutos_extra_total: row.minutos_extra_total,
    horas_extra_total: toNum(row.horas_extra_total),
    sueldo_base: toNum(row.sueldo_base),
    valor_dia: toNum(row.valor_dia),
    valor_hora: toNum(row.valor_hora),
    descuento_tardanzas: toNum(row.descuento_tardanzas),
    descuento_faltas: toNum(row.descuento_faltas),
    monto_horas_extra: toNum(row.monto_horas_extra),
    bonificaciones: toNum(row.bonificaciones),
    otros_descuentos: toNum(row.otros_descuentos),
    total_bruto: toNum(row.total_bruto),
    total_neto: toNum(row.total_neto),
    estado: row.estado,
    aprobado_por: row.aprobado_por ?? undefined,
    fecha_aprobacion: row.fecha_aprobacion ?? undefined,
    fecha_pago: row.fecha_pago ?? undefined,
    observaciones: row.observaciones ?? undefined,
    detalles,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class AsistenciaDrizzleRepository implements IAsistenciaRepository {
  constructor(private readonly db: DbClient) {}

  // ─── Turnos ────────────────────────────────────────────────────────────────

  async listTurnos(tenantId: string): Promise<TurnoTrabajo[]> {
    const rows = await this.db.select().from(turnoTable).where(eq(turnoTable.tenant_id, tenantId));
    return rows.map(mapTurno);
  }

  async findTurnoById(tenantId: string, id: string): Promise<TurnoTrabajo | null> {
    const rows = await this.db
      .select()
      .from(turnoTable)
      .where(and(eq(turnoTable.tenant_id, tenantId), eq(turnoTable.id, id)));
    return rows[0] ? mapTurno(rows[0]) : null;
  }

  async createTurno(tenantId: string, data: CreateTurnoData): Promise<TurnoTrabajo> {
    const rows = await this.db
      .insert(turnoTable)
      .values({
        tenant_id: tenantId,
        nombre: data.nombre,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        tolerancia_minutos: data.tolerancia_minutos ?? 15,
        dias_laborales: data.dias_laborales,
        activo: data.activo ?? true,
      })
      .returning();
    return mapTurno(rows[0]!);
  }

  async updateTurno(
    tenantId: string,
    id: string,
    data: UpdateTurnoData
  ): Promise<TurnoTrabajo | null> {
    const set: Record<string, unknown> = { updated_at: new Date() };
    if (data.nombre !== undefined) set.nombre = data.nombre;
    if (data.hora_inicio !== undefined) set.hora_inicio = data.hora_inicio;
    if (data.hora_fin !== undefined) set.hora_fin = data.hora_fin;
    if (data.tolerancia_minutos !== undefined) set.tolerancia_minutos = data.tolerancia_minutos;
    if (data.dias_laborales !== undefined) set.dias_laborales = data.dias_laborales;
    if (data.activo !== undefined) set.activo = data.activo;

    const rows = await this.db
      .update(turnoTable)
      .set(set)
      .where(and(eq(turnoTable.tenant_id, tenantId), eq(turnoTable.id, id)))
      .returning();
    return rows[0] ? mapTurno(rows[0]) : null;
  }

  async deleteTurno(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(turnoTable)
      .set({ activo: false, updated_at: new Date() })
      .where(and(eq(turnoTable.tenant_id, tenantId), eq(turnoTable.id, id)))
      .returning({ id: turnoTable.id });
    return rows.length > 0;
  }

  // ─── Puntos de control WiFi ────────────────────────────────────────────────

  async listPuntosControl(tenantId: string): Promise<PuntoControlWifi[]> {
    const rows = await this.db
      .select({
        punto: puntoTable,
        sucursal_nombre: sucursalTable.nombre,
      })
      .from(puntoTable)
      .leftJoin(sucursalTable, eq(puntoTable.sucursal_id, sucursalTable.id))
      .where(eq(puntoTable.tenant_id, tenantId));
    return rows.map((r) => mapPunto(r.punto, r.sucursal_nombre));
  }

  async findPuntoControlById(tenantId: string, id: string): Promise<PuntoControlWifi | null> {
    const rows = await this.db
      .select({
        punto: puntoTable,
        sucursal_nombre: sucursalTable.nombre,
      })
      .from(puntoTable)
      .leftJoin(sucursalTable, eq(puntoTable.sucursal_id, sucursalTable.id))
      .where(and(eq(puntoTable.tenant_id, tenantId), eq(puntoTable.id, id)));
    return rows[0] ? mapPunto(rows[0].punto, rows[0].sucursal_nombre) : null;
  }

  async createPuntoControl(
    tenantId: string,
    data: CreatePuntoControlData
  ): Promise<PuntoControlWifi> {
    const rows = await this.db
      .insert(puntoTable)
      .values({
        tenant_id: tenantId,
        sucursal_id: data.sucursal_id,
        nombre: data.nombre,
        ssid: data.ssid,
        bssid: data.bssid ?? "",
        latitud: String(data.latitud),
        longitud: String(data.longitud),
        radio_metros: data.radio_metros ?? 50,
        activo: data.activo ?? true,
      })
      .returning();
    return mapPunto(rows[0]!);
  }

  async updatePuntoControl(
    tenantId: string,
    id: string,
    data: UpdatePuntoControlData
  ): Promise<PuntoControlWifi | null> {
    const set: Record<string, unknown> = { updated_at: new Date() };
    if (data.sucursal_id !== undefined) set.sucursal_id = data.sucursal_id;
    if (data.nombre !== undefined) set.nombre = data.nombre;
    if (data.ssid !== undefined) set.ssid = data.ssid;
    if (data.bssid !== undefined) set.bssid = data.bssid ?? "";
    if (data.latitud !== undefined) set.latitud = String(data.latitud);
    if (data.longitud !== undefined) set.longitud = String(data.longitud);
    if (data.radio_metros !== undefined) set.radio_metros = data.radio_metros;
    if (data.activo !== undefined) set.activo = data.activo;

    const rows = await this.db
      .update(puntoTable)
      .set(set)
      .where(and(eq(puntoTable.tenant_id, tenantId), eq(puntoTable.id, id)))
      .returning();
    if (!rows[0]) return null;

    const withJoin = await this.db
      .select({ punto: puntoTable, sucursal_nombre: sucursalTable.nombre })
      .from(puntoTable)
      .leftJoin(sucursalTable, eq(puntoTable.sucursal_id, sucursalTable.id))
      .where(eq(puntoTable.id, rows[0].id));
    return withJoin[0] ? mapPunto(withJoin[0].punto, withJoin[0].sucursal_nombre) : null;
  }

  async deletePuntoControl(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(puntoTable)
      .set({ activo: false, updated_at: new Date() })
      .where(and(eq(puntoTable.tenant_id, tenantId), eq(puntoTable.id, id)))
      .returning({ id: puntoTable.id });
    return rows.length > 0;
  }

  // ─── Trabajadores config ───────────────────────────────────────────────────

  async listTrabajadores(tenantId: string): Promise<TrabajadorConfig[]> {
    const rows = await this.db
      .select({
        t: trabajadorTable,
        u: usuarioTable,
        turno: turnoTable,
      })
      .from(trabajadorTable)
      .leftJoin(usuarioTable, eq(trabajadorTable.usuario_id, usuarioTable.id))
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(eq(trabajadorTable.tenant_id, tenantId));
    // biome-ignore lint/suspicious/noExplicitAny: leftJoin nullability
    return rows.map((r) => mapTrabajador(r as any));
  }

  async findTrabajadorById(tenantId: string, id: string): Promise<TrabajadorConfig | null> {
    const rows = await this.db
      .select({ t: trabajadorTable, u: usuarioTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(usuarioTable, eq(trabajadorTable.usuario_id, usuarioTable.id))
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(and(eq(trabajadorTable.tenant_id, tenantId), eq(trabajadorTable.id, id)));
    if (!rows[0]) return null;
    // biome-ignore lint/suspicious/noExplicitAny: leftJoin nullability
    return mapTrabajador(rows[0] as any);
  }

  async createTrabajador(tenantId: string, data: CreateTrabajadorData): Promise<TrabajadorConfig> {
    const existing = await this.db
      .select({ id: trabajadorTable.id })
      .from(trabajadorTable)
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, data.usuario_id),
          eq(trabajadorTable.activo, true)
        )
      );
    if (existing.length > 0) {
      throw new ApiError(
        "TRABAJADOR_DUPLICATE",
        "Este usuario ya tiene una configuración activa (A9)",
        409
      );
    }

    const rows = await this.db
      .insert(trabajadorTable)
      .values({
        tenant_id: tenantId,
        usuario_id: data.usuario_id,
        turno_id: data.turno_id,
        sucursal_id: data.sucursal_id,
        tipo_contrato: data.tipo_contrato as "PLANILLA" | "HONORARIOS" | "PRACTICANTE",
        sueldo_base: String(data.sueldo_base),
        modalidad_pago: data.modalidad_pago as "MENSUAL" | "QUINCENAL" | "SEMANAL",
        fecha_ingreso: data.fecha_ingreso,
        fecha_cese: data.fecha_cese ?? null,
        factor_hora_extra: data.factor_hora_extra ? String(data.factor_hora_extra) : "1.25",
        descuento_x_tardanza: data.descuento_x_tardanza as
          | "POR_MINUTO"
          | "POR_RANGO"
          | "SIN_DESCUENTO",
        monto_descuento_min: data.monto_descuento_min ? String(data.monto_descuento_min) : "0",
        activo: data.activo ?? true,
      })
      .returning();

    const inserted = rows[0]!;
    const full = await this.findTrabajadorById(tenantId, inserted.id);
    return full!;
  }

  async updateTrabajador(
    tenantId: string,
    id: string,
    data: UpdateTrabajadorData
  ): Promise<TrabajadorConfig | null> {
    const set: Record<string, unknown> = { updated_at: new Date() };
    if (data.turno_id !== undefined) set.turno_id = data.turno_id;
    if (data.sucursal_id !== undefined) set.sucursal_id = data.sucursal_id;
    if (data.tipo_contrato !== undefined) set.tipo_contrato = data.tipo_contrato;
    if (data.sueldo_base !== undefined) set.sueldo_base = String(data.sueldo_base);
    if (data.modalidad_pago !== undefined) set.modalidad_pago = data.modalidad_pago;
    if (data.fecha_ingreso !== undefined) set.fecha_ingreso = data.fecha_ingreso;
    if (data.fecha_cese !== undefined) set.fecha_cese = data.fecha_cese ?? null;
    if (data.factor_hora_extra !== undefined)
      set.factor_hora_extra = String(data.factor_hora_extra);
    if (data.descuento_x_tardanza !== undefined)
      set.descuento_x_tardanza = data.descuento_x_tardanza;
    if (data.monto_descuento_min !== undefined)
      set.monto_descuento_min = String(data.monto_descuento_min);
    if (data.activo !== undefined) set.activo = data.activo;

    const rows = await this.db
      .update(trabajadorTable)
      .set(set)
      .where(and(eq(trabajadorTable.tenant_id, tenantId), eq(trabajadorTable.id, id)))
      .returning({ id: trabajadorTable.id });
    if (!rows[0]) return null;
    return this.findTrabajadorById(tenantId, id);
  }

  async deleteTrabajador(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(trabajadorTable)
      .set({ activo: false, updated_at: new Date() })
      .where(and(eq(trabajadorTable.tenant_id, tenantId), eq(trabajadorTable.id, id)))
      .returning({ id: trabajadorTable.id });
    return rows.length > 0;
  }

  // ─── Marcado de asistencia ─────────────────────────────────────────────────

  async marcar(
    tenantId: string,
    usuarioId: string,
    data: MarcarAsistenciaData
  ): Promise<MarcadoResult> {
    // 1. Obtener trabajador_config
    const trabajadorRows = await this.db
      .select({ t: trabajadorTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, usuarioId),
          eq(trabajadorTable.activo, true)
        )
      );
    if (!trabajadorRows[0]?.turno) {
      throw new ApiError(
        "TRABAJADOR_NOT_FOUND",
        "No tiene configuración de trabajador activa",
        404
      );
    }
    const trabajador = trabajadorRows[0].t;
    // biome-ignore lint/suspicious/noExplicitAny: leftJoin nullability
    const turno = trabajadorRows[0].turno as any;

    // 2. Buscar punto de control activo
    const puntos = await this.db
      .select()
      .from(puntoTable)
      .where(and(eq(puntoTable.tenant_id, tenantId), eq(puntoTable.activo, true)));

    const ahora = new Date();
    const fechaStr = ahora.toISOString().slice(0, 10);

    // 3-4. Validaciones
    let validacion_wifi = false;
    let validacion_gps = false;
    let distancia_metros = 0;
    let puntoControlId: string | undefined;

    if (puntos.length > 0) {
      const punto = puntos[0]!;
      puntoControlId = punto.id;
      const latCtrl = toNum(punto.latitud);
      const lngCtrl = toNum(punto.longitud);

      distancia_metros = Math.round(haversine(data.latitud, data.longitud, latCtrl, lngCtrl));
      validacion_gps = dentroDelRadio(
        data.latitud,
        data.longitud,
        latCtrl,
        lngCtrl,
        punto.radio_metros
      );

      // A3: Si bssid null → solo ssid
      if (punto.bssid && data.bssid) {
        validacion_wifi = data.ssid === punto.ssid && data.bssid === punto.bssid;
      } else {
        validacion_wifi = data.ssid === punto.ssid;
      }
    } else {
      // Sin punto de control configurado: solo GPS no aplica; marcar como FUERA_DE_ZONA
      validacion_wifi = false;
      validacion_gps = false;
    }

    const validacion_aprobada = validacion_wifi && validacion_gps;

    // 5. Calcular tardanza y extra
    let minutos_tardanza = 0;
    let es_hora_extra = false;
    let minutos_extra = 0;

    if (data.tipo_evento === "ENTRADA") {
      const eventoMin = toLimaMinutes(ahora);
      const inicioMin = turnoMinutes(turno.hora_inicio);
      const threshold = inicioMin + turno.tolerancia_minutos;
      if (eventoMin > threshold) {
        minutos_tardanza = eventoMin - threshold;
      }
    } else if (data.tipo_evento === "SALIDA") {
      const eventoMin = toLimaMinutes(ahora);
      const finMin = turnoMinutes(turno.hora_fin);
      if (eventoMin > finMin) {
        es_hora_extra = true;
        minutos_extra = eventoMin - finMin;
      }
    }

    // 6. Determinar estado
    let estado: string;
    if (!validacion_gps) {
      estado = "FUERA_DE_ZONA";
    } else if (!validacion_wifi) {
      estado = "WIFI_NO_AUTORIZADO";
    } else if (minutos_tardanza > 0) {
      estado = "TARDANZA";
    } else {
      estado = "VALIDO";
    }

    // 7. INSERT evento
    const eventoRows = await this.db
      .insert(eventoTable)
      .values({
        tenant_id: tenantId,
        usuario_id: usuarioId,
        turno_id: trabajador.turno_id,
        tipo_evento: data.tipo_evento as "ENTRADA" | "SALIDA" | "BREAK_INICIO" | "BREAK_FIN",
        fecha_hora: ahora,
        fecha: fechaStr,
        ssid_detectado: data.ssid,
        bssid_detectado: data.bssid ?? null,
        latitud_marcado: String(data.latitud),
        longitud_marcado: String(data.longitud),
        distancia_metros,
        punto_control_id: puntoControlId ?? null,
        validacion_wifi,
        validacion_gps,
        validacion_aprobada,
        estado: estado as "VALIDO" | "TARDANZA" | "FUERA_DE_ZONA" | "WIFI_NO_AUTORIZADO",
        minutos_tardanza,
        es_hora_extra,
        minutos_extra,
        dispositivo_info: data.dispositivo_info,
      })
      .returning();

    const evento = mapEvento(eventoRows[0]!);

    // 8. A4: Si no aprobado → notificar (EventBridge stub)
    if (!validacion_aprobada) {
      console.warn(
        `[asistencia.marcado_invalido] tenant=${tenantId} usuario=${usuarioId} estado=${estado} distancia=${distancia_metros}m`
      );
    }

    const mensaje = validacion_aprobada
      ? minutos_tardanza > 0
        ? `Tardanza de ${minutos_tardanza} minuto(s)`
        : "Asistencia registrada correctamente"
      : !validacion_gps
        ? `Fuera de zona (${distancia_metros}m del punto de control)`
        : "WiFi no autorizado";

    return {
      aprobado: validacion_aprobada,
      estado,
      minutos_tardanza,
      minutos_extra,
      distancia_metros,
      mensaje,
      validacion_wifi,
      validacion_gps,
      evento,
    };
  }

  async getHistorial(tenantId: string, usuarioId: string, mes: string): Promise<HistorialDia[]> {
    const desde = `${mes}-01`;
    const mesParts = mes.split("-").map(Number);
    const lastDay = new Date(Date.UTC(mesParts[0]!, mesParts[1]!, 0)).getUTCDate();
    const hasta = `${mes}-${String(lastDay).padStart(2, "0")}`;

    const rows = await this.db
      .select()
      .from(eventoTable)
      .where(
        and(
          eq(eventoTable.tenant_id, tenantId),
          eq(eventoTable.usuario_id, usuarioId),
          gte(eventoTable.fecha, desde),
          lte(eventoTable.fecha, hasta)
        )
      )
      .orderBy(eventoTable.fecha_hora);

    const byDate = new Map<string, (typeof rows)[0][]>();
    for (const row of rows) {
      const arr = byDate.get(row.fecha) ?? [];
      arr.push(row);
      byDate.set(row.fecha, arr);
    }

    return daysInPeriod(mes)
      .filter((d) => byDate.has(d))
      .map((fecha) => {
        const eventos = byDate.get(fecha)!;
        const entrada = eventos.find((e) => e.tipo_evento === "ENTRADA");
        let estado_dia = "AUSENTE";
        if (entrada) {
          estado_dia = entrada.minutos_tardanza > 0 ? "TARDANZA" : "PRESENTE";
        }
        return {
          fecha,
          eventos: eventos.map((e) => ({
            id: e.id,
            tipo_evento: e.tipo_evento,
            fecha_hora: e.fecha_hora,
            estado: e.estado,
            minutos_tardanza: e.minutos_tardanza,
            minutos_extra: e.minutos_extra,
          })),
          estado_dia,
        };
      });
  }

  async registroManual(
    tenantId: string,
    adminId: string,
    data: RegistroManualData
  ): Promise<EventoAsistencia> {
    const trabajadorRows = await this.db
      .select({ t: trabajadorTable })
      .from(trabajadorTable)
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, data.usuario_id),
          eq(trabajadorTable.activo, true)
        )
      );
    if (!trabajadorRows[0]) {
      throw new ApiError("TRABAJADOR_NOT_FOUND", "Trabajador no encontrado", 404);
    }
    const trabajador = trabajadorRows[0].t;
    const fechaHora = new Date(data.fecha_hora);
    const fechaStr = fechaHora.toISOString().slice(0, 10);

    const rows = await this.db
      .insert(eventoTable)
      .values({
        tenant_id: tenantId,
        usuario_id: data.usuario_id,
        turno_id: trabajador.turno_id,
        tipo_evento: data.tipo_evento as "ENTRADA" | "SALIDA" | "BREAK_INICIO" | "BREAK_FIN",
        fecha_hora: fechaHora,
        fecha: fechaStr,
        validacion_wifi: true,
        validacion_gps: true,
        validacion_aprobada: true,
        estado: "MANUAL",
        minutos_tardanza: 0,
        es_hora_extra: false,
        minutos_extra: 0,
        registrado_por: adminId,
        observacion: data.observacion ?? null,
        dispositivo_info: { tipo: "manual", registrado_por: adminId },
      })
      .returning();
    return mapEvento(rows[0]!);
  }

  async getPanelHoy(tenantId: string): Promise<PanelHoyItem[]> {
    const hoy = new Date().toISOString().slice(0, 10);
    const diaSemana = getDayAbbr(hoy);

    const trabajadores = await this.db
      .select({ t: trabajadorTable, u: usuarioTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(usuarioTable, eq(trabajadorTable.usuario_id, usuarioTable.id))
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(and(eq(trabajadorTable.tenant_id, tenantId), eq(trabajadorTable.activo, true)));

    const result: PanelHoyItem[] = [];

    for (const r of trabajadores) {
      // biome-ignore lint/suspicious/noExplicitAny: leftJoin
      const turno = r.turno as any;
      if (!turno) continue;
      if (!turno.dias_laborales.includes(diaSemana)) continue;

      const eventos = await this.db
        .select()
        .from(eventoTable)
        .where(
          and(
            eq(eventoTable.tenant_id, tenantId),
            eq(eventoTable.usuario_id, r.t.usuario_id),
            eq(eventoTable.fecha, hoy)
          )
        )
        .orderBy(eventoTable.fecha_hora);

      const permiso = await this.db
        .select()
        .from(permisoTable)
        .where(
          and(
            eq(permisoTable.tenant_id, tenantId),
            eq(permisoTable.usuario_id, r.t.usuario_id),
            eq(permisoTable.estado, "APROBADO"),
            lte(permisoTable.fecha_inicio, hoy),
            gte(permisoTable.fecha_fin, hoy)
          )
        );

      const entrada = eventos.find((e) => e.tipo_evento === "ENTRADA");
      const salida = eventos.find((e) => e.tipo_evento === "SALIDA");

      let estado: PanelHoyItem["estado"] = "FALTA";
      if (permiso.length > 0) estado = "PERMISO";
      else if (entrada) estado = entrada.minutos_tardanza > 0 ? "TARDANZA" : "PRESENTE";

      // biome-ignore lint/suspicious/noExplicitAny: leftJoin
      const u = r.u as any;
      result.push({
        usuario_id: r.t.usuario_id,
        usuario_nombres: u?.nombres ?? "",
        usuario_apellidos: u?.apellidos ?? "",
        turno_id: r.t.turno_id,
        turno_nombre: turno.nombre,
        hora_entrada_prog: turno.hora_inicio,
        hora_salida_prog: turno.hora_fin,
        hora_entrada_real: entrada?.fecha_hora ?? undefined,
        hora_salida_real: salida?.fecha_hora ?? undefined,
        estado,
        minutos_tardanza: entrada?.minutos_tardanza ?? 0,
      });
    }

    return result;
  }

  // ─── Planilla ──────────────────────────────────────────────────────────────

  async calcularPlanilla(
    tenantId: string,
    _adminId: string,
    data: CalcularPlanillaData
  ): Promise<PlanillaMensual> {
    const trabajadorRows = await this.db
      .select({ t: trabajadorTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, data.usuario_id),
          eq(trabajadorTable.activo, true)
        )
      );
    if (!trabajadorRows[0]?.turno) {
      throw new ApiError("TRABAJADOR_NOT_FOUND", "Trabajador no configurado", 404);
    }

    const trabajador = trabajadorRows[0].t;
    // biome-ignore lint/suspicious/noExplicitAny: leftJoin
    const turno = trabajadorRows[0].turno as any;
    const sueldo = toNum(trabajador.sueldo_base);
    const factorExtra = toNum(trabajador.factor_hora_extra);
    const motoDesc = toNum(trabajador.monto_descuento_min);
    const descTardanzaTipo = trabajador.descuento_x_tardanza;

    const dias = daysInPeriod(data.periodo);
    const diasLaborables = dias.filter((d) => turno.dias_laborales.includes(getDayAbbr(d))).length;

    if (diasLaborables === 0) {
      throw new ApiError(
        "PLANILLA_SIN_DIAS",
        "El turno no tiene días laborales en el periodo",
        400
      );
    }

    const valorDia = round2(sueldo / diasLaborables);
    const valorHora = round2(valorDia / 8);

    // Calcular planilla existente o crear
    const existing = await this.db
      .select()
      .from(planillaTable)
      .where(
        and(
          eq(planillaTable.tenant_id, tenantId),
          eq(planillaTable.usuario_id, data.usuario_id),
          eq(planillaTable.periodo, data.periodo)
        )
      );

    let planillaId: string;
    if (existing[0]) {
      if (existing[0].estado === "PAGADO") {
        throw new ApiError(
          "PLANILLA_PAGADA",
          "La planilla ya está pagada y es inmutable (A19)",
          409
        );
      }
      planillaId = existing[0].id;
      // Eliminar detalles anteriores para recalcular
      await this.db.delete(detalleTable).where(eq(detalleTable.planilla_id, planillaId));
    } else {
      const planillaRows = await this.db
        .insert(planillaTable)
        .values({
          tenant_id: tenantId,
          usuario_id: data.usuario_id,
          periodo: data.periodo,
          dias_laborables: diasLaborables,
          sueldo_base: String(sueldo),
          valor_dia: String(valorDia),
          valor_hora: String(valorHora),
          estado: "CALCULADO",
        })
        .returning();
      planillaId = planillaRows[0]!.id;
    }

    let diasAsistidos = 0;
    let diasFalta = 0;
    let diasFaltaJustificada = 0;
    let diasVacaciones = 0;
    let minutosTardanzaTotal = 0;
    let minutosExtraTotal = 0;
    let diasConTardanza = 0;

    for (const fecha of dias) {
      const esLaborable = turno.dias_laborales.includes(getDayAbbr(fecha));
      if (!esLaborable) {
        await this.db.insert(detalleTable).values({
          tenant_id: tenantId,
          planilla_id: planillaId,
          usuario_id: data.usuario_id,
          fecha,
          estado_dia: "DESCANSO",
          hora_entrada_prog: turno.hora_inicio,
          hora_salida_prog: turno.hora_fin,
          minutos_tardanza: 0,
          minutos_extra: 0,
          descuento_dia: "0",
        });
        continue;
      }

      const eventos = await this.db
        .select()
        .from(eventoTable)
        .where(
          and(
            eq(eventoTable.tenant_id, tenantId),
            eq(eventoTable.usuario_id, data.usuario_id),
            eq(eventoTable.fecha, fecha)
          )
        );

      const permiso = await this.db
        .select()
        .from(permisoTable)
        .where(
          and(
            eq(permisoTable.tenant_id, tenantId),
            eq(permisoTable.usuario_id, data.usuario_id),
            eq(permisoTable.estado, "APROBADO"),
            lte(permisoTable.fecha_inicio, fecha),
            gte(permisoTable.fecha_fin, fecha)
          )
        );

      const entrada = eventos.find((e) => e.tipo_evento === "ENTRADA");
      const salida = eventos.find((e) => e.tipo_evento === "SALIDA");

      let estado_dia: string;
      let descuentoDia = 0;

      if (permiso.length > 0) {
        const p = permiso[0]!;
        if (p.tipo_permiso === "VACACIONES") {
          estado_dia = "VACACIONES";
          diasVacaciones++;
        } else {
          estado_dia = "PERMISO";
          diasFaltaJustificada++;
        }
      } else if (entrada) {
        if (entrada.minutos_tardanza > 0) {
          estado_dia = "TARDANZA";
          diasConTardanza++;
        } else {
          estado_dia = "PRESENTE";
        }
        diasAsistidos++;
        minutosTardanzaTotal += entrada.minutos_tardanza;
        if (salida) minutosExtraTotal += salida.minutos_extra;
      } else {
        estado_dia = "FALTA";
        diasFalta++;
        descuentoDia = valorDia;
      }

      await this.db.insert(detalleTable).values({
        tenant_id: tenantId,
        planilla_id: planillaId,
        usuario_id: data.usuario_id,
        fecha,
        estado_dia: estado_dia as
          | "PRESENTE"
          | "FALTA"
          | "TARDANZA"
          | "PERMISO"
          | "VACACIONES"
          | "FERIADO"
          | "DESCANSO",
        hora_entrada_real: entrada?.fecha_hora ?? null,
        hora_salida_real: salida?.fecha_hora ?? null,
        hora_entrada_prog: turno.hora_inicio,
        hora_salida_prog: turno.hora_fin,
        minutos_tardanza: entrada?.minutos_tardanza ?? 0,
        minutos_extra: salida?.minutos_extra ?? 0,
        descuento_dia: String(round2(descuentoDia)),
        observacion: permiso[0]?.motivo ?? null,
      });
    }

    // A15: descuento tardanzas
    let descuentoTardanzas = 0;
    if (descTardanzaTipo === "POR_MINUTO") {
      descuentoTardanzas = round2(minutosTardanzaTotal * motoDesc);
    } else if (descTardanzaTipo === "POR_RANGO") {
      descuentoTardanzas = round2(diasConTardanza * (valorHora / 2));
    }

    // A14: descuento faltas (solo injustificadas)
    const diasFaltaInjustificada = diasFalta;
    const descuentoFaltas = round2(diasFaltaInjustificada * valorDia);

    // A16: horas extra
    const horasExtraTotal = round2(minutosExtraTotal / 60);
    const montoHorasExtra = round2(horasExtraTotal * valorHora * factorExtra);

    // A17-A18
    const totalBruto = round2(sueldo - descuentoFaltas - descuentoTardanzas + montoHorasExtra);
    const totalNeto = round2(totalBruto);

    await this.db
      .update(planillaTable)
      .set({
        dias_laborables: diasLaborables,
        dias_asistidos: diasAsistidos,
        dias_falta: diasFalta,
        dias_falta_justificada: diasFaltaJustificada,
        dias_vacaciones: diasVacaciones,
        minutos_tardanza_total: minutosTardanzaTotal,
        minutos_extra_total: minutosExtraTotal,
        horas_extra_total: String(horasExtraTotal),
        sueldo_base: String(sueldo),
        valor_dia: String(valorDia),
        valor_hora: String(valorHora),
        descuento_tardanzas: String(descuentoTardanzas),
        descuento_faltas: String(descuentoFaltas),
        monto_horas_extra: String(montoHorasExtra),
        total_bruto: String(totalBruto),
        total_neto: String(totalNeto),
        estado: "CALCULADO",
        updated_at: new Date(),
      })
      .where(eq(planillaTable.id, planillaId));

    return (await this.findPlanillaDetalle(tenantId, planillaId))!;
  }

  async calcularPlanillaTodos(
    tenantId: string,
    adminId: string,
    periodo: string
  ): Promise<{ cantidad_calculados: number; errores: string[] }> {
    const trabajadores = await this.db
      .select()
      .from(trabajadorTable)
      .where(and(eq(trabajadorTable.tenant_id, tenantId), eq(trabajadorTable.activo, true)));

    let cantidad_calculados = 0;
    const errores: string[] = [];

    for (const t of trabajadores) {
      try {
        await this.calcularPlanilla(tenantId, adminId, {
          usuario_id: t.usuario_id,
          periodo,
        });
        cantidad_calculados++;
      } catch (err) {
        errores.push(
          `usuario_id=${t.usuario_id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return { cantidad_calculados, errores };
  }

  async listPlanillas(tenantId: string, params: ListPlanillasParams): Promise<ListPlanillasResult> {
    const conditions = [eq(planillaTable.tenant_id, tenantId)];
    if (params.periodo) conditions.push(eq(planillaTable.periodo, params.periodo));
    if (params.estado)
      conditions.push(
        eq(planillaTable.estado, params.estado as "BORRADOR" | "CALCULADO" | "APROBADO" | "PAGADO")
      );
    if (params.usuario_id) conditions.push(eq(planillaTable.usuario_id, params.usuario_id));

    const [totalRows, items] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(planillaTable)
        .where(and(...conditions)),
      this.db
        .select({ p: planillaTable, u: usuarioTable })
        .from(planillaTable)
        .leftJoin(usuarioTable, eq(planillaTable.usuario_id, usuarioTable.id))
        .where(and(...conditions))
        .orderBy(planillaTable.periodo)
        .limit(params.limit)
        .offset((params.page - 1) * params.limit),
    ]);

    return {
      total: totalRows[0]?.total ?? 0,
      items: items.map((r) =>
        mapPlanilla(r.p, undefined, r.u?.nombres ?? null, r.u?.apellidos ?? null)
      ),
    };
  }

  async findPlanillaDetalle(tenantId: string, id: string): Promise<PlanillaMensual | null> {
    const rows = await this.db
      .select({ p: planillaTable, u: usuarioTable })
      .from(planillaTable)
      .leftJoin(usuarioTable, eq(planillaTable.usuario_id, usuarioTable.id))
      .where(and(eq(planillaTable.tenant_id, tenantId), eq(planillaTable.id, id)));
    if (!rows[0]) return null;

    const detalles = await this.db
      .select()
      .from(detalleTable)
      .where(eq(detalleTable.planilla_id, id))
      .orderBy(detalleTable.fecha);

    // biome-ignore lint/suspicious/noExplicitAny: leftJoin
    const u = rows[0].u as any;
    return mapPlanilla(rows[0].p, detalles.map(mapDetalle), u?.nombres, u?.apellidos);
  }

  async aprobarPlanilla(
    tenantId: string,
    adminId: string,
    id: string
  ): Promise<PlanillaMensual | null> {
    const rows = await this.db
      .select()
      .from(planillaTable)
      .where(and(eq(planillaTable.tenant_id, tenantId), eq(planillaTable.id, id)));
    if (!rows[0]) return null;
    if (rows[0].estado !== "CALCULADO") {
      throw new ApiError(
        "PLANILLA_ESTADO_INVALIDO",
        `Solo se puede aprobar planillas en estado CALCULADO (actual: ${rows[0].estado})`,
        409
      );
    }

    await this.db
      .update(planillaTable)
      .set({
        estado: "APROBADO",
        aprobado_por: adminId,
        fecha_aprobacion: new Date(),
        updated_at: new Date(),
      })
      .where(eq(planillaTable.id, id));

    return this.findPlanillaDetalle(tenantId, id);
  }

  async pagarPlanilla(
    tenantId: string,
    id: string,
    fechaPago: string
  ): Promise<PlanillaMensual | null> {
    const rows = await this.db
      .select()
      .from(planillaTable)
      .where(and(eq(planillaTable.tenant_id, tenantId), eq(planillaTable.id, id)));
    if (!rows[0]) return null;
    if (rows[0].estado !== "APROBADO") {
      throw new ApiError(
        "PLANILLA_ESTADO_INVALIDO",
        `Solo se puede pagar planillas en estado APROBADO (actual: ${rows[0].estado})`,
        409
      );
    }

    await this.db
      .update(planillaTable)
      .set({ estado: "PAGADO", fecha_pago: fechaPago, updated_at: new Date() })
      .where(eq(planillaTable.id, id));

    return this.findPlanillaDetalle(tenantId, id);
  }

  // ─── Permisos ──────────────────────────────────────────────────────────────

  async listPermisos(tenantId: string, params: ListPermisosParams): Promise<ListPermisosResult> {
    const conditions = [eq(permisoTable.tenant_id, tenantId)];
    if (params.usuario_id) conditions.push(eq(permisoTable.usuario_id, params.usuario_id));
    if (params.estado)
      conditions.push(
        eq(permisoTable.estado, params.estado as "PENDIENTE" | "APROBADO" | "RECHAZADO")
      );
    if (params.tipo_permiso)
      conditions.push(
        eq(
          permisoTable.tipo_permiso,
          params.tipo_permiso as
            | "MEDICO"
            | "PERSONAL"
            | "VACACIONES"
            | "CAPACITACION"
            | "LICENCIA"
            | "OTRO"
        )
      );
    if (params.fecha_desde) conditions.push(gte(permisoTable.fecha_inicio, params.fecha_desde));
    if (params.fecha_hasta) conditions.push(lte(permisoTable.fecha_fin, params.fecha_hasta));

    const [totalRows, items] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(permisoTable)
        .where(and(...conditions)),
      this.db
        .select()
        .from(permisoTable)
        .where(and(...conditions))
        .orderBy(permisoTable.created_at)
        .limit(params.limit)
        .offset((params.page - 1) * params.limit),
    ]);

    return { total: totalRows[0]?.total ?? 0, items: items.map(mapPermiso) };
  }

  async findPermisoById(tenantId: string, id: string): Promise<PermisoAsistencia | null> {
    const rows = await this.db
      .select()
      .from(permisoTable)
      .where(and(eq(permisoTable.tenant_id, tenantId), eq(permisoTable.id, id)));
    return rows[0] ? mapPermiso(rows[0]) : null;
  }

  async createPermiso(tenantId: string, data: CreatePermisoData): Promise<PermisoAsistencia> {
    const rows = await this.db
      .insert(permisoTable)
      .values({
        tenant_id: tenantId,
        usuario_id: data.usuario_id,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        tipo_permiso: data.tipo_permiso as
          | "MEDICO"
          | "PERSONAL"
          | "VACACIONES"
          | "CAPACITACION"
          | "LICENCIA"
          | "OTRO",
        motivo: data.motivo,
        archivo_url: data.archivo_url ?? null,
        estado: "PENDIENTE",
        afecta_pago: data.afecta_pago ?? false,
      })
      .returning();
    return mapPermiso(rows[0]!);
  }

  async aprobarPermiso(
    tenantId: string,
    adminId: string,
    id: string,
    _afectaPago?: boolean | undefined
  ): Promise<PermisoAsistencia | null> {
    const rows = await this.db
      .select()
      .from(permisoTable)
      .where(and(eq(permisoTable.tenant_id, tenantId), eq(permisoTable.id, id)));
    if (!rows[0]) return null;
    if (rows[0].estado !== "PENDIENTE") {
      throw new ApiError("PERMISO_YA_PROCESADO", "Este permiso ya fue procesado", 409);
    }

    await this.db
      .update(permisoTable)
      .set({ estado: "APROBADO", aprobado_por: adminId, updated_at: new Date() })
      .where(eq(permisoTable.id, id));

    // A23: Si afecta_pago y hay planilla en BORRADOR/CALCULADO → recalcular
    const permiso = rows[0];
    if (permiso.afecta_pago) {
      const periodoAfectado = permiso.fecha_inicio.slice(0, 7);
      const planillaRows = await this.db
        .select()
        .from(planillaTable)
        .where(
          and(
            eq(planillaTable.tenant_id, tenantId),
            eq(planillaTable.usuario_id, permiso.usuario_id),
            eq(planillaTable.periodo, periodoAfectado)
          )
        );
      if (
        planillaRows[0] &&
        (planillaRows[0].estado === "BORRADOR" || planillaRows[0].estado === "CALCULADO")
      ) {
        try {
          await this.calcularPlanilla(tenantId, adminId, {
            usuario_id: permiso.usuario_id,
            periodo: periodoAfectado,
          });
        } catch {
          // No bloquear aprobación si recálculo falla
        }
      }
    }

    return this.findPermisoById(tenantId, id);
  }

  async rechazarPermiso(
    tenantId: string,
    _adminId: string,
    id: string,
    motivoRechazo?: string | undefined
  ): Promise<PermisoAsistencia | null> {
    const rows = await this.db
      .select()
      .from(permisoTable)
      .where(and(eq(permisoTable.tenant_id, tenantId), eq(permisoTable.id, id)));
    if (!rows[0]) return null;
    if (rows[0].estado !== "PENDIENTE") {
      throw new ApiError("PERMISO_YA_PROCESADO", "Este permiso ya fue procesado", 409);
    }

    const setData: Record<string, unknown> = { estado: "RECHAZADO", updated_at: new Date() };
    if (motivoRechazo) setData.observacion = motivoRechazo;

    await this.db.update(permisoTable).set(setData).where(eq(permisoTable.id, id));

    return this.findPermisoById(tenantId, id);
  }

  // ─── Reportes ──────────────────────────────────────────────────────────────

  async getReporteAsistenciaData(tenantId: string, periodo: string) {
    const desde = `${periodo}-01`;
    const perParts = periodo.split("-").map(Number);
    const lastDay = new Date(Date.UTC(perParts[0]!, perParts[1]!, 0)).getUTCDate();
    const hasta = `${periodo}-${String(lastDay).padStart(2, "0")}`;

    const rows = await this.db
      .select({
        detalle: detalleTable,
        nombres: usuarioTable.nombres,
        apellidos: usuarioTable.apellidos,
      })
      .from(detalleTable)
      .leftJoin(usuarioTable, eq(detalleTable.usuario_id, usuarioTable.id))
      .leftJoin(planillaTable, eq(detalleTable.planilla_id, planillaTable.id))
      .where(
        and(
          eq(detalleTable.tenant_id, tenantId),
          gte(detalleTable.fecha, desde),
          lte(detalleTable.fecha, hasta)
        )
      )
      .orderBy(usuarioTable.apellidos, detalleTable.fecha);

    return rows.map((r) => ({
      // biome-ignore lint/suspicious/noExplicitAny: leftJoin
      trabajador: `${(r as any).apellidos ?? ""}, ${(r as any).nombres ?? ""}`.trim(),
      fecha: r.detalle.fecha,
      estado_dia: r.detalle.estado_dia,
      entrada: r.detalle.hora_entrada_real?.toISOString() ?? null,
      salida: r.detalle.hora_salida_real?.toISOString() ?? null,
      tardanza: r.detalle.minutos_tardanza,
      extra: r.detalle.minutos_extra,
    }));
  }

  async getReportePlanillaData(tenantId: string, periodo: string): Promise<PlanillaMensual[]> {
    const result = await this.listPlanillas(tenantId, {
      periodo,
      page: 1,
      limit: 1000,
    });
    return result.items;
  }

  // ─── Portal trabajador ─────────────────────────────────────────────────────

  async loginTrabajador(
    tenantId: string,
    numeroDoc: string,
    password: string
  ): Promise<LoginTrabajadorResult> {
    const rows = await this.db
      .select()
      .from(usuarioTable)
      .where(
        and(
          eq(usuarioTable.tenant_id, tenantId),
          eq(usuarioTable.numero_documento, numeroDoc),
          eq(usuarioTable.activo, true)
        )
      );
    if (!rows[0]) {
      throw new ApiError("AUTH_INVALID_CREDENTIALS", "Credenciales inválidas", 401);
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      throw new ApiError("AUTH_INVALID_CREDENTIALS", "Credenciales inválidas", 401);
    }

    // Verificar que tenga configuración de trabajador
    const trabajadorRows = await this.db
      .select({ id: trabajadorTable.id })
      .from(trabajadorTable)
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, rows[0].id),
          eq(trabajadorTable.activo, true)
        )
      );
    if (!trabajadorRows[0]) {
      throw new ApiError(
        "TRABAJADOR_NOT_FOUND",
        "Este usuario no tiene perfil de trabajador activo",
        403
      );
    }

    const token = signPortalTrabajadorToken(rows[0].id, tenantId);
    return {
      token,
      usuario_id: rows[0].id,
      nombre: `${rows[0].nombres} ${rows[0].apellidos}`.trim(),
    };
  }

  async getPortalEstado(tenantId: string, usuarioId: string): Promise<PortalEstado> {
    const trabajadorRows = await this.db
      .select({ t: trabajadorTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, usuarioId),
          eq(trabajadorTable.activo, true)
        )
      );

    if (!trabajadorRows[0]?.turno) {
      return {
        turno: null,
        hora_entrada_prog: null,
        hora_salida_prog: null,
        ultimo_evento: null,
        puede_marcar_entrada: false,
        puede_marcar_salida: false,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: leftJoin
    const turno = trabajadorRows[0].turno as any;
    const hoy = new Date().toISOString().slice(0, 10);

    const eventosHoy = await this.db
      .select()
      .from(eventoTable)
      .where(
        and(
          eq(eventoTable.tenant_id, tenantId),
          eq(eventoTable.usuario_id, usuarioId),
          eq(eventoTable.fecha, hoy)
        )
      )
      .orderBy(eventoTable.fecha_hora);

    const ultimoEvento = eventosHoy[eventosHoy.length - 1];
    const tieneEntrada = eventosHoy.some((e) => e.tipo_evento === "ENTRADA");
    const tieneSalida = eventosHoy.some((e) => e.tipo_evento === "SALIDA");

    return {
      turno: mapTurno(turno),
      hora_entrada_prog: turno.hora_inicio,
      hora_salida_prog: turno.hora_fin,
      ultimo_evento: ultimoEvento
        ? { tipo: ultimoEvento.tipo_evento, hora: ultimoEvento.fecha_hora }
        : null,
      puede_marcar_entrada: !tieneEntrada,
      puede_marcar_salida: tieneEntrada && !tieneSalida,
    };
  }

  async getPortalHistorial(
    tenantId: string,
    usuarioId: string,
    mes: string
  ): Promise<HistorialDia[]> {
    return this.getHistorial(tenantId, usuarioId, mes);
  }

  async getPortalPlanilla(
    tenantId: string,
    usuarioId: string,
    periodo: string
  ): Promise<PlanillaMensual | null> {
    const rows = await this.db
      .select()
      .from(planillaTable)
      .where(
        and(
          eq(planillaTable.tenant_id, tenantId),
          eq(planillaTable.usuario_id, usuarioId),
          eq(planillaTable.periodo, periodo)
        )
      );

    if (rows[0]) {
      return this.findPlanillaDetalle(tenantId, rows[0].id);
    }

    // A26: calcular estimado en tiempo real
    const trabajadorRows = await this.db
      .select({ t: trabajadorTable, turno: turnoTable })
      .from(trabajadorTable)
      .leftJoin(turnoTable, eq(trabajadorTable.turno_id, turnoTable.id))
      .where(
        and(
          eq(trabajadorTable.tenant_id, tenantId),
          eq(trabajadorTable.usuario_id, usuarioId),
          eq(trabajadorTable.activo, true)
        )
      );
    if (!trabajadorRows[0]?.turno) return null;

    // biome-ignore lint/suspicious/noExplicitAny: leftJoin
    const turno = trabajadorRows[0].turno as any;
    const trabajador = trabajadorRows[0].t;
    const sueldo = toNum(trabajador.sueldo_base);

    const dias = daysInPeriod(periodo);
    const diasLaborables = dias.filter((d) => turno.dias_laborales.includes(getDayAbbr(d))).length;
    if (diasLaborables === 0) return null;

    const valorDia = round2(sueldo / diasLaborables);
    const valorHora = round2(valorDia / 8);
    const factorExtra = toNum(trabajador.factor_hora_extra);
    const motoDesc = toNum(trabajador.monto_descuento_min);

    const desde = `${periodo}-01`;
    const perParts = periodo.split("-").map(Number);
    const lastDay = new Date(Date.UTC(perParts[0]!, perParts[1]!, 0)).getUTCDate();
    const hasta = `${periodo}-${String(lastDay).padStart(2, "0")}`;
    const hoy = new Date().toISOString().slice(0, 10);
    const hastaEfectivo = hoy < hasta ? hoy : hasta;

    const eventos = await this.db
      .select()
      .from(eventoTable)
      .where(
        and(
          eq(eventoTable.tenant_id, tenantId),
          eq(eventoTable.usuario_id, usuarioId),
          gte(eventoTable.fecha, desde),
          lte(eventoTable.fecha, hastaEfectivo)
        )
      );

    let diasAsistidos = 0;
    let diasFalta = 0;
    let minutosTardanzaTotal = 0;
    let minutosExtraTotal = 0;

    const diasProcesados = new Set<string>();
    for (const e of eventos) {
      if (diasProcesados.has(e.fecha)) continue;
      if (!turno.dias_laborales.includes(getDayAbbr(e.fecha))) continue;
      diasProcesados.add(e.fecha);
      if (e.tipo_evento === "ENTRADA") {
        diasAsistidos++;
        minutosTardanzaTotal += e.minutos_tardanza;
      }
      if (e.tipo_evento === "SALIDA") minutosExtraTotal += e.minutos_extra;
    }

    // Contar días laborables pasados sin evento
    for (const fecha of dias) {
      if (fecha > hastaEfectivo) continue;
      if (!turno.dias_laborales.includes(getDayAbbr(fecha))) continue;
      if (!diasProcesados.has(fecha)) diasFalta++;
    }

    let descuentoTardanzas = 0;
    if (trabajador.descuento_x_tardanza === "POR_MINUTO") {
      descuentoTardanzas = round2(minutosTardanzaTotal * motoDesc);
    }
    const descuentoFaltas = round2(diasFalta * valorDia);
    const horasExtraTotal = round2(minutosExtraTotal / 60);
    const montoHorasExtra = round2(horasExtraTotal * valorHora * factorExtra);
    const totalBruto = round2(sueldo - descuentoFaltas - descuentoTardanzas + montoHorasExtra);

    const now = new Date();
    return {
      id: "estimado",
      tenant_id: tenantId,
      usuario_id: usuarioId,
      periodo,
      dias_laborables: diasLaborables,
      dias_asistidos: diasAsistidos,
      dias_falta: diasFalta,
      dias_falta_justificada: 0,
      dias_vacaciones: 0,
      minutos_tardanza_total: minutosTardanzaTotal,
      minutos_extra_total: minutosExtraTotal,
      horas_extra_total: horasExtraTotal,
      sueldo_base: sueldo,
      valor_dia: valorDia,
      valor_hora: valorHora,
      descuento_tardanzas: descuentoTardanzas,
      descuento_faltas: descuentoFaltas,
      monto_horas_extra: montoHorasExtra,
      bonificaciones: 0,
      otros_descuentos: 0,
      total_bruto: totalBruto,
      total_neto: totalBruto,
      estado: "BORRADOR",
      created_at: now,
      updated_at: now,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
