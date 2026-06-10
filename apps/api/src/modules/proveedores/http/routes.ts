import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { ProveedorDrizzleRepository } from "../infra/repositories/proveedor.drizzle.js";
import { createProveedorHandlers } from "./handlers.js";
import {
  createCondicionPagoSchema,
  createProveedorContactoSchema,
  createProveedorLineaSchema,
  createProveedorMetodoPagoSchema,
  createProveedorSchema,
  listProveedoresQuerySchema,
  updateCondicionPagoSchema,
  updateProveedorContactoSchema,
  updateProveedorMetodoPagoSchema,
  updateProveedorSchema,
} from "./validators.js";

const proveedorRepo = new ProveedorDrizzleRepository(getDb());
const h = createProveedorHandlers(proveedorRepo);

export const proveedorRoutes = new Hono<{ Variables: HonoVariables }>();

proveedorRoutes.use("/proveedores", authMiddleware);
proveedorRoutes.use("/proveedores/*", authMiddleware);

// Condiciones de pago
proveedorRoutes.get("/proveedores/condiciones-pago", h.listCondiciones);
proveedorRoutes.post(
  "/proveedores/condiciones-pago",
  validateBody(createCondicionPagoSchema),
  h.createCondicion
);
proveedorRoutes.put(
  "/proveedores/condiciones-pago/:id",
  validateBody(updateCondicionPagoSchema),
  h.updateCondicion
);
proveedorRoutes.delete("/proveedores/condiciones-pago/:id", h.removeCondicion);

// Proveedores
proveedorRoutes.get("/proveedores", validateQuery(listProveedoresQuerySchema), h.list);
proveedorRoutes.post("/proveedores", validateBody(createProveedorSchema), h.create);
proveedorRoutes.get("/proveedores/:id", h.getById);
proveedorRoutes.put("/proveedores/:id", validateBody(updateProveedorSchema), h.update);
proveedorRoutes.delete("/proveedores/:id", h.remove);

// Contactos
proveedorRoutes.get("/proveedores/:id/contactos", h.listContactos);
proveedorRoutes.post(
  "/proveedores/:id/contactos",
  validateBody(createProveedorContactoSchema),
  h.createContacto
);
proveedorRoutes.put(
  "/proveedores/:provId/contactos/:id",
  validateBody(updateProveedorContactoSchema),
  h.updateContacto
);
proveedorRoutes.delete("/proveedores/:provId/contactos/:id", h.removeContacto);

// Métodos de pago
proveedorRoutes.get("/proveedores/:id/metodos-pago", h.listMetodosPago);
proveedorRoutes.post(
  "/proveedores/:id/metodos-pago",
  validateBody(createProveedorMetodoPagoSchema),
  h.createMetodoPago
);
proveedorRoutes.put(
  "/proveedores/:provId/metodos-pago/:id",
  validateBody(updateProveedorMetodoPagoSchema),
  h.updateMetodoPago
);
proveedorRoutes.delete("/proveedores/:provId/metodos-pago/:id", h.removeMetodoPago);

// Líneas de producto
proveedorRoutes.get("/proveedores/:id/lineas", h.listLineas);
proveedorRoutes.post(
  "/proveedores/:id/lineas",
  validateBody(createProveedorLineaSchema),
  h.createLinea
);
proveedorRoutes.delete("/proveedores/:provId/lineas/:id", h.removeLinea);
