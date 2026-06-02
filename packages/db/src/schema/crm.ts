import {
  AsignadoPorEtiqueta,
  DireccionMensaje,
  EstadoConversacion,
  EstadoMetaPlantilla,
  GrupoEtiqueta,
  ModoConversacion,
  OperadorEtapa,
  OrigenEvento,
  OrigenMensaje,
  OrigenNota,
  TipoBot,
  TipoMensaje,
} from "@kallpasoft/shared";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cliente } from "./clientes.js";
import { sucursal, tenant, usuario } from "./seguridad.js";

// ── Bytea para access_token_encrypted ──────────────────────────────────────────
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ── Enums ──────────────────────────────────────────────────────────────────────
export const operadorEtapaEnum = pgEnum("operador_etapa", OperadorEtapa);
export const modoConversacionEnum = pgEnum("modo_conversacion", ModoConversacion);
export const estadoConversacionEnum = pgEnum("estado_conversacion", EstadoConversacion);
export const direccionMensajeEnum = pgEnum("direccion_mensaje", DireccionMensaje);
export const origenMensajeEnum = pgEnum("origen_mensaje", OrigenMensaje);
export const tipoMensajeEnum = pgEnum("tipo_mensaje", TipoMensaje);
export const grupoEtiquetaEnum = pgEnum("grupo_etiqueta", GrupoEtiqueta);
export const tipoBotEnum = pgEnum("tipo_bot", TipoBot);
export const estadoMetaPlantillaEnum = pgEnum("estado_meta_plantilla", EstadoMetaPlantilla);
export const origenNotaEnum = pgEnum("origen_nota", OrigenNota);
export const origenEventoEnum = pgEnum("origen_evento", OrigenEvento);
export const asignadoPorEtiquetaEnum = pgEnum("asignado_por_etiqueta", AsignadoPorEtiqueta);

// ── wa_cuenta ──────────────────────────────────────────────────────────────────
export const waCuenta = pgTable(
  "wa_cuenta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    negocio_nombre: varchar("negocio_nombre", { length: 100 }).notNull(),
    phone_number_id: varchar("phone_number_id", { length: 50 }).notNull(),
    waba_id: varchar("waba_id", { length: 50 }).notNull(),
    access_token_encrypted: bytea("access_token_encrypted").notNull(),
    webhook_verify_token: varchar("webhook_verify_token", { length: 100 }).notNull(),
    nombre: varchar("nombre", { length: 100 }),
    activo: boolean("activo").notNull().default(true),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_wa_cuenta_phone_number_id").on(t.phone_number_id)]
);

// ── crm_bot ────────────────────────────────────────────────────────────────────
export const crmBot = pgTable(
  "crm_bot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    tipo: tipoBotEnum("tipo").notNull(),
    config: jsonb("config").notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_crm_bot_tenant_codigo").on(t.tenant_id, t.codigo)]
);

// ── crm_agente ─────────────────────────────────────────────────────────────────
export const crmAgente = pgTable("crm_agente", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  nombre: varchar("nombre", { length: 50 }).notNull(),
  canal: varchar("canal", { length: 20 }).notNull().default("WHATSAPP"),
  modelo_ia: varchar("modelo_ia", { length: 50 }).notNull(),
  tono: text("tono"),
  prompt_base: text("prompt_base"),
  max_mensajes_contexto: integer("max_mensajes_contexto").notNull().default(20),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── crm_etapa ──────────────────────────────────────────────────────────────────
export const crmEtapa = pgTable(
  "crm_etapa",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    orden: integer("orden").notNull(),
    objetivo: text("objetivo"),
    operador: operadorEtapaEnum("operador").notNull(),
    bot_id: uuid("bot_id").references(() => crmBot.id),
    tiempo_espera_horas: integer("tiempo_espera_horas").default(24),
    max_intentos_recordatorio: integer("max_intentos_recordatorio").default(3),
    color: varchar("color", { length: 7 }),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_crm_etapa_tenant_codigo").on(t.tenant_id, t.codigo),
    index("idx_crm_etapa_tenant_orden").on(t.tenant_id, t.orden),
  ]
);

// ── crm_etapa_transicion ───────────────────────────────────────────────────────
export const crmEtapaTransicion = pgTable(
  "crm_etapa_transicion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    etapa_origen_id: uuid("etapa_origen_id")
      .notNull()
      .references(() => crmEtapa.id),
    etapa_destino_id: uuid("etapa_destino_id")
      .notNull()
      .references(() => crmEtapa.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_crm_etapa_transicion").on(t.etapa_origen_id, t.etapa_destino_id)]
);

// ── crm_etiqueta ───────────────────────────────────────────────────────────────
export const crmEtiqueta = pgTable(
  "crm_etiqueta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 50 }).notNull(),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    grupo: grupoEtiquetaEnum("grupo").notNull(),
    descripcion: text("descripcion"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_crm_etiqueta_tenant_codigo").on(t.tenant_id, t.codigo)]
);

// ── crm_lead ───────────────────────────────────────────────────────────────────
export const crmLead = pgTable(
  "crm_lead",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    wa_cuenta_id: uuid("wa_cuenta_id")
      .notNull()
      .references(() => waCuenta.id),
    celular: varchar("celular", { length: 20 }).notNull(),
    nombre: varchar("nombre", { length: 150 }),
    equipo_descripcion: text("equipo_descripcion"),
    falla_descripcion: text("falla_descripcion"),
    ubicacion: text("ubicacion"),
    etapa_id: uuid("etapa_id")
      .notNull()
      .references(() => crmEtapa.id),
    vendedor_id: uuid("vendedor_id").references(() => usuario.id),
    cliente_id: uuid("cliente_id").references(() => cliente.id),
    sucursal_id: uuid("sucursal_id").references(() => sucursal.id),
    utm_source: varchar("utm_source", { length: 50 }),
    utm_campaign: varchar("utm_campaign", { length: 100 }),
    utm_medium: varchar("utm_medium", { length: 50 }),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_crm_lead_tenant_etapa").on(t.tenant_id, t.etapa_id),
    index("idx_crm_lead_tenant_celular").on(t.tenant_id, t.celular),
    index("idx_crm_lead_tenant_created").on(t.tenant_id, t.created_at),
  ]
);

// ── crm_lead_etiqueta ──────────────────────────────────────────────────────────
export const crmLeadEtiqueta = pgTable(
  "crm_lead_etiqueta",
  {
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => crmLead.id),
    etiqueta_id: uuid("etiqueta_id")
      .notNull()
      .references(() => crmEtiqueta.id),
    asignado_por: asignadoPorEtiquetaEnum("asignado_por")
      .notNull()
      .default(AsignadoPorEtiqueta.SISTEMA),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.lead_id, t.etiqueta_id] })]
);

// ── crm_conversacion ───────────────────────────────────────────────────────────
export const crmConversacion = pgTable(
  "crm_conversacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    wa_cuenta_id: uuid("wa_cuenta_id")
      .notNull()
      .references(() => waCuenta.id),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => crmLead.id),
    celular: varchar("celular", { length: 20 }).notNull(),
    modo: modoConversacionEnum("modo").notNull().default(ModoConversacion.NICO),
    estado: estadoConversacionEnum("estado").notNull().default(EstadoConversacion.ACTIVA),
    ultimo_mensaje_at: timestamp("ultimo_mensaje_at", { withTimezone: true }),
    mensajes_sin_leer: integer("mensajes_sin_leer").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_crm_conv_tenant_lead").on(t.tenant_id, t.lead_id),
    index("idx_crm_conv_tenant_estado").on(t.tenant_id, t.estado),
  ]
);

// ── crm_mensaje ────────────────────────────────────────────────────────────────
export const crmMensaje = pgTable(
  "crm_mensaje",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    conversacion_id: uuid("conversacion_id")
      .notNull()
      .references(() => crmConversacion.id),
    wa_message_id: varchar("wa_message_id", { length: 100 }),
    direccion: direccionMensajeEnum("direccion").notNull(),
    origen: origenMensajeEnum("origen").notNull(),
    tipo: tipoMensajeEnum("tipo").notNull().default(TipoMensaje.TEXTO),
    contenido: text("contenido"),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Partial unique: idempotencia Meta — solo cuando wa_message_id está presente
    uniqueIndex("uq_crm_mensaje_wa_id")
      .on(t.wa_message_id)
      .where(sql`${t.wa_message_id} IS NOT NULL`),
    index("idx_crm_mensaje_conversacion").on(t.conversacion_id),
  ]
);

// ── crm_nota ───────────────────────────────────────────────────────────────────
export const crmNota = pgTable("crm_nota", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  lead_id: uuid("lead_id")
    .notNull()
    .references(() => crmLead.id),
  contenido: text("contenido").notNull(),
  origen: origenNotaEnum("origen").notNull(),
  created_by: uuid("created_by").references(() => usuario.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── crm_accion_agente ──────────────────────────────────────────────────────────
export const crmAccionAgente = pgTable(
  "crm_accion_agente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    agente_id: uuid("agente_id")
      .notNull()
      .references(() => crmAgente.id),
    conversacion_id: uuid("conversacion_id")
      .notNull()
      .references(() => crmConversacion.id),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => crmLead.id),
    tool_name: varchar("tool_name", { length: 100 }).notNull(),
    tool_input: jsonb("tool_input"),
    tool_output: jsonb("tool_output"),
    exitoso: boolean("exitoso").notNull(),
    duracion_ms: integer("duracion_ms"),
    error: text("error"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_crm_accion_tenant_agente").on(t.tenant_id, t.agente_id),
    index("idx_crm_accion_tenant_created").on(t.tenant_id, t.created_at),
  ]
);

// ── crm_plantilla ──────────────────────────────────────────────────────────────
export const crmPlantilla = pgTable("crm_plantilla", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  contenido: text("contenido").notNull(),
  variables: jsonb("variables"),
  meta_template_name: varchar("meta_template_name", { length: 100 }),
  estado_meta: estadoMetaPlantillaEnum("estado_meta")
    .notNull()
    .default(EstadoMetaPlantilla.PENDIENTE),
  created_by: uuid("created_by").references(() => usuario.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── crm_evento ─────────────────────────────────────────────────────────────────
export const crmEvento = pgTable(
  "crm_evento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    tipo: varchar("tipo", { length: 50 }).notNull(),
    origen: origenEventoEnum("origen").notNull(),
    lead_id: uuid("lead_id").references(() => crmLead.id),
    conversacion_id: uuid("conversacion_id").references(() => crmConversacion.id),
    datos: jsonb("datos"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_crm_evento_tenant_lead").on(t.tenant_id, t.lead_id),
    index("idx_crm_evento_tenant_created").on(t.tenant_id, t.created_at),
  ]
);

// ── crm_mensaje_interno ────────────────────────────────────────────────────────
export const crmMensajeInterno = pgTable(
  "crm_mensaje_interno",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    remitente_id: uuid("remitente_id")
      .notNull()
      .references(() => usuario.id),
    destinatario_id: uuid("destinatario_id")
      .notNull()
      .references(() => usuario.id),
    contenido: text("contenido").notNull(),
    leido: boolean("leido").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_crm_msg_interno_destinatario").on(t.destinatario_id, t.leido)]
);

// ── Relations ──────────────────────────────────────────────────────────────────

export const waCuentaRelations = relations(waCuenta, ({ one, many }) => ({
  tenant: one(tenant, { fields: [waCuenta.tenant_id], references: [tenant.id] }),
  createdBy: one(usuario, { fields: [waCuenta.created_by], references: [usuario.id] }),
  leads: many(crmLead),
  conversaciones: many(crmConversacion),
}));

export const crmBotRelations = relations(crmBot, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmBot.tenant_id], references: [tenant.id] }),
  etapas: many(crmEtapa),
}));

export const crmAgenteRelations = relations(crmAgente, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmAgente.tenant_id], references: [tenant.id] }),
  acciones: many(crmAccionAgente),
}));

export const crmEtapaRelations = relations(crmEtapa, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmEtapa.tenant_id], references: [tenant.id] }),
  bot: one(crmBot, { fields: [crmEtapa.bot_id], references: [crmBot.id] }),
  leads: many(crmLead),
  transicionesOrigen: many(crmEtapaTransicion, { relationName: "etapa_origen" }),
  transicionesDestino: many(crmEtapaTransicion, { relationName: "etapa_destino" }),
}));

export const crmEtapaTransicionRelations = relations(crmEtapaTransicion, ({ one }) => ({
  tenant: one(tenant, { fields: [crmEtapaTransicion.tenant_id], references: [tenant.id] }),
  etapaOrigen: one(crmEtapa, {
    fields: [crmEtapaTransicion.etapa_origen_id],
    references: [crmEtapa.id],
    relationName: "etapa_origen",
  }),
  etapaDestino: one(crmEtapa, {
    fields: [crmEtapaTransicion.etapa_destino_id],
    references: [crmEtapa.id],
    relationName: "etapa_destino",
  }),
}));

export const crmEtiquetaRelations = relations(crmEtiqueta, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmEtiqueta.tenant_id], references: [tenant.id] }),
  leadEtiquetas: many(crmLeadEtiqueta),
}));

export const crmLeadRelations = relations(crmLead, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmLead.tenant_id], references: [tenant.id] }),
  waCuenta: one(waCuenta, { fields: [crmLead.wa_cuenta_id], references: [waCuenta.id] }),
  etapa: one(crmEtapa, { fields: [crmLead.etapa_id], references: [crmEtapa.id] }),
  vendedor: one(usuario, { fields: [crmLead.vendedor_id], references: [usuario.id] }),
  cliente: one(cliente, { fields: [crmLead.cliente_id], references: [cliente.id] }),
  sucursal: one(sucursal, { fields: [crmLead.sucursal_id], references: [sucursal.id] }),
  etiquetas: many(crmLeadEtiqueta),
  conversaciones: many(crmConversacion),
  notas: many(crmNota),
  acciones: many(crmAccionAgente),
  eventos: many(crmEvento),
}));

export const crmLeadEtiquetaRelations = relations(crmLeadEtiqueta, ({ one }) => ({
  lead: one(crmLead, { fields: [crmLeadEtiqueta.lead_id], references: [crmLead.id] }),
  etiqueta: one(crmEtiqueta, {
    fields: [crmLeadEtiqueta.etiqueta_id],
    references: [crmEtiqueta.id],
  }),
}));

export const crmConversacionRelations = relations(crmConversacion, ({ one, many }) => ({
  tenant: one(tenant, { fields: [crmConversacion.tenant_id], references: [tenant.id] }),
  waCuenta: one(waCuenta, {
    fields: [crmConversacion.wa_cuenta_id],
    references: [waCuenta.id],
  }),
  lead: one(crmLead, { fields: [crmConversacion.lead_id], references: [crmLead.id] }),
  mensajes: many(crmMensaje),
  acciones: many(crmAccionAgente),
  eventos: many(crmEvento),
}));

export const crmMensajeRelations = relations(crmMensaje, ({ one }) => ({
  conversacion: one(crmConversacion, {
    fields: [crmMensaje.conversacion_id],
    references: [crmConversacion.id],
  }),
}));

export const crmNotaRelations = relations(crmNota, ({ one }) => ({
  lead: one(crmLead, { fields: [crmNota.lead_id], references: [crmLead.id] }),
  createdBy: one(usuario, { fields: [crmNota.created_by], references: [usuario.id] }),
}));

export const crmAccionAgenteRelations = relations(crmAccionAgente, ({ one }) => ({
  agente: one(crmAgente, { fields: [crmAccionAgente.agente_id], references: [crmAgente.id] }),
  conversacion: one(crmConversacion, {
    fields: [crmAccionAgente.conversacion_id],
    references: [crmConversacion.id],
  }),
  lead: one(crmLead, { fields: [crmAccionAgente.lead_id], references: [crmLead.id] }),
}));

export const crmPlantillaRelations = relations(crmPlantilla, ({ one }) => ({
  tenant: one(tenant, { fields: [crmPlantilla.tenant_id], references: [tenant.id] }),
  createdBy: one(usuario, { fields: [crmPlantilla.created_by], references: [usuario.id] }),
}));

export const crmEventoRelations = relations(crmEvento, ({ one }) => ({
  tenant: one(tenant, { fields: [crmEvento.tenant_id], references: [tenant.id] }),
  lead: one(crmLead, { fields: [crmEvento.lead_id], references: [crmLead.id] }),
  conversacion: one(crmConversacion, {
    fields: [crmEvento.conversacion_id],
    references: [crmConversacion.id],
  }),
}));

export const crmMensajeInternoRelations = relations(crmMensajeInterno, ({ one }) => ({
  tenant: one(tenant, { fields: [crmMensajeInterno.tenant_id], references: [tenant.id] }),
  remitente: one(usuario, {
    fields: [crmMensajeInterno.remitente_id],
    references: [usuario.id],
    relationName: "mensaje_interno_remitente",
  }),
  destinatario: one(usuario, {
    fields: [crmMensajeInterno.destinatario_id],
    references: [usuario.id],
    relationName: "mensaje_interno_destinatario",
  }),
}));
