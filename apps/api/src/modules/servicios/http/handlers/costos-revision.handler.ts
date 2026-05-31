import type { CreateCostoRevisionInput, UpdateCostoRevisionInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class CostosRevisionHandler {
  constructor(private readonly repo: IServicioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const items = await this.repo.listCostosRevision(tenantId);
    return c.json({ success: true, data: items });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateCostoRevisionInput;
    const item = await this.repo.createCostoRevision(
      tenantId,
      { categoria_id: body.categoria_id, monto: body.monto },
      userId
    );
    return c.json({ success: true, data: item }, 201);
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateCostoRevisionInput;
    const item = await this.repo.updateCostoRevision(tenantId, id, {
      ...(body.monto !== undefined ? { monto: body.monto } : {}),
      ...(body.activo !== undefined ? { activo: body.activo } : {}),
    });
    if (!item) throw new ApiError("COSTO_NOT_FOUND", "Costo de revisión no encontrado", 404);
    return c.json({ success: true, data: item });
  };
}
