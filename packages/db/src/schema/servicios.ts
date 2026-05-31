import {
  CanalAceptacion,
  CanalServicio,
  EstadoOrdenServicio,
  EstadoRequerimiento,
  EstadoSkuAsignado,
  EtapaComponente,
  MetodoAceptacion,
  MotivoDevolucion,
  TipoAccionComponente,
  TipoAceptacion,
  TipoAfectacion,
  TipoItemCotizacion,
  TipoServicio,
} from "@kallpasoft/shared";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categoria, componente } from "./catalogos.js";
import { cliente } from "./clientes.js";
import { lote, producto } from "./inventario.js";
import { sucursal, tenant, usuario } from "./seguridad.js";

// ─── ENUMs ───────────────────────────────────────────────────────────────────

export const estadoOrdenServicioEnum = pgEnum("estado_orden_servicio", EstadoOrdenServicio);
export const tipoServicioEnum = pgEnum("tipo_servicio", TipoServicio);
export const canalServicioEnum = pgEnum("canal_servicio", CanalServicio);
export const tipoAfectacionEnum = pgEnum("tipo_afectacion", TipoAfectacion);
export const tipoAccionComponenteEnum = pgEnum("tipo_accion_componente", TipoAccionComponente);
export const etapaComponenteEnum = pgEnum("etapa_componente", EtapaComponente);
export const tipoItemCotizacionEnum = pgEnum("tipo_item_cotizacion", TipoItemCotizacion);
export const estadoSkuAsignadoEnum = pgEnum("estado_sku_asignado", EstadoSkuAsignado);
export const estadoRequerimientoEnum = pgEnum("estado_requerimiento", EstadoRequerimiento);
export const tipoAceptacionEnum = pgEnum("tipo_aceptacion", TipoAceptacion);
export const canalAceptacionEnum = pgEnum("canal_aceptacion", CanalAceptacion);
export const motivoDevolucionEnum = pgEnum("motivo_devolucion", MotivoDevolucion);
export const metodoAceptacionEnum = pgEnum("metodo_aceptacion", MetodoAceptacion);

// ─── Catálogos de servicios ───────────────────────────────────────────────────

export const periferico = pgTable(
  "periferico",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_periferico_tenant_categoria_nombre").on(t.tenant_id, t.categoria_id, t.nombre),
    index("idx_periferico_tenant_categoria").on(t.tenant_id, t.categoria_id),
  ]
);

export const costoRevision = pgTable(
  "costo_revision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_costo_revision_tenant_categoria").on(t.tenant_id, t.categoria_id),
    index("idx_costo_revision_tenant").on(t.tenant_id),
  ]
);

// ─── Instancia ────────────────────────────────────────────────────────────────

export const instancia = pgTable(
  "instancia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    cliente_id: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id),
    producto_id: uuid("producto_id")
      .notNull()
      .references(() => producto.id),
    numero_serie: varchar("numero_serie", { length: 100 }),
    activo: boolean("activo").notNull().default(true),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_instancia_tenant_cliente").on(t.tenant_id, t.cliente_id),
    index("idx_instancia_tenant_producto").on(t.tenant_id, t.producto_id),
  ]
);

export const instanciaImagen = pgTable(
  "instancia_imagen",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    instancia_id: uuid("instancia_id")
      .notNull()
      .references(() => instancia.id),
    url: text("url").notNull(),
    descripcion: text("descripcion"),
    orden: integer("orden").notNull().default(1),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_instancia_imagen_instancia").on(t.instancia_id)]
);

// ─── Orden de servicio ────────────────────────────────────────────────────────

export const ordenServicio = pgTable(
  "orden_servicio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    instancia_id: uuid("instancia_id")
      .notNull()
      .references(() => instancia.id),
    sucursal_id: uuid("sucursal_id").references(() => sucursal.id),
    canal: canalServicioEnum("canal").notNull().default("TIENDA"),
    tipo_servicio: tipoServicioEnum("tipo_servicio").notNull().default("REPARACION"),
    falla_ingreso: text("falla_ingreso").notNull(),
    diagnostico_tecnico: text("diagnostico_tecnico"),
    solucion: text("solucion"),
    costo_revision: decimal("costo_revision", { precision: 10, scale: 2 }).notNull(),
    estado: estadoOrdenServicioEnum("estado").notNull().default("VALIDACION"),
    motivo_devolucion: motivoDevolucionEnum("motivo_devolucion"),
    tecnico_id: uuid("tecnico_id").references(() => usuario.id),
    vendedor_id: uuid("vendedor_id").references(() => usuario.id),
    preventivo_accepted: boolean("preventivo_accepted"),
    venta_id: uuid("venta_id"),
    orden_padre_id: uuid("orden_padre_id"),
    visita_domicilio_id: uuid("visita_domicilio_id"),
    lead_id: uuid("lead_id"),
    created_by: uuid("created_by").references(() => usuario.id),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_os_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_os_tenant_instancia").on(t.tenant_id, t.instancia_id),
    index("idx_os_tenant_tecnico").on(t.tenant_id, t.tecnico_id),
    index("idx_os_tenant_codigo").on(t.tenant_id, t.codigo),
    index("idx_os_tenant_canal").on(t.tenant_id, t.canal),
  ]
);

// ─── Tablas hija de orden_servicio ────────────────────────────────────────────

export const ordenServicioPeriferico = pgTable(
  "orden_servicio_periferico",
  {
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    periferico_id: uuid("periferico_id")
      .notNull()
      .references(() => periferico.id),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.orden_servicio_id, t.periferico_id] })]
);

export const ordenServicioComponente = pgTable(
  "orden_servicio_componente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    componente_id: uuid("componente_id")
      .notNull()
      .references(() => componente.id),
    tipo_afectacion: tipoAfectacionEnum("tipo_afectacion").notNull(),
    tipo_accion: tipoAccionComponenteEnum("tipo_accion").notNull().default("REPARACION"),
    etapa: etapaComponenteEnum("etapa").notNull(),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osc_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioCotizacion = pgTable(
  "orden_servicio_cotizacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    tipo_item: tipoItemCotizacionEnum("tipo_item").notNull(),
    producto_id: uuid("producto_id").references(() => producto.id),
    componente_id: uuid("componente_id").references(() => componente.id),
    descripcion_manual: text("descripcion_manual"),
    cantidad: integer("cantidad").notNull().default(1),
    precio_unitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    es_preventivo: boolean("es_preventivo").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_oscot_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioEvidencia = pgTable(
  "orden_servicio_evidencia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    url: text("url").notNull(),
    etapa: varchar("etapa", { length: 30 }),
    descripcion: text("descripcion"),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osev_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioSkuAsignado = pgTable(
  "orden_servicio_sku_asignado",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    lote_id: uuid("lote_id")
      .notNull()
      .references(() => lote.id),
    producto_id: uuid("producto_id")
      .notNull()
      .references(() => producto.id),
    cantidad: integer("cantidad").notNull().default(1),
    precio_presupuesto: decimal("precio_presupuesto", { precision: 10, scale: 2 }).notNull(),
    estado: estadoSkuAsignadoEnum("estado").notNull().default("ASIGNADO"),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_ossku_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioRequerimiento = pgTable(
  "orden_servicio_requerimiento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    producto_id: uuid("producto_id").references(() => producto.id),
    imagen_url: text("imagen_url"),
    descripcion: text("descripcion").notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    observacion: text("observacion"),
    estado: estadoRequerimientoEnum("estado").notNull().default("PENDIENTE"),
    created_by: uuid("created_by").references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osreq_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioAceptacion = pgTable(
  "orden_servicio_aceptacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    tipo: tipoAceptacionEnum("tipo").notNull(),
    canal_aceptacion: canalAceptacionEnum("canal_aceptacion").notNull(),
    accepted_at: timestamp("accepted_at", { withTimezone: true }).notNull(),
    ip_address: varchar("ip_address", { length: 45 }),
    documento_version: varchar("documento_version", { length: 20 }),
    texto_mostrado: text("texto_mostrado"),
    metodo_aceptacion: metodoAceptacionEnum("metodo_aceptacion"),
    approved_by: uuid("approved_by").references(() => usuario.id),
    manual_reason: varchar("manual_reason", { length: 20 }),
    evidence_image_url: text("evidence_image_url"),
    preventivo_accepted: boolean("preventivo_accepted"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osac_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioHistorial = pgTable(
  "orden_servicio_historial",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    estado_anterior: varchar("estado_anterior", { length: 30 }).notNull(),
    estado_nuevo: varchar("estado_nuevo", { length: 30 }).notNull(),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    observacion: text("observacion"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osh_orden_servicio").on(t.orden_servicio_id)]
);

export const ordenServicioObservacion = pgTable(
  "orden_servicio_observacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_servicio_id: uuid("orden_servicio_id")
      .notNull()
      .references(() => ordenServicio.id),
    etapa: varchar("etapa", { length: 30 }).notNull(),
    texto: text("texto").notNull(),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osob_orden_servicio").on(t.orden_servicio_id)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const perifericoRelations = relations(periferico, ({ one }) => ({
  tenant: one(tenant, { fields: [periferico.tenant_id], references: [tenant.id] }),
  categoria: one(categoria, { fields: [periferico.categoria_id], references: [categoria.id] }),
}));

export const costoRevisionRelations = relations(costoRevision, ({ one }) => ({
  tenant: one(tenant, { fields: [costoRevision.tenant_id], references: [tenant.id] }),
  categoria: one(categoria, { fields: [costoRevision.categoria_id], references: [categoria.id] }),
  creado_por: one(usuario, { fields: [costoRevision.created_by], references: [usuario.id] }),
}));

export const instanciaRelations = relations(instancia, ({ one, many }) => ({
  tenant: one(tenant, { fields: [instancia.tenant_id], references: [tenant.id] }),
  cliente: one(cliente, { fields: [instancia.cliente_id], references: [cliente.id] }),
  producto: one(producto, { fields: [instancia.producto_id], references: [producto.id] }),
  imagenes: many(instanciaImagen),
  ordenes: many(ordenServicio),
}));

export const instanciaImagenRelations = relations(instanciaImagen, ({ one }) => ({
  tenant: one(tenant, { fields: [instanciaImagen.tenant_id], references: [tenant.id] }),
  instancia: one(instancia, {
    fields: [instanciaImagen.instancia_id],
    references: [instancia.id],
  }),
}));

export const ordenServicioRelations = relations(ordenServicio, ({ one, many }) => ({
  tenant: one(tenant, { fields: [ordenServicio.tenant_id], references: [tenant.id] }),
  instancia: one(instancia, { fields: [ordenServicio.instancia_id], references: [instancia.id] }),
  sucursal: one(sucursal, { fields: [ordenServicio.sucursal_id], references: [sucursal.id] }),
  tecnico: one(usuario, {
    fields: [ordenServicio.tecnico_id],
    references: [usuario.id],
    relationName: "os_tecnico",
  }),
  vendedor: one(usuario, {
    fields: [ordenServicio.vendedor_id],
    references: [usuario.id],
    relationName: "os_vendedor",
  }),
  creado_por: one(usuario, {
    fields: [ordenServicio.created_by],
    references: [usuario.id],
    relationName: "os_creado_por",
  }),
  orden_padre: one(ordenServicio, {
    fields: [ordenServicio.orden_padre_id],
    references: [ordenServicio.id],
    relationName: "os_garantia",
  }),
  ordenes_hijas: many(ordenServicio, { relationName: "os_garantia" }),
  perifericos: many(ordenServicioPeriferico),
  componentes: many(ordenServicioComponente),
  cotizacion: many(ordenServicioCotizacion),
  evidencias: many(ordenServicioEvidencia),
  skus_asignados: many(ordenServicioSkuAsignado),
  requerimientos: many(ordenServicioRequerimiento),
  aceptaciones: many(ordenServicioAceptacion),
  historial: many(ordenServicioHistorial),
  observaciones: many(ordenServicioObservacion),
}));

export const ordenServicioPerifericoRelations = relations(ordenServicioPeriferico, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioPeriferico.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioPeriferico.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  periferico: one(periferico, {
    fields: [ordenServicioPeriferico.periferico_id],
    references: [periferico.id],
  }),
}));

export const ordenServicioComponenteRelations = relations(ordenServicioComponente, ({ one }) => ({
  tenant: one(tenant, { fields: [ordenServicioComponente.tenant_id], references: [tenant.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioComponente.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  componente: one(componente, {
    fields: [ordenServicioComponente.componente_id],
    references: [componente.id],
  }),
  creado_por: one(usuario, {
    fields: [ordenServicioComponente.created_by],
    references: [usuario.id],
  }),
}));

export const ordenServicioCotizacionRelations = relations(ordenServicioCotizacion, ({ one }) => ({
  tenant: one(tenant, { fields: [ordenServicioCotizacion.tenant_id], references: [tenant.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioCotizacion.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  producto: one(producto, {
    fields: [ordenServicioCotizacion.producto_id],
    references: [producto.id],
  }),
  componente: one(componente, {
    fields: [ordenServicioCotizacion.componente_id],
    references: [componente.id],
  }),
}));

export const ordenServicioEvidenciaRelations = relations(ordenServicioEvidencia, ({ one }) => ({
  tenant: one(tenant, { fields: [ordenServicioEvidencia.tenant_id], references: [tenant.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioEvidencia.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  creado_por: one(usuario, {
    fields: [ordenServicioEvidencia.created_by],
    references: [usuario.id],
  }),
}));

export const ordenServicioSkuAsignadoRelations = relations(ordenServicioSkuAsignado, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioSkuAsignado.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioSkuAsignado.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  lote: one(lote, { fields: [ordenServicioSkuAsignado.lote_id], references: [lote.id] }),
  producto: one(producto, {
    fields: [ordenServicioSkuAsignado.producto_id],
    references: [producto.id],
  }),
  creado_por: one(usuario, {
    fields: [ordenServicioSkuAsignado.created_by],
    references: [usuario.id],
  }),
}));

export const ordenServicioRequerimientoRelations = relations(
  ordenServicioRequerimiento,
  ({ one }) => ({
    tenant: one(tenant, {
      fields: [ordenServicioRequerimiento.tenant_id],
      references: [tenant.id],
    }),
    ordenServicio: one(ordenServicio, {
      fields: [ordenServicioRequerimiento.orden_servicio_id],
      references: [ordenServicio.id],
    }),
    producto: one(producto, {
      fields: [ordenServicioRequerimiento.producto_id],
      references: [producto.id],
    }),
    creado_por: one(usuario, {
      fields: [ordenServicioRequerimiento.created_by],
      references: [usuario.id],
    }),
  })
);

export const ordenServicioAceptacionRelations = relations(ordenServicioAceptacion, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioAceptacion.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioAceptacion.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  aprobado_por: one(usuario, {
    fields: [ordenServicioAceptacion.approved_by],
    references: [usuario.id],
  }),
}));

export const ordenServicioHistorialRelations = relations(ordenServicioHistorial, ({ one }) => ({
  tenant: one(tenant, { fields: [ordenServicioHistorial.tenant_id], references: [tenant.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioHistorial.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  usuario: one(usuario, {
    fields: [ordenServicioHistorial.usuario_id],
    references: [usuario.id],
  }),
}));

export const ordenServicioObservacionRelations = relations(ordenServicioObservacion, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioObservacion.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioObservacion.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  usuario: one(usuario, {
    fields: [ordenServicioObservacion.usuario_id],
    references: [usuario.id],
  }),
}));
