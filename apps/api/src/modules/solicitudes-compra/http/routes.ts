import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { SolicitudCompraDrizzleRepository } from "../infra/repositories/solicitud-compra.drizzle.js";
import { createSolicitudCompraHandlers } from "./handlers.js";
import {
  createSolicitudCompraSchema,
  listSolicitudesQuerySchema,
  updateSolicitudCompraSchema,
} from "./validators.js";

const repo = new SolicitudCompraDrizzleRepository(getDb());
const h = createSolicitudCompraHandlers(repo);

export const solicitudCompraRoutes = new Hono<{ Variables: HonoVariables }>();

solicitudCompraRoutes.use("/solicitudes-compra", authMiddleware);
solicitudCompraRoutes.use("/solicitudes-compra/*", authMiddleware);

solicitudCompraRoutes.get("/solicitudes-compra", validateQuery(listSolicitudesQuerySchema), h.list);
solicitudCompraRoutes.post(
  "/solicitudes-compra",
  validateBody(createSolicitudCompraSchema),
  h.create
);
solicitudCompraRoutes.put(
  "/solicitudes-compra/:id",
  validateBody(updateSolicitudCompraSchema),
  h.update
);
solicitudCompraRoutes.delete("/solicitudes-compra/:id", h.deleteSolicitud);
solicitudCompraRoutes.get("/solicitudes-compra/stock-bajo", h.stockBajo);
