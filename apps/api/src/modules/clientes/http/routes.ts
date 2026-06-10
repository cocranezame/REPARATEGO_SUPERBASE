import { createClienteSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { ClienteDrizzleRepository } from "../infra/repositories/cliente.drizzle.js";
import { ClienteDireccionDrizzleRepository } from "../infra/repositories/cliente-direccion.drizzle.js";
import { createClienteHandlers } from "./handlers.js";
import {
  buscarDocumentoQuerySchema,
  createClienteDireccionHttpSchema,
  listClientesQuerySchema,
  updateClienteDireccionSchema,
  updateClienteHttpSchema,
} from "./validators.js";

const clienteRepo = new ClienteDrizzleRepository(getDb());
const direccionRepo = new ClienteDireccionDrizzleRepository(getDb());
const h = createClienteHandlers(clienteRepo, direccionRepo);

export const clienteRoutes = new Hono<{ Variables: HonoVariables }>();

clienteRoutes.use("/clientes", authMiddleware);
clienteRoutes.use("/clientes/*", authMiddleware);

clienteRoutes.get(
  "/clientes/buscar-documento",
  validateQuery(buscarDocumentoQuerySchema),
  h.buscarDocumento
);
clienteRoutes.get("/clientes", validateQuery(listClientesQuerySchema), h.list);
clienteRoutes.post("/clientes", validateBody(createClienteSchema), h.create);
clienteRoutes.get("/clientes/:id", h.getById);
clienteRoutes.put("/clientes/:id", validateBody(updateClienteHttpSchema), h.update);
clienteRoutes.delete("/clientes/:id", h.remove);
clienteRoutes.get("/clientes/:id/direcciones", h.listDirecciones);
clienteRoutes.post(
  "/clientes/:id/direcciones",
  validateBody(createClienteDireccionHttpSchema),
  h.createDireccion
);
clienteRoutes.put(
  "/clientes/:clienteId/direcciones/:id",
  validateBody(updateClienteDireccionSchema),
  h.updateDireccion
);
clienteRoutes.delete("/clientes/:clienteId/direcciones/:id", h.removeDireccion);
