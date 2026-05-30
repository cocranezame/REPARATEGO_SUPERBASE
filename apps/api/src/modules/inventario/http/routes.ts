import {
  createMetodoPagoSchema,
  createTasaPrecioSchema,
  updateMetodoPagoSchema,
  updateTasaPrecioSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { MetodoPagoDrizzleRepository } from "../infra/repositories/metodo-pago.drizzle.js";
import { ProductoDrizzleRepository } from "../infra/repositories/producto.drizzle.js";
import { TasaPrecioDrizzleRepository } from "../infra/repositories/tasa-precio.drizzle.js";
import { createInventarioHandlers } from "./handlers.js";
import {
  createProductoSchema,
  listProductosQuerySchema,
  listSimpleQuerySchema,
  syncCompatibilidadesSchema,
  updateProductoHttpSchema,
} from "./validators.js";

const productoRepo = new ProductoDrizzleRepository(getDb());
const tasaPrecioRepo = new TasaPrecioDrizzleRepository(getDb());
const metodoPagoRepo = new MetodoPagoDrizzleRepository(getDb());
const h = createInventarioHandlers(productoRepo, tasaPrecioRepo, metodoPagoRepo);

export const inventarioRoutes = new Hono<{ Variables: HonoVariables }>();

inventarioRoutes.use(authMiddleware);

// Productos
inventarioRoutes.get("/productos", validateQuery(listProductosQuerySchema), h.listProductos);
inventarioRoutes.post("/productos", validateBody(createProductoSchema), h.createProducto);
inventarioRoutes.get("/productos/:id", h.getProductoById);
inventarioRoutes.put("/productos/:id", validateBody(updateProductoHttpSchema), h.updateProducto);
inventarioRoutes.delete("/productos/:id", h.deleteProducto);

// Compatibilidades
inventarioRoutes.get("/productos/:id/compatibilidades", h.listCompatibilidades);
inventarioRoutes.post(
  "/productos/:id/compatibilidades",
  validateBody(syncCompatibilidadesSchema),
  h.syncCompatibilidades
);

// Tasas de precio
inventarioRoutes.get("/tasas-precio", validateQuery(listSimpleQuerySchema), h.listTasasPrecio);
inventarioRoutes.post("/tasas-precio", validateBody(createTasaPrecioSchema), h.createTasaPrecio);
inventarioRoutes.put("/tasas-precio/:id", validateBody(updateTasaPrecioSchema), h.updateTasaPrecio);
inventarioRoutes.delete("/tasas-precio/:id", h.deleteTasaPrecio);

// Métodos de pago
inventarioRoutes.get("/metodos-pago", validateQuery(listSimpleQuerySchema), h.listMetodosPago);
inventarioRoutes.post("/metodos-pago", validateBody(createMetodoPagoSchema), h.createMetodoPago);
inventarioRoutes.put("/metodos-pago/:id", validateBody(updateMetodoPagoSchema), h.updateMetodoPago);
inventarioRoutes.delete("/metodos-pago/:id", h.deleteMetodoPago);
