import { abrirCajaSchema, cerrarCajaSchema, listCajasQuerySchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CajaDrizzleRepository } from "../infra/repositories/caja.drizzle.js";
import { createCajaHandlers } from "./handlers.js";

const repo = new CajaDrizzleRepository(getDb());
const h = createCajaHandlers(repo);

export const cajaRoutes = new Hono<{ Variables: HonoVariables }>();

cajaRoutes.use(authMiddleware);

cajaRoutes.get("/cajas", validateQuery(listCajasQuerySchema), h.list);
cajaRoutes.get("/cajas/actual", h.actual);
cajaRoutes.post("/cajas/abrir", validateBody(abrirCajaSchema), h.abrir);
cajaRoutes.post("/cajas/:id/cerrar", validateBody(cerrarCajaSchema), h.cerrar);
cajaRoutes.get("/cajas/:id/resumen", h.resumen);
