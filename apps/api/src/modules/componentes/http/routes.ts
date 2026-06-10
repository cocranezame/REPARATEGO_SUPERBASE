import { createComponenteSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { ComponenteDrizzleRepository } from "../infra/repositories/componente.drizzle.js";
import { createComponenteHandlers } from "./handlers.js";
import { listComponentesQuerySchema, updateComponenteHttpSchema } from "./validators.js";

const repo = new ComponenteDrizzleRepository(getDb());
const h = createComponenteHandlers(repo);

export const componenteRoutes = new Hono<{ Variables: HonoVariables }>();

componenteRoutes.use("/componentes", authMiddleware);
componenteRoutes.use("/componentes/*", authMiddleware);

componenteRoutes.get("/componentes", validateQuery(listComponentesQuerySchema), h.list);
componenteRoutes.post("/componentes", validateBody(createComponenteSchema), h.create);
componenteRoutes.get("/componentes/:id", h.getById);
componenteRoutes.put("/componentes/:id", validateBody(updateComponenteHttpSchema), h.update);
componenteRoutes.delete("/componentes/:id", h.remove);
