import type { CreateWaCuentaInput, UpdateWaCuentaInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class WaCuentasHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const cuentas = await this.repo.listWaCuentas(tenantId);
    return c.json({ success: true, data: cuentas });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateWaCuentaInput;
    try {
      const cuenta = await this.repo.createWaCuenta(tenantId, body, userId);
      return c.json({ success: true, data: cuenta }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al crear cuenta WA";
      throw new ApiError("WA_CUENTA_ERROR", msg, 400);
    }
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateWaCuentaInput;
    const cuenta = await this.repo.updateWaCuenta(tenantId, id, body);
    if (!cuenta) throw new ApiError("WA_CUENTA_NOT_FOUND", "Cuenta WA no encontrada", 404);
    return c.json({ success: true, data: cuenta });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deleteWaCuenta(tenantId, id);
    if (!ok) throw new ApiError("WA_CUENTA_NOT_FOUND", "Cuenta WA no encontrada", 404);
    return c.json({ success: true, data: { deleted: true } });
  };
}
