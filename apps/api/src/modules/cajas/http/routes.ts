import { abrirCajaSchema, cerrarCajaSchema, listCajasQuerySchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CajaDrizzleRepository } from "../infra/repositories/caja.drizzle.js";
import { createCajaHandlers } from "./handlers.js";

const repo = new CajaDrizzleRepository(getDb());
const h = createCajaHandlers(repo);

export const cajaRoutes = new Hono<{ Variables: HonoVariables }>();

cajaRoutes.use(authMiddleware);

// GET /ventas/caja/activa — exempt from requireCajaAbierta (returns null if no caja)
cajaRoutes.get("/ventas/caja/activa", authorize("VENDEDOR", "ADMIN"), h.activa);

// POST /ventas/caja/apertura — exempt from requireCajaAbierta (creates it)
cajaRoutes.post(
  "/ventas/caja/apertura",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(abrirCajaSchema),
  h.apertura
);

// POST /ventas/caja/cierre — handler verifies ownership internally
cajaRoutes.post(
  "/ventas/caja/cierre",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(cerrarCajaSchema),
  h.cierre
);

// GET /ventas/caja/:id/reporte — historical, no caja check needed
cajaRoutes.get("/ventas/caja/:id/reporte", authorize("VENDEDOR", "ADMIN"), h.reporte);

// Admin: list all cajas
cajaRoutes.get("/ventas/cajas", authorize("ADMIN"), validateQuery(listCajasQuerySchema), h.list);
