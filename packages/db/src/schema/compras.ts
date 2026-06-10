import {
  EstadoOrdenCompra,
  EstadoSolicitudCompra,
  MetodoPagoProveedor,
  PrioridadSolicitud,
} from "@kallpasoft/shared";
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
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { producto } from "./inventario.js";
import { proveedor } from "./proveedores.js";
import { tenant, usuario } from "./seguridad.js";

export const metodoPagoProveedorEnum = pgEnum("metodo_pago_proveedor", MetodoPagoProveedor);
export const prioridadSolicitudEnum = pgEnum("prioridad_solicitud", PrioridadSolicitud);
export const estadoSolicitudCompraEnum = pgEnum("estado_solicitud_compra", EstadoSolicitudCompra);
export const estadoOrdenCompraEnum = pgEnum("estado_orden_compra", EstadoOrdenCompra);

// C029: cotizacion = proveedor × repuesto × precio (sin estado, sin detalle)
export const cotizacionCompra = pgTable(
  "cotizacion_compra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    proveedor_id: uuid("proveedor_id")
      .notNull()
      .references(() => proveedor.id),
    producto_id: uuid("producto_id")
      .notNull()
      .references(() => producto.id),
    precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }),
    notas: text("notas"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_cotizacion_proveedor_producto").on(t.tenant_id, t.proveedor_id, t.producto_id),
    index("idx_cotizacion_compra_proveedor").on(t.tenant_id, t.proveedor_id),
    index("idx_cotizacion_compra_producto").on(t.tenant_id, t.producto_id),
  ]
);

export const ordenCompra = pgTable(
  "orden_compra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    proveedor_id: uuid("proveedor_id")
      .notNull()
      .references(() => proveedor.id),
    estado: estadoOrdenCompraEnum("estado").notNull().default("GENERADA"),
    fecha_emision: date("fecha_emision").notNull(),
    fecha_entrega_estimada: date("fecha_entrega_estimada"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    igv: decimal("igv", { precision: 12, scale: 2 }).notNull().default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    notas: text("notas"),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_orden_compra_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_orden_compra_tenant_proveedor").on(t.tenant_id, t.proveedor_id),
  ]
);

export const solicitudCompra = pgTable(
  "solicitud_compra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    producto_id: uuid("producto_id")
      .notNull()
      .references(() => producto.id),
    cantidad_solicitada: integer("cantidad_solicitada").notNull(),
    prioridad: prioridadSolicitudEnum("prioridad").notNull().default("NORMAL"),
    estado: estadoSolicitudCompraEnum("estado").notNull().default("PENDIENTE"),
    orden_compra_id: uuid("orden_compra_id").references(() => ordenCompra.id),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    notas: text("notas"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_solicitud_compra_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_solicitud_compra_tenant_producto").on(t.tenant_id, t.producto_id),
  ]
);

export const ordenCompraConfirmacion = pgTable("orden_compra_confirmacion", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  orden_compra_id: uuid("orden_compra_id")
    .notNull()
    .references(() => ordenCompra.id),
  producto_id: uuid("producto_id")
    .notNull()
    .references(() => producto.id),
  cantidad_ordenada: integer("cantidad_ordenada").notNull(),
  cantidad_recibida: integer("cantidad_recibida").notNull().default(0),
  precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  conforme: boolean("conforme"),
  notas: text("notas"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pagoProveedor = pgTable(
  "pago_proveedor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    orden_compra_id: uuid("orden_compra_id")
      .notNull()
      .references(() => ordenCompra.id),
    proveedor_id: uuid("proveedor_id")
      .notNull()
      .references(() => proveedor.id),
    monto: decimal("monto", { precision: 12, scale: 2 }).notNull(),
    metodo_pago: metodoPagoProveedorEnum("metodo_pago").notNull(),
    referencia: varchar("referencia", { length: 100 }),
    comprobante_url: varchar("comprobante_url", { length: 500 }),
    fecha_pago: date("fecha_pago").notNull(),
    notas: text("notas"),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_pago_proveedor_tenant").on(t.tenant_id),
    index("idx_pago_proveedor_orden_compra").on(t.orden_compra_id),
    index("idx_pago_proveedor_proveedor").on(t.tenant_id, t.proveedor_id),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const cotizacionCompraRelations = relations(cotizacionCompra, ({ one }) => ({
  tenant: one(tenant, { fields: [cotizacionCompra.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, {
    fields: [cotizacionCompra.proveedor_id],
    references: [proveedor.id],
  }),
  producto: one(producto, {
    fields: [cotizacionCompra.producto_id],
    references: [producto.id],
  }),
}));

export const ordenCompraRelations = relations(ordenCompra, ({ one, many }) => ({
  tenant: one(tenant, { fields: [ordenCompra.tenant_id], references: [tenant.id] }),
  proveedor: one(proveedor, { fields: [ordenCompra.proveedor_id], references: [proveedor.id] }),
  usuario: one(usuario, { fields: [ordenCompra.usuario_id], references: [usuario.id] }),
  solicitudes: many(solicitudCompra),
  confirmaciones: many(ordenCompraConfirmacion),
}));

export const solicitudCompraRelations = relations(solicitudCompra, ({ one }) => ({
  tenant: one(tenant, { fields: [solicitudCompra.tenant_id], references: [tenant.id] }),
  producto: one(producto, { fields: [solicitudCompra.producto_id], references: [producto.id] }),
  usuario: one(usuario, { fields: [solicitudCompra.usuario_id], references: [usuario.id] }),
  ordenCompra: one(ordenCompra, {
    fields: [solicitudCompra.orden_compra_id],
    references: [ordenCompra.id],
  }),
}));

export const ordenCompraConfirmacionRelations = relations(ordenCompraConfirmacion, ({ one }) => ({
  tenant: one(tenant, {
    fields: [ordenCompraConfirmacion.tenant_id],
    references: [tenant.id],
  }),
  ordenCompra: one(ordenCompra, {
    fields: [ordenCompraConfirmacion.orden_compra_id],
    references: [ordenCompra.id],
  }),
  producto: one(producto, {
    fields: [ordenCompraConfirmacion.producto_id],
    references: [producto.id],
  }),
}));

export const pagoProveedorRelations = relations(pagoProveedor, ({ one }) => ({
  tenant: one(tenant, { fields: [pagoProveedor.tenant_id], references: [tenant.id] }),
  ordenCompra: one(ordenCompra, {
    fields: [pagoProveedor.orden_compra_id],
    references: [ordenCompra.id],
  }),
  proveedor: one(proveedor, { fields: [pagoProveedor.proveedor_id], references: [proveedor.id] }),
  usuario: one(usuario, { fields: [pagoProveedor.usuario_id], references: [usuario.id] }),
}));
