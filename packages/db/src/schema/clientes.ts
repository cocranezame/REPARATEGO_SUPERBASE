import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenant, tipoDocumentoEnum } from "./seguridad.js";

export const cliente = pgTable(
  "cliente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    tipo_documento: tipoDocumentoEnum("tipo_documento").notNull(),
    numero_documento: varchar("numero_documento", { length: 20 }).notNull(),
    tipo_persona: varchar("tipo_persona", { length: 10 }).notNull().default("NATURAL"),
    nombres: varchar("nombres", { length: 100 }),
    apellidos: varchar("apellidos", { length: 100 }),
    razon_social: varchar("razon_social", { length: 200 }),
    email: varchar("email", { length: 150 }),
    telefono: varchar("telefono", { length: 20 }),
    telefono_secundario: varchar("telefono_secundario", { length: 20 }),
    notas: text("notas"),
    distrito: varchar("distrito", { length: 100 }),
    nivel: varchar("nivel", { length: 10 }).notNull().default("NORMAL"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_cliente_tenant_documento").on(t.tenant_id, t.numero_documento),
    index("idx_cliente_tenant_telefono").on(t.tenant_id, t.telefono),
  ]
);

export const clienteDireccion = pgTable("cliente_direccion", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  cliente_id: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id),
  etiqueta: varchar("etiqueta", { length: 50 }).notNull().default("PRINCIPAL"),
  direccion: varchar("direccion", { length: 255 }).notNull(),
  distrito: varchar("distrito", { length: 100 }),
  provincia: varchar("provincia", { length: 100 }),
  departamento: varchar("departamento", { length: 100 }),
  referencia: varchar("referencia", { length: 255 }),
  latitud: decimal("latitud", { precision: 10, scale: 7 }),
  longitud: decimal("longitud", { precision: 10, scale: 7 }),
  es_principal: boolean("es_principal").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clienteRelations = relations(cliente, ({ one, many }) => ({
  tenant: one(tenant, { fields: [cliente.tenant_id], references: [tenant.id] }),
  direcciones: many(clienteDireccion),
}));

export const clienteDireccionRelations = relations(clienteDireccion, ({ one }) => ({
  tenant: one(tenant, { fields: [clienteDireccion.tenant_id], references: [tenant.id] }),
  cliente: one(cliente, { fields: [clienteDireccion.cliente_id], references: [cliente.id] }),
}));
