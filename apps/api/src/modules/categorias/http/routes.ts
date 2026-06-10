import { createCategoriaSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CategoriaDrizzleRepository } from "../infra/repositories/categoria.drizzle.js";
import { createCategoriaHandlers } from "./handlers.js";
import { listCategoriasQuerySchema, updateCategoriaHttpSchema } from "./validators.js";

const repo = new CategoriaDrizzleRepository(getDb());
const h = createCategoriaHandlers(repo);

export const categoriaRoutes = new Hono<{ Variables: HonoVariables }>();

categoriaRoutes.use("/categorias", authMiddleware);
categoriaRoutes.use("/categorias/*", authMiddleware);

categoriaRoutes.get("/categorias", validateQuery(listCategoriasQuerySchema), h.list);
categoriaRoutes.post("/categorias", validateBody(createCategoriaSchema), h.create);
categoriaRoutes.get("/categorias/:id", h.getById);
categoriaRoutes.put("/categorias/:id", validateBody(updateCategoriaHttpSchema), h.update);
categoriaRoutes.delete("/categorias/:id", h.remove);
