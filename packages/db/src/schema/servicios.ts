import { EstadoOrdenServicio, MomentoEvidencia, TipoServicio } from "@kallpasoft/shared";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categoria, componente, marca, modelo } from "./catalogos.js";
import { cliente } from "./clientes.js";
import { producto } from "./inventario.js";
import { sucursal, tenant, usuario } from "./seguridad.js";

export const estadoOrdenServicioEnum = pgEnum("estado_orden_servicio", EstadoOrdenServicio);
export const tipoServicioEnum = pgEnum("tipo_servicio", TipoServicio);
export const momentoEvidenciaEnum = pgEnum("momento_evidencia", MomentoEvidencia);

export const ordenServicio = pgTable(
  "orden_servicio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    sucursal_id: uuid("sucursal_id")
      .notNull()
      .references(() => sucursal.id),
    cliente_id: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id),
    tecnico_id: uuid("tecnico_id").references(() => usuario.id),
    recibido_por_id: uuid("recibido_por_id")
      .notNull()
      .references(() => usuario.id),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    marca_id: uuid("marca_id").references(() => marca.id),
    modelo_id: uuid("modelo_id").references(() => modelo.id),
    serie_equipo: varchar("serie_equipo", { length: 50 }),
    color_equipo: varchar("color_equipo", { length: 30 }),
    estado: estadoOrdenServicioEnum("estado").notNull().default("RECEPCION"),
    problema_reportado: text("problema_reportado").notNull(),
    diagnostico_tecnico: text("diagnostico_tecnico"),
    solucion_aplicada: text("solucion_aplicada"),
    tipo_servicio: tipoServicioEnum("tipo_servicio").notNull().default("CORRECTIVO"),
    fecha_recepcion: timestamp("fecha_recepcion", { withTimezone: true }).notNull().defaultNow(),
    fecha_diagnostico: timestamp("fecha_diagnostico", { withTimezone: true }),
    fecha_inicio_reparacion: timestamp("fecha_inicio_reparacion", { withTimezone: true }),
    fecha_terminado: timestamp("fecha_terminado", { withTimezone: true }),
    fecha_entrega: timestamp("fecha_entrega", { withTimezone: true }),
    prioridad: varchar("prioridad", { length: 10 }).notNull().default("NORMAL"),
    visita_domicilio_id: uuid("visita_domicilio_id"),
    notas_internas: text("notas_internas"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_os_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_os_tenant_cliente").on(t.tenant_id, t.cliente_id),
    index("idx_os_tenant_tecnico").on(t.tenant_id, t.tecnico_id),
    index("idx_os_tenant_codigo").on(t.tenant_id, t.codigo),
  ]
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
    es_preliminar: boolean("es_preliminar").notNull().default(true),
    estado_componente: varchar("estado_componente", { length: 20 }).notNull(),
    notas: text("notas"),
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
    producto_id: uuid("producto_id").references(() => producto.id),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    tipo: varchar("tipo", { length: 15 }).notNull(),
    aprobado_cliente: boolean("aprobado_cliente"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
    url: varchar("url", { length: 500 }).notNull(),
    tipo_archivo: varchar("tipo_archivo", { length: 10 }).notNull(),
    momento: momentoEvidenciaEnum("momento").notNull(),
    descripcion: varchar("descripcion", { length: 200 }),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_osev_orden_servicio").on(t.orden_servicio_id)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const ordenServicioRelations = relations(ordenServicio, ({ one, many }) => ({
  tenant: one(tenant, { fields: [ordenServicio.tenant_id], references: [tenant.id] }),
  sucursal: one(sucursal, { fields: [ordenServicio.sucursal_id], references: [sucursal.id] }),
  cliente: one(cliente, { fields: [ordenServicio.cliente_id], references: [cliente.id] }),
  tecnico: one(usuario, {
    fields: [ordenServicio.tecnico_id],
    references: [usuario.id],
    relationName: "tecnico",
  }),
  recibido_por: one(usuario, {
    fields: [ordenServicio.recibido_por_id],
    references: [usuario.id],
    relationName: "recibido_por",
  }),
  categoria: one(categoria, { fields: [ordenServicio.categoria_id], references: [categoria.id] }),
  marca: one(marca, { fields: [ordenServicio.marca_id], references: [marca.id] }),
  modelo: one(modelo, { fields: [ordenServicio.modelo_id], references: [modelo.id] }),
  componentes: many(ordenServicioComponente),
  cotizacion: many(ordenServicioCotizacion),
  evidencias: many(ordenServicioEvidencia),
}));

export const ordenServicioComponenteRelations = relations(ordenServicioComponente, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioComponente.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioComponente.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  componente: one(componente, {
    fields: [ordenServicioComponente.componente_id],
    references: [componente.id],
  }),
}));

export const ordenServicioCotizacionRelations = relations(ordenServicioCotizacion, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioCotizacion.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioCotizacion.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  producto: one(producto, {
    fields: [ordenServicioCotizacion.producto_id],
    references: [producto.id],
  }),
}));

export const ordenServicioEvidenciaRelations = relations(ordenServicioEvidencia, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenServicioEvidencia.tenant_id],
    references: [tenant.id],
  }),
  ordenServicio: one(ordenServicio, {
    fields: [ordenServicioEvidencia.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  usuario: one(usuario, {
    fields: [ordenServicioEvidencia.usuario_id],
    references: [usuario.id],
  }),
}));
