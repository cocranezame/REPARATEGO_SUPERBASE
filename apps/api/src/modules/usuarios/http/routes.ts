import { RolUsuario } from "@kallpasoft/shared";
import { createUsuarioSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { UsuarioDrizzleRepository } from "../infra/repositories/usuario.drizzle.js";
import { createUsuarioHandlers } from "./handlers.js";
import { listUsuariosQuerySchema, updateUsuarioHttpSchema } from "./validators.js";

const repo = new UsuarioDrizzleRepository(getDb());
const h = createUsuarioHandlers(repo);

export const usuarioRoutes = new Hono<{ Variables: HonoVariables }>();

usuarioRoutes.use("/usuarios", authMiddleware, authorize(RolUsuario.ADMIN));
usuarioRoutes.use("/usuarios/*", authMiddleware, authorize(RolUsuario.ADMIN));

usuarioRoutes.get("/usuarios", validateQuery(listUsuariosQuerySchema), h.list);
usuarioRoutes.post("/usuarios", validateBody(createUsuarioSchema), h.create);
usuarioRoutes.get("/usuarios/:id", h.getById);
usuarioRoutes.put("/usuarios/:id", validateBody(updateUsuarioHttpSchema), h.update);
usuarioRoutes.delete("/usuarios/:id", h.remove);
