import {
  DescuentoTardanza,
  EstadoDia,
  EstadoEventoAsistencia,
  EstadoPermiso,
  EstadoPlanilla,
  ModalidadPago,
  TipoContrato,
  TipoEventoAsistencia,
  TipoPermiso,
} from "@kallpasoft/shared";
import { relations } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sucursal, tenant, usuario } from "./seguridad.js";

// ── Enums ──────────────────────────────────────────────────────────────────────
export const tipoEventoAsistenciaEnum = pgEnum("tipo_evento_asistencia", TipoEventoAsistencia);
export const estadoEventoAsistenciaEnum = pgEnum(
  "estado_evento_asistencia",
  EstadoEventoAsistencia
);
export const tipoContratoEnum = pgEnum("tipo_contrato", TipoContrato);
export const modalidadPagoEnum = pgEnum("modalidad_pago", ModalidadPago);
export const descuentoTardanzaEnum = pgEnum("descuento_tardanza", DescuentoTardanza);
export const tipoPermisoEnum = pgEnum("tipo_permiso", TipoPermiso);
export const estadoPermisoEnum = pgEnum("estado_permiso", EstadoPermiso);
export const estadoPlanillaEnum = pgEnum("estado_planilla", EstadoPlanilla);
export const estadoDiaEnum = pgEnum("estado_dia", EstadoDia);

// ── turno_trabajo ──────────────────────────────────────────────────────────────
export const turnoTrabajo = pgTable(
  "turno_trabajo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    hora_inicio: time("hora_inicio").notNull(),
    hora_fin: time("hora_fin").notNull(),
    tolerancia_minutos: integer("tolerancia_minutos").notNull().default(15),
    dias_laborales: text("dias_laborales").array().notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uq_tenant_nombre: uniqueIndex("uq_turno_trabajo_tenant_nombre").on(t.tenant_id, t.nombre),
  })
);

// ── punto_control_wifi ─────────────────────────────────────────────────────────
export const puntoControlWifi = pgTable("punto_control_wifi", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  sucursal_id: uuid("sucursal_id")
    .notNull()
    .references(() => sucursal.id),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  ssid: varchar("ssid", { length: 100 }).notNull(),
  bssid: varchar("bssid", { length: 17 }).notNull(),
  latitud: decimal("latitud", { precision: 10, scale: 8 }).notNull(),
  longitud: decimal("longitud", { precision: 11, scale: 8 }).notNull(),
  radio_metros: integer("radio_metros").notNull().default(50),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── trabajador_config ──────────────────────────────────────────────────────────
export const trabajadorConfig = pgTable("trabajador_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  usuario_id: uuid("usuario_id")
    .notNull()
    .references(() => usuario.id)
    .unique(),
  turno_id: uuid("turno_id")
    .notNull()
    .references(() => turnoTrabajo.id),
  sucursal_id: uuid("sucursal_id")
    .notNull()
    .references(() => sucursal.id),
  tipo_contrato: tipoContratoEnum("tipo_contrato").notNull(),
  sueldo_base: decimal("sueldo_base", { precision: 10, scale: 2 }).notNull(),
  modalidad_pago: modalidadPagoEnum("modalidad_pago").notNull(),
  moneda: char("moneda", { length: 3 }).notNull().default("PEN"),
  fecha_ingreso: date("fecha_ingreso").notNull(),
  fecha_cese: date("fecha_cese"),
  factor_hora_extra: decimal("factor_hora_extra", { precision: 4, scale: 2 })
    .notNull()
    .default("1.25"),
  descuento_x_tardanza: descuentoTardanzaEnum("descuento_x_tardanza").notNull(),
  monto_descuento_min: decimal("monto_descuento_min", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── evento_asistencia ──────────────────────────────────────────────────────────
export const eventoAsistencia = pgTable(
  "evento_asistencia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    turno_id: uuid("turno_id")
      .notNull()
      .references(() => turnoTrabajo.id),
    tipo_evento: tipoEventoAsistenciaEnum("tipo_evento").notNull(),
    fecha_hora: timestamp("fecha_hora", { withTimezone: true }).notNull(),
    fecha: date("fecha").notNull(),
    ssid_detectado: varchar("ssid_detectado", { length: 100 }),
    bssid_detectado: varchar("bssid_detectado", { length: 17 }),
    latitud_marcado: decimal("latitud_marcado", { precision: 10, scale: 8 }),
    longitud_marcado: decimal("longitud_marcado", { precision: 11, scale: 8 }),
    distancia_metros: integer("distancia_metros"),
    punto_control_id: uuid("punto_control_id").references(() => puntoControlWifi.id),
    validacion_wifi: boolean("validacion_wifi").notNull().default(false),
    validacion_gps: boolean("validacion_gps").notNull().default(false),
    validacion_aprobada: boolean("validacion_aprobada").notNull().default(false),
    estado: estadoEventoAsistenciaEnum("estado").notNull(),
    minutos_tardanza: integer("minutos_tardanza").notNull().default(0),
    es_hora_extra: boolean("es_hora_extra").notNull().default(false),
    minutos_extra: integer("minutos_extra").notNull().default(0),
    dispositivo_info: jsonb("dispositivo_info"),
    registrado_por: uuid("registrado_por").references(() => usuario.id),
    observacion: text("observacion"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idx_usuario_fecha: index("idx_evento_asistencia_usuario_fecha").on(
      t.tenant_id,
      t.usuario_id,
      t.fecha
    ),
    idx_fecha: index("idx_evento_asistencia_fecha").on(t.tenant_id, t.fecha),
    idx_estado: index("idx_evento_asistencia_estado").on(t.tenant_id, t.estado),
  })
);

// ── permiso_asistencia ─────────────────────────────────────────────────────────
export const permisoAsistencia = pgTable("permiso_asistencia", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  usuario_id: uuid("usuario_id")
    .notNull()
    .references(() => usuario.id),
  fecha_inicio: date("fecha_inicio").notNull(),
  fecha_fin: date("fecha_fin").notNull(),
  tipo_permiso: tipoPermisoEnum("tipo_permiso").notNull(),
  motivo: text("motivo").notNull(),
  archivo_url: text("archivo_url"),
  estado: estadoPermisoEnum("estado").notNull().default("PENDIENTE"),
  aprobado_por: uuid("aprobado_por").references(() => usuario.id),
  afecta_pago: boolean("afecta_pago").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── planilla_mensual ───────────────────────────────────────────────────────────
export const planillaMensual = pgTable(
  "planilla_mensual",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    periodo: char("periodo", { length: 7 }).notNull(),
    dias_laborables: integer("dias_laborables").notNull(),
    dias_asistidos: integer("dias_asistidos").notNull().default(0),
    dias_falta: integer("dias_falta").notNull().default(0),
    dias_falta_justificada: integer("dias_falta_justificada").notNull().default(0),
    dias_vacaciones: integer("dias_vacaciones").notNull().default(0),
    minutos_tardanza_total: integer("minutos_tardanza_total").notNull().default(0),
    minutos_extra_total: integer("minutos_extra_total").notNull().default(0),
    horas_extra_total: decimal("horas_extra_total", { precision: 6, scale: 2 })
      .notNull()
      .default("0"),
    sueldo_base: decimal("sueldo_base", { precision: 10, scale: 2 }).notNull(),
    valor_dia: decimal("valor_dia", { precision: 10, scale: 2 }).notNull(),
    valor_hora: decimal("valor_hora", { precision: 10, scale: 2 }).notNull(),
    descuento_tardanzas: decimal("descuento_tardanzas", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    descuento_faltas: decimal("descuento_faltas", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    monto_horas_extra: decimal("monto_horas_extra", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    bonificaciones: decimal("bonificaciones", { precision: 10, scale: 2 }).notNull().default("0"),
    otros_descuentos: decimal("otros_descuentos", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total_bruto: decimal("total_bruto", { precision: 10, scale: 2 }).notNull().default("0"),
    total_neto: decimal("total_neto", { precision: 10, scale: 2 }).notNull().default("0"),
    estado: estadoPlanillaEnum("estado").notNull().default("BORRADOR"),
    aprobado_por: uuid("aprobado_por").references(() => usuario.id),
    fecha_aprobacion: timestamp("fecha_aprobacion", { withTimezone: true }),
    fecha_pago: date("fecha_pago"),
    observaciones: text("observaciones"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uq_tenant_usuario_periodo: uniqueIndex("uq_planilla_mensual_tenant_usuario_periodo").on(
      t.tenant_id,
      t.usuario_id,
      t.periodo
    ),
  })
);

// ── planilla_detalle ───────────────────────────────────────────────────────────
export const planillaDetalle = pgTable(
  "planilla_detalle",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    planilla_id: uuid("planilla_id")
      .notNull()
      .references(() => planillaMensual.id),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    fecha: date("fecha").notNull(),
    estado_dia: estadoDiaEnum("estado_dia").notNull(),
    hora_entrada_real: timestamp("hora_entrada_real", { withTimezone: true }),
    hora_salida_real: timestamp("hora_salida_real", { withTimezone: true }),
    hora_entrada_prog: time("hora_entrada_prog").notNull(),
    hora_salida_prog: time("hora_salida_prog").notNull(),
    minutos_tardanza: integer("minutos_tardanza").notNull().default(0),
    minutos_extra: integer("minutos_extra").notNull().default(0),
    descuento_dia: decimal("descuento_dia", { precision: 8, scale: 2 }).notNull().default("0"),
    observacion: text("observacion"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uq_planilla_fecha: uniqueIndex("uq_planilla_detalle_planilla_fecha").on(t.planilla_id, t.fecha),
  })
);

// ── Relations ──────────────────────────────────────────────────────────────────
export const turnoTrabajoRelations = relations(turnoTrabajo, ({ many }) => ({
  trabajadores: many(trabajadorConfig),
  eventos: many(eventoAsistencia),
}));

export const puntoControlWifiRelations = relations(puntoControlWifi, ({ one, many }) => ({
  sucursal: one(sucursal, {
    fields: [puntoControlWifi.sucursal_id],
    references: [sucursal.id],
  }),
  eventos: many(eventoAsistencia),
}));

export const trabajadorConfigRelations = relations(trabajadorConfig, ({ one }) => ({
  usuario: one(usuario, {
    fields: [trabajadorConfig.usuario_id],
    references: [usuario.id],
  }),
  turno: one(turnoTrabajo, {
    fields: [trabajadorConfig.turno_id],
    references: [turnoTrabajo.id],
  }),
  sucursal: one(sucursal, {
    fields: [trabajadorConfig.sucursal_id],
    references: [sucursal.id],
  }),
}));

export const eventoAsistenciaRelations = relations(eventoAsistencia, ({ one }) => ({
  usuario: one(usuario, {
    fields: [eventoAsistencia.usuario_id],
    references: [usuario.id],
    relationName: "eventos_usuario",
  }),
  turno: one(turnoTrabajo, {
    fields: [eventoAsistencia.turno_id],
    references: [turnoTrabajo.id],
  }),
  punto_control: one(puntoControlWifi, {
    fields: [eventoAsistencia.punto_control_id],
    references: [puntoControlWifi.id],
  }),
  registrador: one(usuario, {
    fields: [eventoAsistencia.registrado_por],
    references: [usuario.id],
    relationName: "eventos_registrados",
  }),
}));

export const permisoAsistenciaRelations = relations(permisoAsistencia, ({ one }) => ({
  usuario: one(usuario, {
    fields: [permisoAsistencia.usuario_id],
    references: [usuario.id],
    relationName: "permisos_usuario",
  }),
  aprobador: one(usuario, {
    fields: [permisoAsistencia.aprobado_por],
    references: [usuario.id],
    relationName: "permisos_aprobados",
  }),
}));

export const planillaMensualRelations = relations(planillaMensual, ({ one, many }) => ({
  usuario: one(usuario, {
    fields: [planillaMensual.usuario_id],
    references: [usuario.id],
    relationName: "planillas_usuario",
  }),
  aprobador: one(usuario, {
    fields: [planillaMensual.aprobado_por],
    references: [usuario.id],
    relationName: "planillas_aprobadas",
  }),
  detalles: many(planillaDetalle),
}));

export const planillaDetalleRelations = relations(planillaDetalle, ({ one }) => ({
  planilla: one(planillaMensual, {
    fields: [planillaDetalle.planilla_id],
    references: [planillaMensual.id],
  }),
  usuario: one(usuario, {
    fields: [planillaDetalle.usuario_id],
    references: [usuario.id],
  }),
}));
