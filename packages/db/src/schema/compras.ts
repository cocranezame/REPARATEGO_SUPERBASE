import { EstadoCotizacionCompra } from "@kallpasoft/shared";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
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
import { producto } from "./inventario.js";
import { proveedor } from "./proveedores.js";
import { tenant, usuario } from "./seguridad.js";

export const estadoCotizacionCompraEnum = pgEnum(
  "estado_cotizacion_compra",
  EstadoCotizacionCompra
);

export const cotizacionCompra = pgTable(
  "cotizacion_compra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    proveedor_id: uuid("proveedor_id")
      .notNull()
      .references(() => proveedor.id),
    estado: estadoCotizacionCompraEnum("estado").notNull().default("PENDIENTE"),
    fecha_solicitud: date("fecha_solicitud").notNull(),
    fecha_respuesta: date("fecha_respuesta"),
    fecha_vencimiento: date("fecha_vencimiento"),
    notas: text("notas"),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_cotizacion_compra_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_cotizacion_compra_proveedor").on(t.tenant_id, t.proveedor_id),
  ]
);

export const cotizacionCompraDetalle = pgTable("cotizacion_compra_detalle", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  cotizacion_compra_id: uuid("cotizacion_compra_id")
    .notNull()
    .references(() => cotizacionCompra.id),
  producto_id: uuid("producto_id")
    .notNull()
    .references(() => producto.id),
  cantidad: integer("cantidad").notNull(),
  precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  notas: text("notas"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const cotizacionCompraRelations = relations(cotizacionCompra, ({ one, many }) => ({
  tenant: one(tenant, { fields: [cotizacionCompra.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, {
    fields: [cotizacionCompra.proveedor_id],
    references: [proveedor.id],
  }),
  usuario: one(usuario, { fields: [cotizacionCompra.usuario_id], references: [usuario.id] }),
  detalles: many(cotizacionCompraDetalle),
}));

export const cotizacionCompraDetalleRelations = relations(cotizacionCompraDetalle, ({ one }) => ({
  tenant: one(tenant, {
    fields: [cotizacionCompraDetalle.tenant_id],
    references: [tenant.id],
  }),
  cotizacion: one(cotizacionCompra, {
    fields: [cotizacionCompraDetalle.cotizacion_compra_id],
    references: [cotizacionCompra.id],
  }),
  producto: one(producto, {
    fields: [cotizacionCompraDetalle.producto_id],
    references: [producto.id],
  }),
}));
