import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categoria, componente } from "./catalogos.js";
import { tenant } from "./seguridad.js";

export const proveedor = pgTable(
  "proveedor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    ruc: varchar("ruc", { length: 11 }).notNull(),
    razon_social: varchar("razon_social", { length: 200 }).notNull(),
    nombre_comercial: varchar("nombre_comercial", { length: 200 }),
    direccion: varchar("direccion", { length: 255 }),
    distrito: varchar("distrito", { length: 100 }),
    email: varchar("email", { length: 150 }),
    telefono: varchar("telefono", { length: 20 }),
    web: varchar("web", { length: 255 }),
    notas: text("notas"),
    calificacion: integer("calificacion"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_proveedor_tenant_ruc").on(t.tenant_id, t.ruc)]
);

export const proveedorContacto = pgTable("proveedor_contacto", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  proveedor_id: uuid("proveedor_id")
    .notNull()
    .references(() => proveedor.id),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  telefono: varchar("telefono", { length: 20 }),
  email: varchar("email", { length: 150 }),
  es_principal: boolean("es_principal").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proveedorMetodoPago = pgTable("proveedor_metodo_pago", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  proveedor_id: uuid("proveedor_id")
    .notNull()
    .references(() => proveedor.id),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  banco: varchar("banco", { length: 50 }),
  numero_cuenta: varchar("numero_cuenta", { length: 30 }),
  cci: varchar("cci", { length: 25 }),
  titular: varchar("titular", { length: 150 }),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proveedorLinea = pgTable("proveedor_linea", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  proveedor_id: uuid("proveedor_id")
    .notNull()
    .references(() => proveedor.id),
  categoria_id: uuid("categoria_id").references(() => categoria.id),
  componente_id: uuid("componente_id").references(() => componente.id),
  descripcion: varchar("descripcion", { length: 200 }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const proveedorRelations = relations(proveedor, ({ one, many }) => ({
  tenant: one(tenant, { fields: [proveedor.tenant_id], references: [tenant.id] }),
  contactos: many(proveedorContacto),
  metodos_pago: many(proveedorMetodoPago),
  lineas: many(proveedorLinea),
}));

export const proveedorContactoRelations = relations(proveedorContacto, ({ one }) => ({
  tenant: one(tenant, { fields: [proveedorContacto.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, {
    fields: [proveedorContacto.proveedor_id],
    references: [proveedor.id],
  }),
}));

export const proveedorMetodoPagoRelations = relations(proveedorMetodoPago, ({ one }) => ({
  tenant: one(tenant, { fields: [proveedorMetodoPago.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, {
    fields: [proveedorMetodoPago.proveedor_id],
    references: [proveedor.id],
  }),
}));

export const proveedorLineaRelations = relations(proveedorLinea, ({ one }) => ({
  tenant: one(tenant, { fields: [proveedorLinea.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, {
    fields: [proveedorLinea.proveedor_id],
    references: [proveedor.id],
  }),
  categoria: one(categoria, {
    fields: [proveedorLinea.categoria_id],
    references: [categoria.id],
  }),
  componente: one(componente, {
    fields: [proveedorLinea.componente_id],
    references: [componente.id],
  }),
}));
