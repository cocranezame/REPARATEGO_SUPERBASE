import {
  createMetodoPagoSchema,
  createTasaPrecioSchema,
  ingresoManualSchema,
  updateMetodoPagoSchema,
  updateTasaPrecioSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { MetodoPagoDrizzleRepository } from "../infra/repositories/metodo-pago.drizzle.js";
import { ProductoDrizzleRepository } from "../infra/repositories/producto.drizzle.js";
import { StockDrizzleRepository } from "../infra/repositories/stock.drizzle.js";
import { TasaPrecioDrizzleRepository } from "../infra/repositories/tasa-precio.drizzle.js";
import { createInventarioHandlers } from "./handlers.js";
import {
  createLoteSchema,
  createMovimientoSchema,
  createProductoSchema,
  listLotesQuerySchema,
  listMovimientosQuerySchema,
  listProductosQuerySchema,
  listSimpleQuerySchema,
  listStockQuerySchema,
  syncCategoriasProductoSchema,
  syncCompatibilidadesSchema,
  updateProductoHttpSchema,
} from "./validators.js";

const productoRepo = new ProductoDrizzleRepository(getDb());
const tasaPrecioRepo = new TasaPrecioDrizzleRepository(getDb());
const metodoPagoRepo = new MetodoPagoDrizzleRepository(getDb());
const stockRepo = new StockDrizzleRepository(getDb());
const h = createInventarioHandlers(productoRepo, tasaPrecioRepo, metodoPagoRepo, stockRepo);

export const inventarioRoutes = new Hono<{ Variables: HonoVariables }>();

inventarioRoutes.use("/inventario", authMiddleware);
inventarioRoutes.use("/inventario/*", authMiddleware);
inventarioRoutes.use("/productos", authMiddleware);
inventarioRoutes.use("/productos/*", authMiddleware);
inventarioRoutes.use("/stock", authMiddleware);
inventarioRoutes.use("/stock/*", authMiddleware);
inventarioRoutes.use("/lotes", authMiddleware);
inventarioRoutes.use("/lotes/*", authMiddleware);
inventarioRoutes.use("/movimientos", authMiddleware);
inventarioRoutes.use("/movimientos/*", authMiddleware);
inventarioRoutes.use("/metodos-pago", authMiddleware);
inventarioRoutes.use("/metodos-pago/*", authMiddleware);
inventarioRoutes.use("/tasas-precio", authMiddleware);
inventarioRoutes.use("/tasas-precio/*", authMiddleware);
inventarioRoutes.use("/ingreso-oc", authMiddleware);
inventarioRoutes.use("/ingreso-oc/*", authMiddleware);

// ── GRUPO 1: Dashboard (I24, I25) ────────────────────────────────────────────
inventarioRoutes.get("/inventario/dashboard", authorize("ADMIN", "ALMACEN"), h.getDashboard);

// ── GRUPO 2: Alertas stock mínimo (I24, I25) ─────────────────────────────────
inventarioRoutes.get("/inventario/stock/alertas", authorize("ADMIN", "ALMACEN"), h.getStockAlertas);

// ── Productos (I24, I25, I26 — VENDEDOR lectura) ─────────────────────────────
inventarioRoutes.get(
  "/productos",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  validateQuery(listProductosQuerySchema),
  h.listProductos
);
inventarioRoutes.post(
  "/productos",
  authorize("ADMIN"),
  validateBody(createProductoSchema),
  h.createProducto
);
inventarioRoutes.get(
  "/productos/:id",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  h.getProductoById
);
inventarioRoutes.put(
  "/productos/:id",
  authorize("ADMIN"),
  validateBody(updateProductoHttpSchema),
  h.updateProducto
);
inventarioRoutes.delete("/productos/:id", authorize("ADMIN"), h.deleteProducto);

// ── Compatibilidades ──────────────────────────────────────────────────────────
inventarioRoutes.get(
  "/productos/:id/compatibilidades",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  h.listCompatibilidades
);
inventarioRoutes.post(
  "/productos/:id/compatibilidades",
  authorize("ADMIN"),
  validateBody(syncCompatibilidadesSchema),
  h.syncCompatibilidades
);

// ── Categorías (alcance CATEGORIA) ────────────────────────────────────────────
inventarioRoutes.get(
  "/productos/:id/categorias",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  h.listCategoriasProducto
);
inventarioRoutes.post(
  "/productos/:id/categorias",
  authorize("ADMIN"),
  validateBody(syncCategoriasProductoSchema),
  h.syncCategoriasProducto
);

// ── GRUPO 3: Tasas de precio (jerarquía) (I24, I25) ──────────────────────────
inventarioRoutes.get("/tasas-precio", authorize("ADMIN", "ALMACEN"), h.listTasasPrecio);
inventarioRoutes.post(
  "/tasas-precio",
  authorize("ADMIN", "ALMACEN"),
  validateBody(createTasaPrecioSchema),
  h.createTasaPrecio
);
inventarioRoutes.put(
  "/tasas-precio/:id",
  authorize("ADMIN", "ALMACEN"),
  validateBody(updateTasaPrecioSchema),
  h.updateTasaPrecio
);
inventarioRoutes.delete("/tasas-precio/:id", authorize("ADMIN", "ALMACEN"), h.deleteTasaPrecio);

// ── Métodos de pago catálogo ──────────────────────────────────────────────────
inventarioRoutes.get("/metodos-pago", validateQuery(listSimpleQuerySchema), h.listMetodosPago);
inventarioRoutes.post(
  "/metodos-pago",
  authorize("ADMIN"),
  validateBody(createMetodoPagoSchema),
  h.createMetodoPago
);
inventarioRoutes.put(
  "/metodos-pago/:id",
  authorize("ADMIN"),
  validateBody(updateMetodoPagoSchema),
  h.updateMetodoPago
);
inventarioRoutes.delete("/metodos-pago/:id", authorize("ADMIN"), h.deleteMetodoPago);

// ── Stock (I26 — VENDEDOR lectura) ────────────────────────────────────────────
inventarioRoutes.get(
  "/stock",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  validateQuery(listStockQuerySchema),
  h.listStock
);
inventarioRoutes.get(
  "/stock/:productoId/detalle",
  authorize("ADMIN", "ALMACEN", "VENDEDOR"),
  h.getStockDetalle
);

// ── Lotes (I24, I25) ──────────────────────────────────────────────────────────
inventarioRoutes.get(
  "/lotes",
  authorize("ADMIN", "ALMACEN"),
  validateQuery(listLotesQuerySchema),
  h.listLotes
);
inventarioRoutes.post(
  "/lotes",
  authorize("ADMIN", "ALMACEN"),
  validateBody(createLoteSchema),
  h.createLote
);

// ── GRUPO 6: Ingreso manual con lógica dual (I24, I25) ───────────────────────
inventarioRoutes.post(
  "/movimientos/ingreso",
  authorize("ADMIN", "ALMACEN"),
  validateBody(ingresoManualSchema),
  h.ingresoManual
);

// ── GRUPO 7: Ingreso automático OC (I24, I25) ─────────────────────────────────
inventarioRoutes.post("/ingreso-oc/:ordenCompraId", authorize("ADMIN", "ALMACEN"), h.ingresoOC);

// ── Movimientos manuales (I19 — MERMA/REAJUSTE: solo ADMIN y ALMACEN) ─────────
inventarioRoutes.get(
  "/movimientos",
  authorize("ADMIN", "ALMACEN"),
  validateQuery(listMovimientosQuerySchema),
  h.listMovimientos
);
inventarioRoutes.post(
  "/movimientos",
  authorize("ADMIN", "ALMACEN"),
  validateBody(createMovimientoSchema),
  h.createMovimiento
);

// ── GRUPO 4: Proveedores sugeridos para cotización (I7) ───────────────────────
inventarioRoutes.get(
  "/inventario/cotizaciones/proveedores-sugeridos/:productoId",
  authorize("ADMIN", "ALMACEN"),
  h.getProveedoresSugeridos
);
