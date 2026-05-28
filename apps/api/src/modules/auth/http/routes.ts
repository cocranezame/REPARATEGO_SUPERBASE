import { loginSchema, logoutSchema, refreshTokenSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { AuthDrizzleRepository } from "../infra/repositories/auth.drizzle.js";
import { createAuthHandlers } from "./handlers.js";

const repo = new AuthDrizzleRepository(getDb());
const h = createAuthHandlers(repo);

export const authRoutes = new Hono<{ Variables: HonoVariables }>();

authRoutes.post("/auth/login", validateBody(loginSchema), h.login);
authRoutes.post("/auth/refresh", validateBody(refreshTokenSchema), h.refresh);
authRoutes.post("/auth/logout", authMiddleware, validateBody(logoutSchema), h.logout);
