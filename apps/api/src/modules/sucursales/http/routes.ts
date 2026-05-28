import { createSucursalSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { SucursalDrizzleRepository } from "../infra/repositories/sucursal.drizzle.js";
import { createSucursalHandlers } from "./handlers.js";
import { listSucursalesQuerySchema, updateSucursalHttpSchema } from "./validators.js";

const repo = new SucursalDrizzleRepository(getDb());
const h = createSucursalHandlers(repo);

export const sucursalRoutes = new Hono<{ Variables: HonoVariables }>();

sucursalRoutes.use(authMiddleware);

sucursalRoutes.get("/sucursales", validateQuery(listSucursalesQuerySchema), h.list);
sucursalRoutes.post("/sucursales", validateBody(createSucursalSchema), h.create);
sucursalRoutes.get("/sucursales/:id", h.getById);
sucursalRoutes.put("/sucursales/:id", validateBody(updateSucursalHttpSchema), h.update);
sucursalRoutes.delete("/sucursales/:id", h.remove);
