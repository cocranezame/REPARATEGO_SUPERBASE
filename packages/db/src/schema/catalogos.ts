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
import { tenant } from "./seguridad.js";

export const categoria = pgTable(
  "categoria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    descripcion: text("descripcion"),
    categoria_padre_id: uuid("categoria_padre_id"),
    orden: integer("orden").notNull().default(0),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_categoria_tenant_nombre").on(t.tenant_id, t.nombre)]
);

export const componente = pgTable(
  "componente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    descripcion: text("descripcion"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_componente_tenant_categoria_nombre").on(t.tenant_id, t.categoria_id, t.nombre),
  ]
);

export const marca = pgTable(
  "marca",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    logo_url: varchar("logo_url", { length: 500 }),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_marca_tenant_nombre").on(t.tenant_id, t.nombre)]
);

export const modelo = pgTable(
  "modelo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    marca_id: uuid("marca_id")
      .notNull()
      .references(() => marca.id),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_modelo_tenant_marca_nombre").on(t.tenant_id, t.marca_id, t.nombre)]
);

export const categoriaRelations = relations(categoria, ({ one, many }) => ({
  tenant: one(tenant, { fields: [categoria.tenant_id], references: [tenant.id] }),
  padre: one(categoria, {
    fields: [categoria.categoria_padre_id],
    references: [categoria.id],
    relationName: "categoria_jerarquia",
  }),
  hijos: many(categoria, { relationName: "categoria_jerarquia" }),
  componentes: many(componente),
  modelos: many(modelo),
}));

export const componenteRelations = relations(componente, ({ one }) => ({
  tenant: one(tenant, { fields: [componente.tenant_id], references: [tenant.id] }),
  categoria: one(categoria, { fields: [componente.categoria_id], references: [categoria.id] }),
}));

export const marcaRelations = relations(marca, ({ one, many }) => ({
  tenant: one(tenant, { fields: [marca.tenant_id], references: [tenant.id] }),
  modelos: many(modelo),
}));

export const modeloRelations = relations(modelo, ({ one }) => ({
  tenant: one(tenant, { fields: [modelo.tenant_id], references: [tenant.id] }),
  marca: one(marca, { fields: [modelo.marca_id], references: [marca.id] }),
  categoria: one(categoria, { fields: [modelo.categoria_id], references: [categoria.id] }),
}));
