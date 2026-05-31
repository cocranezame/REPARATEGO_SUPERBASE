import {
  createCotizacionVentaSchema,
  listCotizacionesVentaQuerySchema,
  updateCotizacionVentaEstadoSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CotizacionVentaDrizzleRepository } from "../infra/repositories/cotizacion-venta.drizzle.js";
import { createCotizacionVentaHandlers } from "./handlers.js";

const repo = new CotizacionVentaDrizzleRepository(getDb());
const h = createCotizacionVentaHandlers(repo);

export const cotizacionVentaRoutes = new Hono<{ Variables: HonoVariables }>();

cotizacionVentaRoutes.use(authMiddleware);

cotizacionVentaRoutes.get(
  "/cotizaciones-venta",
  validateQuery(listCotizacionesVentaQuerySchema),
  h.list
);
cotizacionVentaRoutes.post(
  "/cotizaciones-venta",
  validateBody(createCotizacionVentaSchema),
  h.create
);
cotizacionVentaRoutes.get("/cotizaciones-venta/:id", h.getById);
cotizacionVentaRoutes.put(
  "/cotizaciones-venta/:id/estado",
  validateBody(updateCotizacionVentaEstadoSchema),
  h.updateEstado
);
