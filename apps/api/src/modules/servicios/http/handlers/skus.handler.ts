import type { AsignarSkuInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class SkusHandler {
  constructor(private readonly repo: IServicioRepository) {}

  asignar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as AsignarSkuInput;

    try {
      const sku = await this.repo.asignarSku(
        tenantId,
        ordenId,
        {
          lote_id: body.lote_id,
          producto_id: body.producto_id,
          cantidad: body.cantidad,
          precio_presupuesto: body.precio_presupuesto,
        },
        userId
      );
      return c.json({ success: true, data: sku }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al asignar SKU";
      throw new ApiError("SKU_ERROR", msg, 400);
    }
  };

  delete = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const skuId = c.req.param("skuId") as string;
    const ok = await this.repo.deleteSku(tenantId, ordenId, skuId);
    if (!ok) throw new ApiError("SKU_NOT_FOUND", "SKU no encontrado", 404);
    return c.json({ success: true });
  };

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listSkus(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };
}
