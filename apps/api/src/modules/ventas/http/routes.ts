import {
  addVentaPagoSchema,
  anularVentaSchema,
  createVentaEnvioSchema,
  createVentaSchema,
  updateEnvioEstadoSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { VentaDrizzleRepository } from "../infra/repositories/venta.drizzle.js";
import { createVentaHandlers } from "./handlers.js";
import { listEnviosQuerySchema, listVentasQuerySchema } from "./validators.js";

const repo = new VentaDrizzleRepository(getDb());
const h = createVentaHandlers(repo);

export const ventaRoutes = new Hono<{ Variables: HonoVariables }>();

ventaRoutes.use(authMiddleware);

ventaRoutes.get("/ventas", validateQuery(listVentasQuerySchema), h.list);
ventaRoutes.post("/ventas", validateBody(createVentaSchema), h.create);
ventaRoutes.get("/ventas/:id", h.getById);
ventaRoutes.post("/ventas/:id/anular", validateBody(anularVentaSchema), h.anular);

ventaRoutes.get("/ventas/:id/pagos", h.listPagos);
ventaRoutes.post("/ventas/:id/pagos", validateBody(addVentaPagoSchema), h.addPago);

ventaRoutes.get("/ventas/:id/envio", h.getEnvio);
ventaRoutes.post("/ventas/:id/envio", validateBody(createVentaEnvioSchema), h.createEnvio);
ventaRoutes.put(
  "/ventas/:ventaId/envio/estado",
  validateBody(updateEnvioEstadoSchema),
  h.updateEnvioEstado
);

ventaRoutes.get("/ventas/envios", validateQuery(listEnviosQuerySchema), h.listEnvios);
