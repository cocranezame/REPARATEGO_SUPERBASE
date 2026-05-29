/*
 * RLS Policies — aplicar en E1.2
 *
 * ALTER TABLE tenant      ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE sucursal    ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE usuario     ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE feature_flag ENABLE ROW LEVEL SECURITY;
 *
 * ✅ Aplicado en E1.2 (migración 0001_rls_policies.sql)
 * Local: NULLIF(current_setting('app.tenant_id', true), '')::uuid — API usa SET LOCAL
 * Prod:  (auth.jwt() ->> 'tenant_id')::uuid — reemplazar en migración de deploy (E0D)
 *
 * CREATE POLICY tenant_isolation ON tenant
 *   USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
 * CREATE POLICY sucursal_isolation    ON sucursal     USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
 * CREATE POLICY usuario_isolation     ON usuario      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
 * CREATE POLICY feature_flag_isolation ON feature_flag USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
 */

import { PlanTenant, RolUsuario, TipoDocumento } from "@kallpasoft/shared";
import { isNotNull, relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tipoDocumentoEnum = pgEnum("tipo_documento", TipoDocumento);
export const rolUsuarioEnum = pgEnum("rol_usuario", RolUsuario);
export const planTenantEnum = pgEnum("plan_tenant", PlanTenant);

export const tenant = pgTable("tenant", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  ruc: varchar("ruc", { length: 11 }),
  plan: planTenantEnum("plan").notNull().default(PlanTenant.BASIC),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sucursal = pgTable("sucursal", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  direccion: varchar("direccion", { length: 255 }),
  distrito: varchar("distrito", { length: 100 }),
  telefono: varchar("telefono", { length: 20 }),
  es_principal: boolean("es_principal").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usuario = pgTable(
  "usuario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    sucursal_id: uuid("sucursal_id").references(() => sucursal.id),
    tipo_documento: tipoDocumentoEnum("tipo_documento").notNull(),
    numero_documento: varchar("numero_documento", { length: 20 }).notNull(),
    nombres: varchar("nombres", { length: 100 }).notNull(),
    apellidos: varchar("apellidos", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }),
    telefono: varchar("telefono", { length: 20 }),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    rol: rolUsuarioEnum("rol").notNull(),
    ultimo_login: timestamp("ultimo_login", { withTimezone: true }),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_usuario_tenant_documento").on(t.tenant_id, t.numero_documento),
    uniqueIndex("uq_usuario_tenant_email").on(t.tenant_id, t.email).where(isNotNull(t.email)),
  ]
);

export const featureFlag = pgTable(
  "feature_flag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    clave: varchar("clave", { length: 50 }).notNull(),
    habilitado: boolean("habilitado").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_feature_flag_tenant_clave").on(t.tenant_id, t.clave)]
);

export const tenantRelations = relations(tenant, ({ many }) => ({
  sucursales: many(sucursal),
  usuarios: many(usuario),
  featureFlags: many(featureFlag),
}));

export const sucursalRelations = relations(sucursal, ({ one, many }) => ({
  tenant: one(tenant, { fields: [sucursal.tenant_id], references: [tenant.id] }),
  usuarios: many(usuario),
}));

export const usuarioRelations = relations(usuario, ({ one }) => ({
  tenant: one(tenant, { fields: [usuario.tenant_id], references: [tenant.id] }),
  sucursal: one(sucursal, { fields: [usuario.sucursal_id], references: [sucursal.id] }),
}));

export const featureFlagRelations = relations(featureFlag, ({ one }) => ({
  tenant: one(tenant, { fields: [featureFlag.tenant_id], references: [tenant.id] }),
}));
