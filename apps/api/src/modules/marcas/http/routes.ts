import { createMarcaSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { MarcaDrizzleRepository } from "../infra/repositories/marca.drizzle.js";
import { createMarcaHandlers } from "./handlers.js";
import { listMarcasQuerySchema, updateMarcaHttpSchema } from "./validators.js";

const repo = new MarcaDrizzleRepository(getDb());
const h = createMarcaHandlers(repo);

export const marcaRoutes = new Hono<{ Variables: HonoVariables }>();

marcaRoutes.use(authMiddleware);

marcaRoutes.get("/marcas", validateQuery(listMarcasQuerySchema), h.list);
marcaRoutes.post("/marcas", validateBody(createMarcaSchema), h.create);
marcaRoutes.get("/marcas/:id", h.getById);
marcaRoutes.put("/marcas/:id", validateBody(updateMarcaHttpSchema), h.update);
marcaRoutes.delete("/marcas/:id", h.remove);
