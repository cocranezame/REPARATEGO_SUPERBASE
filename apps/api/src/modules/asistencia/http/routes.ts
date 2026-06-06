import {
  calcularPlanillaSchema,
  calcularPlanillaTodosSchema,
  createPermisoAsistenciaSchema,
  createPuntoControlWifiSchema,
  createTrabajadorConfigSchema,
  createTurnoTrabajoSchema,
  listAsistenciaParamsSchema,
  listPermisosQuerySchema,
  listPlanillaParamsSchema,
  marcarAsistenciaSchema,
  pagarPlanillaSchema,
  portalTrabajadorHistorialQuerySchema,
  portalTrabajadorLoginSchema,
  portalTrabajadorPlanillaQuerySchema,
  rechazarPermisoSchema,
  registroManualAsistenciaSchema,
  reporteQuerySchema,
  updatePuntoControlWifiSchema,
  updateTrabajadorConfigSchema,
  updateTurnoTrabajoSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import type { PortalTrabajadorVariables } from "../../../middlewares/portal-trabajador-auth.js";
import { portalTrabajadorAuthMiddleware } from "../../../middlewares/portal-trabajador-auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { AsistenciaDrizzleRepository } from "../infra/repositories/asistencia.drizzle.js";
import { MarcadoHandler } from "./handlers/marcado.handler.js";
import { PermisosHandler } from "./handlers/permisos.handler.js";
import { PlanillaHandler } from "./handlers/planilla.handler.js";
import { PortalTrabajadorHandler } from "./handlers/portal-trabajador.handler.js";
import { PuntosControlHandler } from "./handlers/puntos-control.handler.js";
import { ReportesHandler } from "./handlers/reportes.handler.js";
import { TrabajadoresHandler } from "./handlers/trabajadores.handler.js";
import { TurnosHandler } from "./handlers/turnos.handler.js";

const repo = new AsistenciaDrizzleRepository(getDb());
const turnosH = new TurnosHandler(repo);
const puntosH = new PuntosControlHandler(repo);
const trabajadoresH = new TrabajadoresHandler(repo);
const marcadoH = new MarcadoHandler(repo);
const planillaH = new PlanillaHandler(repo);
const permisosH = new PermisosHandler(repo);
const reportesH = new ReportesHandler(repo);
const portalH = new PortalTrabajadorHandler(repo);

export const asistenciaRoutes = new Hono<{ Variables: HonoVariables }>();

// ─── Auth middleware global para rutas /asistencia/* ─────────────────────────
asistenciaRoutes.use("/asistencia/*", authMiddleware);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 1 — Turnos de trabajo
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.get("/asistencia/turnos", authorize("ADMIN"), turnosH.list);
asistenciaRoutes.post(
  "/asistencia/turnos",
  authorize("ADMIN"),
  validateBody(createTurnoTrabajoSchema),
  turnosH.create
);
asistenciaRoutes.get("/asistencia/turnos/:id", authorize("ADMIN"), turnosH.findById);
asistenciaRoutes.put(
  "/asistencia/turnos/:id",
  authorize("ADMIN"),
  validateBody(updateTurnoTrabajoSchema),
  turnosH.update
);
asistenciaRoutes.delete("/asistencia/turnos/:id", authorize("ADMIN"), turnosH.remove);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 2 — Puntos de control WiFi
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.get("/asistencia/puntos-control", authorize("ADMIN"), puntosH.list);
asistenciaRoutes.post(
  "/asistencia/puntos-control",
  authorize("ADMIN"),
  validateBody(createPuntoControlWifiSchema),
  puntosH.create
);
asistenciaRoutes.get("/asistencia/puntos-control/:id", authorize("ADMIN"), puntosH.findById);
asistenciaRoutes.put(
  "/asistencia/puntos-control/:id",
  authorize("ADMIN"),
  validateBody(updatePuntoControlWifiSchema),
  puntosH.update
);
asistenciaRoutes.delete("/asistencia/puntos-control/:id", authorize("ADMIN"), puntosH.remove);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 3 — Trabajador config
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.get("/asistencia/trabajadores", authorize("ADMIN"), trabajadoresH.list);
asistenciaRoutes.post(
  "/asistencia/trabajadores",
  authorize("ADMIN"),
  validateBody(createTrabajadorConfigSchema),
  trabajadoresH.create
);
asistenciaRoutes.get("/asistencia/trabajadores/:id", authorize("ADMIN"), trabajadoresH.findById);
asistenciaRoutes.put(
  "/asistencia/trabajadores/:id",
  authorize("ADMIN"),
  validateBody(updateTrabajadorConfigSchema),
  trabajadoresH.update
);
asistenciaRoutes.delete("/asistencia/trabajadores/:id", authorize("ADMIN"), trabajadoresH.remove);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 4 — Marcado de asistencia (auth JWT interno, cualquier rol con config)
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.post("/asistencia/marcar", validateBody(marcarAsistenciaSchema), marcadoH.marcar);
asistenciaRoutes.get(
  "/asistencia/mi-historial",
  validateQuery(listAsistenciaParamsSchema),
  marcadoH.miHistorial
);
asistenciaRoutes.post(
  "/asistencia/registro-manual",
  authorize("ADMIN", "ASISTENTE"),
  validateBody(registroManualAsistenciaSchema),
  marcadoH.registroManual
);
asistenciaRoutes.get("/asistencia/hoy", authorize("ADMIN"), marcadoH.panelHoy);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 5 — Planilla
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.post(
  "/asistencia/planilla/calcular",
  authorize("ADMIN"),
  validateBody(calcularPlanillaSchema),
  planillaH.calcular
);
asistenciaRoutes.post(
  "/asistencia/planilla/calcular-todos",
  authorize("ADMIN"),
  validateBody(calcularPlanillaTodosSchema),
  planillaH.calcularTodos
);
// IMPORTANTE: la ruta /planilla/detalle/:id debe ir ANTES de /planilla/:periodo
// para evitar que "detalle" se interprete como período.
asistenciaRoutes.get("/asistencia/planilla/detalle/:id", authorize("ADMIN"), planillaH.findDetalle);
asistenciaRoutes.get(
  "/asistencia/planilla/:periodo",
  authorize("ADMIN"),
  validateQuery(listPlanillaParamsSchema),
  planillaH.list
);
asistenciaRoutes.put("/asistencia/planilla/:id/aprobar", authorize("ADMIN"), planillaH.aprobar);
asistenciaRoutes.put(
  "/asistencia/planilla/:id/pagar",
  authorize("ADMIN"),
  validateBody(pagarPlanillaSchema),
  planillaH.pagar
);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 6 — Permisos y justificaciones
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.get(
  "/asistencia/permisos",
  authorize("ADMIN", "ASISTENTE"),
  validateQuery(listPermisosQuerySchema),
  permisosH.list
);
// POST /asistencia/permisos — A21: cualquier rol puede solicitar
asistenciaRoutes.post(
  "/asistencia/permisos",
  validateBody(createPermisoAsistenciaSchema),
  permisosH.create
);
asistenciaRoutes.get(
  "/asistencia/permisos/:id",
  authorize("ADMIN", "ASISTENTE"),
  permisosH.findById
);
asistenciaRoutes.put(
  "/asistencia/permisos/:id/aprobar",
  authorize("ADMIN", "ASISTENTE"),
  permisosH.aprobar
);
asistenciaRoutes.put(
  "/asistencia/permisos/:id/rechazar",
  authorize("ADMIN", "ASISTENTE"),
  validateBody(rechazarPermisoSchema),
  permisosH.rechazar
);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 7 — Reportes
// ══════════════════════════════════════════════════════════════════════════════
asistenciaRoutes.get(
  "/asistencia/reportes/asistencia",
  authorize("ADMIN"),
  validateQuery(reporteQuerySchema),
  reportesH.reporteAsistencia
);
asistenciaRoutes.get(
  "/asistencia/reportes/planilla",
  authorize("ADMIN"),
  validateQuery(reporteQuerySchema),
  reportesH.reportePlanilla
);

// ══════════════════════════════════════════════════════════════════════════════
// GRUPO 8 — Portal trabajador (auth separada)
// ══════════════════════════════════════════════════════════════════════════════

// Login público — no necesita authMiddleware interno
export const portalAsistenciaRoutes = new Hono();

portalAsistenciaRoutes.post(
  "/portal/asistencia/auth/login",
  validateBody(portalTrabajadorLoginSchema),
  portalH.login
);

// Rutas protegidas con token portal_trabajador
const portalProtected = new Hono<{ Variables: PortalTrabajadorVariables }>();
portalProtected.use("/portal/asistencia/*", portalTrabajadorAuthMiddleware);

portalProtected.get("/portal/asistencia/estado", portalH.estado);
portalProtected.get(
  "/portal/asistencia/historial",
  validateQuery(portalTrabajadorHistorialQuerySchema),
  portalH.historial
);
portalProtected.get(
  "/portal/asistencia/planilla",
  validateQuery(portalTrabajadorPlanillaQuerySchema),
  portalH.planilla
);

portalAsistenciaRoutes.route("/", portalProtected);
