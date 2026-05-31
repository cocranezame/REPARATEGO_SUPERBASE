import { EstadoCotizacionVenta, EstadoVenta, TipoComprobante, TipoVenta } from "@kallpasoft/shared";
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
import { clienteDireccion } from "./clientes.js";
import { metodoPagoCatalogo, producto } from "./inventario.js";
import { sucursal, tenant, usuario } from "./seguridad.js";
import { ordenServicio } from "./servicios.js";

export const tipoVentaEnum = pgEnum("tipo_venta", TipoVenta);
export const estadoVentaEnum = pgEnum("estado_venta", EstadoVenta);
export const tipoComprobanteEnum = pgEnum("tipo_comprobante", TipoComprobante);
export const estadoCotizacionVentaEnum = pgEnum("estado_cotizacion_venta", EstadoCotizacionVenta);

export const caja = pgTable(
  "caja",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    sucursal_id: uuid("sucursal_id")
      .notNull()
      .references(() => sucursal.id),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    monto_apertura: decimal("monto_apertura", { precision: 12, scale: 2 }).notNull(),
    monto_cierre: decimal("monto_cierre", { precision: 12, scale: 2 }),
    fecha_apertura: timestamp("fecha_apertura", { withTimezone: true }).notNull().defaultNow(),
    fecha_cierre: timestamp("fecha_cierre", { withTimezone: true }),
    estado: varchar("estado", { length: 10 }).notNull().default("ABIERTA"),
    notas_cierre: text("notas_cierre"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_caja_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_caja_tenant_sucursal").on(t.tenant_id, t.sucursal_id),
    index("idx_caja_usuario").on(t.tenant_id, t.usuario_id),
  ]
);

export const venta = pgTable(
  "venta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    caja_id: uuid("caja_id")
      .notNull()
      .references(() => caja.id),
    sucursal_id: uuid("sucursal_id")
      .notNull()
      .references(() => sucursal.id),
    cliente_id: uuid("cliente_id"),
    tipo_venta: tipoVentaEnum("tipo_venta").notNull().default("LIBRE"),
    orden_servicio_id: uuid("orden_servicio_id").references(() => ordenServicio.id),
    visita_domicilio_id: uuid("visita_domicilio_id"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    descuento: decimal("descuento", { precision: 12, scale: 2 }).notNull().default("0"),
    igv: decimal("igv", { precision: 12, scale: 2 }).notNull().default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    estado: estadoVentaEnum("estado").notNull().default("PENDIENTE"),
    tipo_comprobante: tipoComprobanteEnum("tipo_comprobante"),
    serie_comprobante: varchar("serie_comprobante", { length: 10 }),
    numero_comprobante: varchar("numero_comprobante", { length: 15 }),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    notas: text("notas"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_venta_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_venta_tenant_caja").on(t.tenant_id, t.caja_id),
    index("idx_venta_tenant_cliente").on(t.tenant_id, t.cliente_id),
    index("idx_venta_tenant_codigo").on(t.tenant_id, t.codigo),
  ]
);

export const ventaItem = pgTable(
  "venta_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    venta_id: uuid("venta_id")
      .notNull()
      .references(() => venta.id),
    producto_id: uuid("producto_id").references(() => producto.id),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    cantidad: integer("cantidad").notNull(),
    precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
    descuento: decimal("descuento", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_venta_item_venta").on(t.venta_id)]
);

export const ventaPago = pgTable(
  "venta_pago",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    venta_id: uuid("venta_id")
      .notNull()
      .references(() => venta.id),
    metodo_pago_id: uuid("metodo_pago_id")
      .notNull()
      .references(() => metodoPagoCatalogo.id),
    monto: decimal("monto", { precision: 12, scale: 2 }).notNull(),
    referencia: varchar("referencia", { length: 100 }),
    fecha_pago: timestamp("fecha_pago", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_venta_pago_venta").on(t.venta_id)]
);

export const ventaEnvio = pgTable(
  "venta_envio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    venta_id: uuid("venta_id")
      .notNull()
      .references(() => venta.id),
    direccion_id: uuid("direccion_id").references(() => clienteDireccion.id),
    direccion_texto: varchar("direccion_texto", { length: 255 }).notNull(),
    estado: varchar("estado", { length: 15 }).notNull().default("PENDIENTE"),
    fecha_envio: timestamp("fecha_envio", { withTimezone: true }),
    fecha_entrega: timestamp("fecha_entrega", { withTimezone: true }),
    costo_envio: decimal("costo_envio", { precision: 12, scale: 2 }).notNull().default("0"),
    notas: text("notas"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_venta_envio_venta").on(t.venta_id)]
);

export const cotizacionVenta = pgTable(
  "cotizacion_venta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    cliente_id: uuid("cliente_id"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    igv: decimal("igv", { precision: 12, scale: 2 }).notNull().default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    estado: estadoCotizacionVentaEnum("estado").notNull().default("BORRADOR"),
    fecha_vencimiento: date("fecha_vencimiento"),
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id),
    notas: text("notas"),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_cotizacion_venta_tenant_estado").on(t.tenant_id, t.estado),
    index("idx_cotizacion_venta_tenant_cliente").on(t.tenant_id, t.cliente_id),
  ]
);

export const cotizacionVentaItem = pgTable(
  "cotizacion_venta_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    cotizacion_venta_id: uuid("cotizacion_venta_id")
      .notNull()
      .references(() => cotizacionVenta.id),
    producto_id: uuid("producto_id").references(() => producto.id),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    cantidad: integer("cantidad").notNull(),
    precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_cotizacion_venta_item_cotizacion").on(t.cotizacion_venta_id)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const cajaRelations = relations(caja, ({ one, many }) => ({
  tenant: one(tenant, { fields: [caja.tenant_id], references: [tenant.id] }),
  sucursal: one(sucursal, { fields: [caja.sucursal_id], references: [sucursal.id] }),
  usuario: one(usuario, { fields: [caja.usuario_id], references: [usuario.id] }),
  ventas: many(venta),
}));

export const ventaRelations = relations(venta, ({ one, many }) => ({
  tenant: one(tenant, { fields: [venta.tenant_id], references: [tenant.id] }),
  caja: one(caja, { fields: [venta.caja_id], references: [caja.id] }),
  sucursal: one(sucursal, { fields: [venta.sucursal_id], references: [sucursal.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [venta.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  usuario: one(usuario, { fields: [venta.usuario_id], references: [usuario.id] }),
  items: many(ventaItem),
  pagos: many(ventaPago),
  envio: many(ventaEnvio),
}));

export const ventaItemRelations = relations(ventaItem, ({ one }) => ({
  tenant: one(tenant, { fields: [ventaItem.tenant_id], references: [tenant.id] }),
  venta: one(venta, { fields: [ventaItem.venta_id], references: [venta.id] }),
  producto: one(producto, { fields: [ventaItem.producto_id], references: [producto.id] }),
}));

export const ventaPagoRelations = relations(ventaPago, ({ one }) => ({
  tenant: one(tenant, { fields: [ventaPago.tenant_id], references: [tenant.id] }),
  venta: one(venta, { fields: [ventaPago.venta_id], references: [venta.id] }),
  metodoPago: one(metodoPagoCatalogo, {
    fields: [ventaPago.metodo_pago_id],
    references: [metodoPagoCatalogo.id],
  }),
}));

export const ventaEnvioRelations = relations(ventaEnvio, ({ one }) => ({
  tenant: one(tenant, { fields: [ventaEnvio.tenant_id], references: [tenant.id] }),
  venta: one(venta, { fields: [ventaEnvio.venta_id], references: [venta.id] }),
  direccion: one(clienteDireccion, {
    fields: [ventaEnvio.direccion_id],
    references: [clienteDireccion.id],
  }),
}));

export const cotizacionVentaRelations = relations(cotizacionVenta, ({ one, many }) => ({
  tenant: one(tenant, { fields: [cotizacionVenta.tenant_id], references: [tenant.id] }),
  usuario: one(usuario, { fields: [cotizacionVenta.usuario_id], references: [usuario.id] }),
  items: many(cotizacionVentaItem),
}));

export const cotizacionVentaItemRelations = relations(cotizacionVentaItem, ({ one }) => ({
  tenant: one(tenant, { fields: [cotizacionVentaItem.tenant_id], references: [tenant.id] }),
  cotizacionVenta: one(cotizacionVenta, {
    fields: [cotizacionVentaItem.cotizacion_venta_id],
    references: [cotizacionVenta.id],
  }),
  producto: one(producto, {
    fields: [cotizacionVentaItem.producto_id],
    references: [producto.id],
  }),
}));
