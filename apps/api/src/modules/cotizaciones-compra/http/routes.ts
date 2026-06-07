import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CotizacionCompraDrizzleRepository } from "../infra/repositories/cotizacion-compra.drizzle.js";
import { createCotizacionCompraHandlers } from "./handlers.js";
import {
  cotizarCotizacionSchema,
  createCotizacionCompraSchema,
  listCotizacionesQuerySchema,
} from "./validators.js";

const repo = new CotizacionCompraDrizzleRepository(getDb());
const h = createCotizacionCompraHandlers(repo);

export const cotizacionCompraRoutes = new Hono<{ Variables: HonoVariables }>();

cotizacionCompraRoutes.use("/cotizaciones-compra", authMiddleware);
cotizacionCompraRoutes.use("/cotizaciones-compra/*", authMiddleware);

cotizacionCompraRoutes.get(
  "/cotizaciones-compra",
  validateQuery(listCotizacionesQuerySchema),
  h.list
);
cotizacionCompraRoutes.post(
  "/cotizaciones-compra",
  validateBody(createCotizacionCompraSchema),
  h.create
);
cotizacionCompraRoutes.get("/cotizaciones-compra/:id", h.getById);
cotizacionCompraRoutes.put(
  "/cotizaciones-compra/:id/cotizar",
  validateBody(cotizarCotizacionSchema),
  h.cotizar
);
