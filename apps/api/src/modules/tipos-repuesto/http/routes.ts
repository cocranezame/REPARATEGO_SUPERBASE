import { createTipoRepuestoSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { TipoRepuestoDrizzleRepository } from "../infra/repositories/tipo-repuesto.drizzle.js";
import { createTipoRepuestoHandlers } from "./handlers.js";
import { listTiposRepuestoQuerySchema, updateTipoRepuestoHttpSchema } from "./validators.js";

const repo = new TipoRepuestoDrizzleRepository(getDb());
const h = createTipoRepuestoHandlers(repo);

export const tipoRepuestoRoutes = new Hono<{ Variables: HonoVariables }>();

tipoRepuestoRoutes.use("/tipos-repuesto", authMiddleware);
tipoRepuestoRoutes.use("/tipos-repuesto/*", authMiddleware);

tipoRepuestoRoutes.get("/tipos-repuesto", validateQuery(listTiposRepuestoQuerySchema), h.list);
tipoRepuestoRoutes.post("/tipos-repuesto", validateBody(createTipoRepuestoSchema), h.create);
tipoRepuestoRoutes.get("/tipos-repuesto/:id", h.getById);
tipoRepuestoRoutes.put("/tipos-repuesto/:id", validateBody(updateTipoRepuestoHttpSchema), h.update);
tipoRepuestoRoutes.delete("/tipos-repuesto/:id", h.remove);
