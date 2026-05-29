import { RolUsuario } from "@kallpasoft/shared";
import { upsertFeatureFlagSchema } from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validateBody } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { FeatureFlagDrizzleRepository } from "../infra/repositories/feature-flag.drizzle.js";
import { createFeatureFlagHandlers } from "./handlers.js";

const repo = new FeatureFlagDrizzleRepository(getDb());
const h = createFeatureFlagHandlers(repo);

export const featureFlagRoutes = new Hono<{ Variables: HonoVariables }>();

featureFlagRoutes.use(authMiddleware, authorize(RolUsuario.ADMIN));

featureFlagRoutes.get("/feature-flags", h.list);
featureFlagRoutes.put("/feature-flags/:clave", validateBody(upsertFeatureFlagSchema), h.upsert);
