import {
  aceptacionManualSchema,
  aceptacionPortalSchema,
  addEvidenciaSchema,
  addInstanciaImagenSchema,
  addObservacionSchema,
  asignarSkuSchema,
  buscarPresupuestoQuerySchema,
  createCostoRevisionSchema,
  createInstanciaSchema,
  createOrdenServicioSchema,
  createRequerimientoSchema,
  listInstanciasQuerySchema,
  listOrdenesServicioQuerySchema,
  listPerifericosQuerySchema,
  registrarCotizacionSchema,
  updateCostoRevisionSchema,
  updateEstadoOrdenServicioSchema,
  updateOrdenServicioSchema,
  updateRequerimientoEstadoSchema,
  upsertComponentesOrdenSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { ServicioDrizzleRepository } from "../infra/repositories/servicio.drizzle.js";
import { AceptacionesHandler } from "./handlers/aceptaciones.handler.js";
import { ComponentesHandler } from "./handlers/componentes.handler.js";
import { CostosRevisionHandler } from "./handlers/costos-revision.handler.js";
import { CotizacionHandler } from "./handlers/cotizacion.handler.js";
import { EvidenciasHandler } from "./handlers/evidencias.handler.js";
import { HistorialHandler } from "./handlers/historial.handler.js";
import { InstanciasHandler } from "./handlers/instancias.handler.js";
import { OrdenesHandler } from "./handlers/ordenes.handler.js";
import { PerifericosHandler } from "./handlers/perifericos.handler.js";
import { RequerimientosHandler } from "./handlers/requerimientos.handler.js";
import { SkusHandler } from "./handlers/skus.handler.js";

const repo = new ServicioDrizzleRepository(getDb());

const instanciasH = new InstanciasHandler(repo);
const costosH = new CostosRevisionHandler(repo);
const ordenesH = new OrdenesHandler(repo);
const componentesH = new ComponentesHandler(repo);
const cotizacionH = new CotizacionHandler(repo);
const evidenciasH = new EvidenciasHandler(repo);
const skusH = new SkusHandler(repo);
const requerimientosH = new RequerimientosHandler(repo);
const aceptacionesH = new AceptacionesHandler(repo);
const historialH = new HistorialHandler(repo);
const perifericosH = new PerifericosHandler(repo);

export const serviciosRoutes = new Hono<{ Variables: HonoVariables }>();

serviciosRoutes.use("/servicios-v2/*", authMiddleware);

// ─── Periféricos ─────────────────────────────────────────────────────────────
serviciosRoutes.get(
  "/servicios-v2/perifericos",
  validateQuery(listPerifericosQuerySchema),
  perifericosH.list
);

// ─── Instancias ───────────────────────────────────────────────────────────────
serviciosRoutes.get(
  "/servicios-v2/instancias",
  validateQuery(listInstanciasQuerySchema),
  instanciasH.list
);
serviciosRoutes.post(
  "/servicios-v2/instancias",
  validateBody(createInstanciaSchema),
  instanciasH.create
);
serviciosRoutes.post(
  "/servicios-v2/instancias/:id/imagenes",
  validateBody(addInstanciaImagenSchema),
  instanciasH.addImagen
);

// ─── Costos de revisión ───────────────────────────────────────────────────────
serviciosRoutes.get("/servicios-v2/costos-revision", costosH.list);
serviciosRoutes.post(
  "/servicios-v2/costos-revision",
  validateBody(createCostoRevisionSchema),
  costosH.create
);
serviciosRoutes.patch(
  "/servicios-v2/costos-revision/:id",
  validateBody(updateCostoRevisionSchema),
  costosH.update
);

// ─── Órdenes ──────────────────────────────────────────────────────────────────
serviciosRoutes.get(
  "/servicios-v2/ordenes",
  validateQuery(listOrdenesServicioQuerySchema),
  ordenesH.list
);
serviciosRoutes.post(
  "/servicios-v2/ordenes",
  validateBody(createOrdenServicioSchema),
  ordenesH.create
);
serviciosRoutes.get("/servicios-v2/ordenes/:id", ordenesH.findById);
serviciosRoutes.patch(
  "/servicios-v2/ordenes/:id",
  validateBody(updateOrdenServicioSchema),
  ordenesH.update
);
serviciosRoutes.patch(
  "/servicios-v2/ordenes/:id/estado",
  validateBody(updateEstadoOrdenServicioSchema),
  ordenesH.updateEstado
);

// ─── Componentes ──────────────────────────────────────────────────────────────
serviciosRoutes.put(
  "/servicios-v2/ordenes/:id/componentes",
  validateBody(upsertComponentesOrdenSchema),
  componentesH.upsert
);
serviciosRoutes.get("/servicios-v2/ordenes/:id/componentes", componentesH.list);

// ─── Presupuesto / cotización ─────────────────────────────────────────────────
serviciosRoutes.get(
  "/servicios-v2/presupuesto/buscar",
  validateQuery(buscarPresupuestoQuerySchema),
  cotizacionH.buscarPresupuesto
);
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/cotizacion",
  validateBody(registrarCotizacionSchema),
  cotizacionH.registrar
);
serviciosRoutes.get("/servicios-v2/ordenes/:id/cotizacion", cotizacionH.get);

// ─── Evidencias ───────────────────────────────────────────────────────────────
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/evidencias",
  validateBody(addEvidenciaSchema),
  evidenciasH.add
);
serviciosRoutes.get("/servicios-v2/ordenes/:id/evidencias", evidenciasH.list);

// ─── SKUs asignados ───────────────────────────────────────────────────────────
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/skus",
  validateBody(asignarSkuSchema),
  skusH.asignar
);
serviciosRoutes.delete("/servicios-v2/ordenes/:id/skus/:skuId", skusH.delete);
serviciosRoutes.get("/servicios-v2/ordenes/:id/skus", skusH.list);

// ─── Requerimientos ───────────────────────────────────────────────────────────
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/requerimientos",
  validateBody(createRequerimientoSchema),
  requerimientosH.create
);
serviciosRoutes.get("/servicios-v2/ordenes/:id/requerimientos", requerimientosH.list);
serviciosRoutes.patch(
  "/servicios-v2/requerimientos/:id/estado",
  validateBody(updateRequerimientoEstadoSchema),
  requerimientosH.updateEstado
);

// ─── Aceptaciones ─────────────────────────────────────────────────────────────
// Both manual and portal schemas accepted — validated inside repository
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/aceptaciones",
  validateBody(aceptacionManualSchema.or(aceptacionPortalSchema)),
  aceptacionesH.registrar
);

// ─── Historial / Observaciones ────────────────────────────────────────────────
serviciosRoutes.get("/servicios-v2/ordenes/:id/historial", historialH.listHistorial);
serviciosRoutes.post(
  "/servicios-v2/ordenes/:id/observaciones",
  validateBody(addObservacionSchema),
  historialH.addObservacion
);
serviciosRoutes.get("/servicios-v2/ordenes/:id/observaciones", historialH.listObservaciones);
