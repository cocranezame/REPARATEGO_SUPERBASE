import {
  actualizarEnvioSchema,
  addVentaPagoSchema,
  anularVentaSchema,
  createVentaSchema,
  listEnviosCalendarioQuerySchema,
  listVentasQuerySchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { requireCajaAbierta } from "../../../middlewares/require-caja.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { VentaDrizzleRepository } from "../infra/repositories/venta.drizzle.js";
import { createVentaHandlers } from "./handlers.js";

const repo = new VentaDrizzleRepository(getDb());
const h = createVentaHandlers(repo);

export const ventaRoutes = new Hono<{ Variables: HonoVariables }>();

ventaRoutes.use(authMiddleware);
ventaRoutes.use(requireCajaAbierta);

// ─── Crear venta ──────────────────────────────────────────────────────────────
ventaRoutes.post("/ventas", authorize("VENDEDOR"), validateBody(createVentaSchema), h.create);

// ─── Listar / detalle ─────────────────────────────────────────────────────────
ventaRoutes.get(
  "/ventas",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listVentasQuerySchema),
  h.list
);
ventaRoutes.get("/ventas/:id", authorize("VENDEDOR", "ADMIN"), h.getById);

// ─── Pagos ────────────────────────────────────────────────────────────────────
ventaRoutes.post(
  "/ventas/:id/pago",
  authorize("VENDEDOR"),
  validateBody(addVentaPagoSchema),
  h.addPago
);

// ─── Anulación ────────────────────────────────────────────────────────────────
// V28: requiere ADMIN (ASISTENTE pendiente de migración DB — ver C017)
ventaRoutes.patch(
  "/ventas/:id/anular",
  authorize("ADMIN"),
  validateBody(anularVentaSchema),
  h.anular
);

// ─── Envío ────────────────────────────────────────────────────────────────────
ventaRoutes.patch(
  "/ventas/:id/envio",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(actualizarEnvioSchema),
  h.actualizarEnvio
);
ventaRoutes.patch("/ventas/:id/envio/despachar", authorize("VENDEDOR", "ADMIN"), h.despacharEnvio);
ventaRoutes.get(
  "/ventas/envios/calendario",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listEnviosCalendarioQuerySchema),
  h.listEnviosCalendario
);
