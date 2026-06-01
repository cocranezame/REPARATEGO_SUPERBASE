import { caja as cajaTable } from "@kallpasoft/db";
import { and, eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { getDb } from "../lib/db.js";
import type { HonoVariables } from "../types/context.js";

export const requireCajaAbierta: MiddlewareHandler<{ Variables: HonoVariables }> = async (
  c,
  next
) => {
  const db = getDb();
  const tenantId = c.get("tenantId");
  const userId = c.get("userId");

  const rows = await db
    .select({ id: cajaTable.id })
    .from(cajaTable)
    .where(
      and(
        eq(cajaTable.tenant_id, tenantId),
        eq(cajaTable.usuario_id, userId),
        eq(cajaTable.estado, "ABIERTA")
      )
    )
    .limit(1);

  if (!rows[0]) {
    return c.json(
      {
        success: false,
        error: { code: "CAJA_CERRADA", message: "No tienes una caja abierta" },
      },
      403
    );
  }

  c.set("cajaId", rows[0].id);
  return next();
};
