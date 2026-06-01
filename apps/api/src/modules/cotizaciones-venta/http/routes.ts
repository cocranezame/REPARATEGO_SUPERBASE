import {
  createCotizacionVentaSchema,
  listCotizacionesVentaQuerySchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { requireCajaAbierta } from "../../../middlewares/require-caja.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CotizacionVentaDrizzleRepository } from "../infra/repositories/cotizacion-venta.drizzle.js";
import { createCotizacionVentaHandlers } from "./handlers.js";

const repo = new CotizacionVentaDrizzleRepository(getDb());
const h = createCotizacionVentaHandlers(repo);

export const cotizacionVentaRoutes = new Hono<{ Variables: HonoVariables }>();

cotizacionVentaRoutes.use(authMiddleware);
cotizacionVentaRoutes.use(requireCajaAbierta);

// ─── Cotizaciones referenciales (V15: sin impacto en inventario) ───────────────
cotizacionVentaRoutes.get(
  "/ventas/cotizaciones",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listCotizacionesVentaQuerySchema),
  h.list
);
cotizacionVentaRoutes.post(
  "/ventas/cotizaciones",
  authorize("VENDEDOR"),
  validateBody(createCotizacionVentaSchema),
  h.create
);
cotizacionVentaRoutes.get("/ventas/cotizaciones/:id", authorize("VENDEDOR", "ADMIN"), h.getById);
