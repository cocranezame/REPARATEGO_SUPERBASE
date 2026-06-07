import { createModeloSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { ModeloDrizzleRepository } from "../infra/repositories/modelo.drizzle.js";
import { createModeloHandlers } from "./handlers.js";
import { listModelosQuerySchema, updateModeloHttpSchema } from "./validators.js";

const repo = new ModeloDrizzleRepository(getDb());
const h = createModeloHandlers(repo);

export const modeloRoutes = new Hono<{ Variables: HonoVariables }>();

modeloRoutes.use("/modelos", authMiddleware);
modeloRoutes.use("/modelos/*", authMiddleware);

modeloRoutes.get("/modelos", validateQuery(listModelosQuerySchema), h.list);
modeloRoutes.post("/modelos", validateBody(createModeloSchema), h.create);
modeloRoutes.get("/modelos/:id", h.getById);
modeloRoutes.put("/modelos/:id", validateBody(updateModeloHttpSchema), h.update);
modeloRoutes.delete("/modelos/:id", h.remove);
