import {
  addComponentesOrdenServicioSchema,
  addCotizacionOrdenServicioSchema,
  addEvidenciaSchema,
  aprobarCotizacionSchema,
  createOrdenServicioSchema,
  updateEstadoOrdenServicioSchema,
  updateOrdenServicioSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { OrdenServicioDrizzleRepository } from "../infra/repositories/orden-servicio.drizzle.js";
import { createOrdenServicioHandlers } from "./handlers.js";
import { listOrdenesQuerySchema } from "./validators.js";

const repo = new OrdenServicioDrizzleRepository(getDb());
const h = createOrdenServicioHandlers(repo);

export const ordenServicioRoutes = new Hono<{ Variables: HonoVariables }>();

ordenServicioRoutes.use(authMiddleware);

ordenServicioRoutes.get("/ordenes-servicio", validateQuery(listOrdenesQuerySchema), h.list);
ordenServicioRoutes.post("/ordenes-servicio", validateBody(createOrdenServicioSchema), h.create);
ordenServicioRoutes.get("/ordenes-servicio/:id", h.getById);
ordenServicioRoutes.put("/ordenes-servicio/:id", validateBody(updateOrdenServicioSchema), h.update);
ordenServicioRoutes.put(
  "/ordenes-servicio/:id/estado",
  validateBody(updateEstadoOrdenServicioSchema),
  h.updateEstado
);
ordenServicioRoutes.get("/ordenes-servicio/:id/componentes", h.listComponentes);
ordenServicioRoutes.post(
  "/ordenes-servicio/:id/componentes",
  validateBody(addComponentesOrdenServicioSchema),
  h.addComponentes
);
ordenServicioRoutes.get("/ordenes-servicio/:id/cotizacion", h.getCotizacion);
ordenServicioRoutes.post(
  "/ordenes-servicio/:id/cotizacion",
  validateBody(addCotizacionOrdenServicioSchema),
  h.addCotizacion
);
ordenServicioRoutes.put(
  "/ordenes-servicio/:id/cotizacion/aprobar",
  validateBody(aprobarCotizacionSchema),
  h.aprobarCotizacion
);
ordenServicioRoutes.get("/ordenes-servicio/:id/evidencias", h.getEvidencias);
ordenServicioRoutes.post(
  "/ordenes-servicio/:id/evidencias",
  validateBody(addEvidenciaSchema),
  h.addEvidencia
);
ordenServicioRoutes.delete("/ordenes-servicio/:id/evidencias/:evidenciaId", h.deleteEvidencia);
