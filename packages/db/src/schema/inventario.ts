import { TipoMovimiento, TipoProducto } from "@kallpasoft/shared";
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
import { categoria, componente, marca, modelo } from "./catalogos.js";
import { sucursal, tenant, usuario } from "./seguridad.js";

export const tipoProductoEnum = pgEnum("tipo_producto", TipoProducto);
export const tipoMovimientoEnum = pgEnum("tipo_movimiento", TipoMovimiento);

export const producto = pgTable(
  "producto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    codigo: varchar("codigo", { length: 30 }).notNull(),
    tipo: tipoProductoEnum("tipo").notNull(),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    descripcion: text("descripcion"),
    categoria_id: uuid("categoria_id")
      .notNull()
      .references(() => categoria.id),
    componente_id: uuid("componente_id").references(() => componente.id),
    marca_id: uuid("marca_id").references(() => marca.id),
    unidad_medida: varchar("unidad_medida", { length: 10 }).notNull().default("UND"),
    precio_compra: decimal("precio_compra", { precision: 12, scale: 2 }),
    precio_venta: decimal("precio_venta", { precision: 12, scale: 2 }).notNull(),
    stock_minimo: integer("stock_minimo").notNull().default(0),
    imagen_url: varchar("imagen_url", { length: 500 }),
    activo: boolean("activo").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_producto_tenant_codigo").on(t.tenant_id, t.codigo),
    index("idx_producto_tenant_categoria").on(t.tenant_id, t.categoria_id),
    index("idx_producto_tenant_nombre").on(t.tenant_id, t.nombre),
  ]
);

export const productoCompatibilidad = pgTable(
  "producto_compatibilidad",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
    producto_id: uuid("producto_id")
      .notNull()
      .references(() => producto.id),
    modelo_id: uuid("modelo_id")
      .notNull()
      .references(() => modelo.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_prod_compat_tenant_prod_modelo").on(t.tenant_id, t.producto_id, t.modelo_id),
  ]
);

export const tasaPrecio = pgTable("tasa_precio", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  nombre: varchar("nombre", { length: 50 }).notNull(),
  porcentaje: decimal("porcentaje", { precision: 5, scale: 2 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const metodoPagoCatalogo = pgTable("metodo_pago_catalogo", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  nombre: varchar("nombre", { length: 50 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lote = pgTable("lote", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  producto_id: uuid("producto_id")
    .notNull()
    .references(() => producto.id),
  sucursal_id: uuid("sucursal_id")
    .notNull()
    .references(() => sucursal.id),
  // FK a orden_compra se agrega en E7 — tabla aún no existe
  orden_compra_id: uuid("orden_compra_id"),
  sku: varchar("sku", { length: 50 }).notNull(),
  cantidad_inicial: integer("cantidad_inicial").notNull(),
  cantidad_actual: integer("cantidad_actual").notNull(),
  precio_unitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  fecha_ingreso: date("fecha_ingreso").notNull(),
  fecha_vencimiento: date("fecha_vencimiento"),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const movimientoInventario = pgTable("movimiento_inventario", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id),
  producto_id: uuid("producto_id")
    .notNull()
    .references(() => producto.id),
  lote_id: uuid("lote_id").references(() => lote.id),
  sucursal_id: uuid("sucursal_id")
    .notNull()
    .references(() => sucursal.id),
  tipo: tipoMovimientoEnum("tipo").notNull(),
  cantidad: integer("cantidad").notNull(),
  referencia_tipo: varchar("referencia_tipo", { length: 30 }),
  referencia_id: uuid("referencia_id"),
  notas: text("notas"),
  usuario_id: uuid("usuario_id")
    .notNull()
    .references(() => usuario.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const productoRelations = relations(producto, ({ one, many }) => ({
  tenant: one(tenant, { fields: [producto.tenant_id], references: [tenant.id] }),
  categoria: one(categoria, { fields: [producto.categoria_id], references: [categoria.id] }),
  componente: one(componente, { fields: [producto.componente_id], references: [componente.id] }),
  marca: one(marca, { fields: [producto.marca_id], references: [marca.id] }),
  compatibilidades: many(productoCompatibilidad),
  lotes: many(lote),
  movimientos: many(movimientoInventario),
}));

export const productoCompatibilidadRelations = relations(productoCompatibilidad, ({ one }) => ({
  tenant: one(tenant, {
    fields: [productoCompatibilidad.tenant_id],
    references: [tenant.id],
  }),
  producto: one(producto, {
    fields: [productoCompatibilidad.producto_id],
    references: [producto.id],
  }),
  modelo: one(modelo, {
    fields: [productoCompatibilidad.modelo_id],
    references: [modelo.id],
  }),
}));

export const tasaPrecioRelations = relations(tasaPrecio, ({ one }) => ({
  tenant: one(tenant, { fields: [tasaPrecio.tenant_id], references: [tenant.id] }),
}));

export const metodoPagoCatalogoRelations = relations(metodoPagoCatalogo, ({ one }) => ({
  tenant: one(tenant, { fields: [metodoPagoCatalogo.tenant_id], references: [tenant.id] }),
}));

export const loteRelations = relations(lote, ({ one, many }) => ({
  tenant: one(tenant, { fields: [lote.tenant_id], references: [tenant.id] }),
  producto: one(producto, { fields: [lote.producto_id], references: [producto.id] }),
  sucursal: one(sucursal, { fields: [lote.sucursal_id], references: [sucursal.id] }),
  movimientos: many(movimientoInventario),
}));

export const movimientoInventarioRelations = relations(movimientoInventario, ({ one }) => ({
  tenant: one(tenant, { fields: [movimientoInventario.tenant_id], references: [tenant.id] }),
  producto: one(producto, {
    fields: [movimientoInventario.producto_id],
    references: [producto.id],
  }),
  lote: one(lote, { fields: [movimientoInventario.lote_id], references: [lote.id] }),
  sucursal: one(sucursal, {
    fields: [movimientoInventario.sucursal_id],
    references: [sucursal.id],
  }),
  usuario: one(usuario, { fields: [movimientoInventario.usuario_id], references: [usuario.id] }),
}));
