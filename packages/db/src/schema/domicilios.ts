import { EstadoVisita } from "@kallpasoft/shared";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cliente, clienteDireccion } from "./clientes.js";
import { tenant, usuario } from "./seguridad.js";
import { ordenServicio } from "./servicios.js";
import { venta } from "./ventas.js";

export const estadoVisitaEnum = pgEnum("estado_visita", EstadoVisita);

export const tarifaDistrito = pgTable(
  "tarifa_distrito",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    distrito: varchar("distrito", { length: 100 }).notNull(),
    provincia: varchar("provincia", { length: 100 }).notNull().default("Lima"),
    tarifa: decimal("tarifa", { precision: 12, scale: 2 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_tarifa_distrito_tenant_distrito").on(t.tenant_id, t.distrito),
    index("idx_tarifa_distrito_tenant").on(t.tenant_id),
  ]
);

export const visitaDomicilio = pgTable(
  "visita_domicilio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    cliente_id: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id),
    direccion_id: uuid("direccion_id").references(() => clienteDireccion.id),
    direccion_texto: varchar("direccion_texto", { length: 255 }).notNull(),
    distrito: varchar("distrito", { length: 100 }).notNull(),
    tecnico_id: uuid("tecnico_id").references(() => usuario.id),
    fecha_programada: date("fecha_programada").notNull(),
    hora_inicio: time("hora_inicio"),
    hora_fin: time("hora_fin"),
    estado: estadoVisitaEnum("estado").notNull().default("POR_VALIDAR"),
    tarifa: decimal("tarifa", { precision: 12, scale: 2 }).notNull().default("0"),
    motivo_visita: text("motivo_visita"),
    diagnostico_campo: text("diagnostico_campo"),
    orden_servicio_id: uuid("orden_servicio_id").references(() => ordenServicio.id),
    venta_id: uuid("venta_id").references(() => venta.id),
    motivo_cancelacion: text("motivo_cancelacion"),
    notas: text("notas"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_visita_domicilio_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_visita_domicilio_tenant_tecnico").on(t.tenant_id, t.tecnico_id),
    index("idx_visita_domicilio_tenant_cliente").on(t.tenant_id, t.cliente_id),
    index("idx_visita_domicilio_tenant_fecha").on(t.tenant_id, t.fecha_programada),
    index("idx_visita_domicilio_codigo").on(t.tenant_id, t.codigo),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const tarifaDistritoRelations = relations(tarifaDistrito, ({ one }) => ({
  tenant: one(tenant, { fields: [tarifaDistrito.tenant_id], references: [tenant.id] }),
}));

export const visitaDomicilioRelations = relations(visitaDomicilio, ({ one }) => ({
  tenant: one(tenant, { fields: [visitaDomicilio.tenant_id], references: [tenant.id] }),
  cliente: one(cliente, { fields: [visitaDomicilio.cliente_id], references: [cliente.id] }),
  direccion: one(clienteDireccion, {
    fields: [visitaDomicilio.direccion_id],
    references: [clienteDireccion.id],
  }),
  tecnico: one(usuario, { fields: [visitaDomicilio.tecnico_id], references: [usuario.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [visitaDomicilio.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  venta: one(venta, { fields: [visitaDomicilio.venta_id], references: [venta.id] }),
}));
