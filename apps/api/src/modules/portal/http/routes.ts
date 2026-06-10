import {
  portalAceptarPresupuestoSchema,
  portalAceptarValidacionSchema,
  portalLoginSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import type { PortalVariables } from "../../../middlewares/portal-auth.js";
import { portalAuthMiddleware } from "../../../middlewares/portal-auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import { PortalDrizzleRepository } from "../infra/repositories/portal.drizzle.js";
import { PortalHandler } from "./handlers/portal.handler.js";

const repo = new PortalDrizzleRepository(getDb());
const h = new PortalHandler(repo);

export const portalRoutes = new Hono();

// ─── Auth (público) ───────────────────────────────────────────────────────────
portalRoutes.post("/portal/auth/login", validateBody(portalLoginSchema), h.login);

// ─── Rutas protegidas con token portal ────────────────────────────────────────
const protected_ = new Hono<{ Variables: PortalVariables }>();
protected_.use("/portal/*", portalAuthMiddleware);

protected_.get("/portal/mis-equipos", h.misEquipos);
protected_.get("/portal/servicios/:id", h.getServicio);
protected_.post(
  "/portal/servicios/:id/aceptar-validacion",
  validateBody(portalAceptarValidacionSchema),
  h.aceptarValidacion
);
protected_.post(
  "/portal/servicios/:id/aceptar-presupuesto",
  validateBody(portalAceptarPresupuestoSchema),
  h.aceptarPresupuesto
);

// Mount protected routes
portalRoutes.route("/", protected_);
