import {
  createTarifaDistritoSchema,
  createVisitaDomicilioSchema,
  disponibilidadTecnicoQuerySchema,
  generarOsFromVisitaSchema,
  listTarifasDistritoQuerySchema,
  listVisitasDomicilioQuerySchema,
  updateEstadoVisitaSchema,
  updateTarifaDistritoSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { DomicilioDrizzleRepository } from "../infra/repositories/domicilio.drizzle.js";
import { TarifasHandler } from "./handlers/tarifas.handler.js";
import { VisitasHandler } from "./handlers/visitas.handler.js";

const repo = new DomicilioDrizzleRepository(getDb());
const tarifasH = new TarifasHandler(repo);
const visitasH = new VisitasHandler(repo);

export const domicilioRoutes = new Hono<{ Variables: HonoVariables }>();

domicilioRoutes.use(authMiddleware);

// Tarifas
domicilioRoutes.get(
  "/tarifas-distrito",
  validateQuery(listTarifasDistritoQuerySchema),
  tarifasH.list
);
domicilioRoutes.post(
  "/tarifas-distrito",
  validateBody(createTarifaDistritoSchema),
  tarifasH.create
);
domicilioRoutes.put(
  "/tarifas-distrito/:id",
  validateBody(updateTarifaDistritoSchema),
  tarifasH.update
);
domicilioRoutes.delete("/tarifas-distrito/:id", tarifasH.remove);

// Visitas
domicilioRoutes.get(
  "/visitas-domicilio",
  validateQuery(listVisitasDomicilioQuerySchema),
  visitasH.list
);
domicilioRoutes.post(
  "/visitas-domicilio",
  validateBody(createVisitaDomicilioSchema),
  visitasH.create
);
domicilioRoutes.get("/visitas-domicilio/:id", visitasH.findById);
domicilioRoutes.put(
  "/visitas-domicilio/:id/estado",
  validateBody(updateEstadoVisitaSchema),
  visitasH.updateEstado
);
domicilioRoutes.post(
  "/visitas-domicilio/:id/generar-os",
  validateBody(generarOsFromVisitaSchema),
  visitasH.generarOs
);

// Disponibilidad técnicos
domicilioRoutes.get(
  "/tecnicos/disponibilidad",
  validateQuery(disponibilidadTecnicoQuerySchema),
  visitasH.disponibilidad
);
