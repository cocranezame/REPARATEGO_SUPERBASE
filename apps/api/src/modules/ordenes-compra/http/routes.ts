import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { OrdenCompraDrizzleRepository } from "../infra/repositories/orden-compra.drizzle.js";
import { createOrdenCompraHandlers } from "./handlers.js";
import {
  confirmarOrdenCompraSchema,
  generarOrdenCompraSchema,
  listOrdenesQuerySchema,
  updateEstadoOrdenCompraSchema,
} from "./validators.js";

const repo = new OrdenCompraDrizzleRepository(getDb());
const h = createOrdenCompraHandlers(repo);

export const ordenCompraRoutes = new Hono<{ Variables: HonoVariables }>();

ordenCompraRoutes.use(authMiddleware);

ordenCompraRoutes.get("/ordenes-compra", validateQuery(listOrdenesQuerySchema), h.list);
ordenCompraRoutes.post(
  "/ordenes-compra/generar",
  validateBody(generarOrdenCompraSchema),
  h.generar
);
ordenCompraRoutes.get("/ordenes-compra/:id", h.getById);
ordenCompraRoutes.put(
  "/ordenes-compra/:id/estado",
  validateBody(updateEstadoOrdenCompraSchema),
  h.updateEstado
);
ordenCompraRoutes.post(
  "/ordenes-compra/:id/confirmar",
  validateBody(confirmarOrdenCompraSchema),
  h.confirmar
);
