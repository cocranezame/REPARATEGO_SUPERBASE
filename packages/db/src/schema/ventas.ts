import {
  EstadoCaja,
  EstadoDespachoVenta,
  EstadoEnvioVenta,
  EstadoPagoVenta,
  TipoItemVenta,
  TipoVenta,
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
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { clienteDireccion } from "./clientes.js";
import { lote, metodoPagoCatalogo, producto } from "./inventario.js";
import { sucursal, tenant, usuario } from "./seguridad.js";
import { ordenServicio } from "./servicios.js";

export const tipoVentaEnum = pgEnum("tipo_venta", TipoVenta);
export const estadoCajaEnum = pgEnum("estado_caja", EstadoCaja);
export const estadoPagoVentaEnum = pgEnum("estado_pago_venta", EstadoPagoVenta);
export const estadoDespachoVentaEnum = pgEnum("estado_despacho_venta", EstadoDespachoVenta);
export const tipoItemVentaEnum = pgEnum("tipo_item_venta", TipoItemVenta);
export const estadoEnvioVentaEnum = pgEnum("estado_envio_venta", EstadoEnvioVenta);

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
    monto_inicial: decimal("monto_inicial", { precision: 12, scale: 2 }).notNull(),
    monto_esperado: decimal("monto_esperado", { precision: 12, scale: 2 }),
    monto_fisico: decimal("monto_fisico", { precision: 12, scale: 2 }),
    diferencia: decimal("diferencia", { precision: 12, scale: 2 }),
    fecha_apertura: timestamp("fecha_apertura", { withTimezone: true }).notNull().defaultNow(),
    fecha_cierre: timestamp("fecha_cierre", { withTimezone: true }),
    estado: estadoCajaEnum("estado").notNull().default("ABIERTA"),
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
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
    estado_pago: estadoPagoVentaEnum("estado_pago").notNull().default("PAGO_PENDIENTE"),
    estado_despacho: estadoDespachoVentaEnum("estado_despacho").notNull().default("SIN_ENVIO"),
    motivo_anulacion: text("motivo_anulacion"),
    anulado_por: uuid("anulado_por").references(() => usuario.id),
    nota_credito_monto: decimal("nota_credito_monto", { precision: 12, scale: 2 }),
    created_by: uuid("created_by")
      .notNull()
      .references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_venta_tenant_estado_pago").on(t.tenant_id, t.estado_pago),
    index("idx_venta_tenant_estado_despacho").on(t.tenant_id, t.estado_despacho),
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
    tipo_item: tipoItemVentaEnum("tipo_item").notNull().default("PRODUCTO"),
    // DB column es "produto_id" (nombre histórico en el schema original)
    produto_id: uuid("produto_id").references(() => producto.id),
    lote_id: uuid("lote_id").references(() => lote.id),
    sku: varchar("sku", { length: 30 }),
    numero_serie: varchar("numero_serie", { length: 100 }),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    cantidad: integer("cantidad").notNull(),
    precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    es_preventivo: boolean("es_preventivo").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_venta_item_venta").on(t.venta_id),
    index("idx_venta_item_sku").on(t.tenant_id, t.sku),
    index("idx_venta_item_tipo").on(t.venta_id, t.tipo_item),
  ]
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
    caja_id: uuid("caja_id").references(() => caja.id),
    monto: decimal("monto", { precision: 12, scale: 2 }).notNull(),
    referencia: varchar("referencia", { length: 100 }),
    fecha_pago: timestamp("fecha_pago", { withTimezone: true }).notNull().defaultNow(),
    created_by: uuid("created_by").references(() => usuario.id),
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
    direccion_texto: varchar("direccion_texto", { length: 255 }),
    metodo_envio: varchar("metodo_envio", { length: 100 }),
    fecha_programada: date("fecha_programada"),
    costo_envio: decimal("costo_envio", { precision: 12, scale: 2 }).notNull().default("0"),
    estado: estadoEnvioVentaEnum("estado").notNull().default("PENDIENTE"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_venta_envio_venta").on(t.venta_id),
    unique("uq_venta_envio_venta_id").on(t.venta_id),
  ]
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
    caja_id: uuid("caja_id").references(() => caja.id),
    total_referencial: decimal("total_referencial", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    created_by: uuid("created_by")
      .notNull()
      .references(() => usuario.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_cotizacion_venta_tenant_cliente").on(t.tenant_id, t.cliente_id)]
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
    // DB column es "produto_id" (nombre histórico en el schema original)
    produto_id: uuid("produto_id").references(() => producto.id),
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
  pagos: many(ventaPago),
}));

export const ventaRelations = relations(venta, ({ one, many }) => ({
  tenant: one(tenant, { fields: [venta.tenant_id], references: [tenant.id] }),
  caja: one(caja, { fields: [venta.caja_id], references: [caja.id] }),
  sucursal: one(sucursal, { fields: [venta.sucursal_id], references: [sucursal.id] }),
  ordenServicio: one(ordenServicio, {
    fields: [venta.orden_servicio_id],
    references: [ordenServicio.id],
  }),
  createdBy: one(usuario, { fields: [venta.created_by], references: [usuario.id] }),
  anulador: one(usuario, { fields: [venta.anulado_por], references: [usuario.id] }),
  items: many(ventaItem),
  pagos: many(ventaPago),
  envio: many(ventaEnvio),
}));

export const ventaItemRelations = relations(ventaItem, ({ one }) => ({
  tenant: one(tenant, { fields: [ventaItem.tenant_id], references: [tenant.id] }),
  venta: one(venta, { fields: [ventaItem.venta_id], references: [venta.id] }),
  producto: one(producto, { fields: [ventaItem.produto_id], references: [producto.id] }),
  lote: one(lote, { fields: [ventaItem.lote_id], references: [lote.id] }),
}));

export const ventaPagoRelations = relations(ventaPago, ({ one }) => ({
  tenant: one(tenant, { fields: [ventaPago.tenant_id], references: [tenant.id] }),
  venta: one(venta, { fields: [ventaPago.venta_id], references: [venta.id] }),
  metodoPago: one(metodoPagoCatalogo, {
    fields: [ventaPago.metodo_pago_id],
    references: [metodoPagoCatalogo.id],
  }),
  caja: one(caja, { fields: [ventaPago.caja_id], references: [caja.id] }),
  createdBy: one(usuario, { fields: [ventaPago.created_by], references: [usuario.id] }),
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
  caja: one(caja, { fields: [cotizacionVenta.caja_id], references: [caja.id] }),
  createdBy: one(usuario, { fields: [cotizacionVenta.created_by], references: [usuario.id] }),
  items: many(cotizacionVentaItem),
}));

export const cotizacionVentaItemRelations = relations(cotizacionVentaItem, ({ one }) => ({
  tenant: one(tenant, { fields: [cotizacionVentaItem.tenant_id], references: [tenant.id] }),
  cotizacionVenta: one(cotizacionVenta, {
    fields: [cotizacionVentaItem.cotizacion_venta_id],
    references: [cotizacionVenta.id],
  }),
  producto: one(producto, {
    fields: [cotizacionVentaItem.produto_id],
    references: [producto.id],
  }),
}));
