import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { PagoProveedorDrizzleRepository } from "../infra/repositories/pago-proveedor.drizzle.js";
import { createPagoProveedorHandlers } from "./handlers.js";
import { createPagoProveedorSchema, listPagosProveedorQuerySchema } from "./validators.js";

const repo = new PagoProveedorDrizzleRepository(getDb());
const h = createPagoProveedorHandlers(repo);

export const pagoProveedorRoutes = new Hono<{ Variables: HonoVariables }>();

pagoProveedorRoutes.use("/pagos-proveedor", authMiddleware);
pagoProveedorRoutes.use("/pagos-proveedor/*", authMiddleware);

pagoProveedorRoutes.get("/pagos-proveedor", validateQuery(listPagosProveedorQuerySchema), h.list);
pagoProveedorRoutes.post("/pagos-proveedor", validateBody(createPagoProveedorSchema), h.create);
