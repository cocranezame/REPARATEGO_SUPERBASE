import type {
  CreateTarifaDistritoInput,
  ListTarifasDistritoQuery,
  UpdateTarifaDistritoInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IDomicilioRepository } from "../../domain/ports/domicilio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class TarifasHandler {
  constructor(private readonly repo: IDomicilioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListTarifasDistritoQuery;
    const tarifas = await this.repo.listTarifas(tenantId, {
      search: query.search,
      activo: query.activo,
    });
    return c.json({ success: true, data: tarifas });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateTarifaDistritoInput;
    const tarifa = await this.repo.createTarifa(tenantId, body);
    return c.json({ success: true, data: tarifa }, 201);
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateTarifaDistritoInput;
    const tarifa = await this.repo.updateTarifa(tenantId, id, {
      distrito: body.distrito,
      provincia: body.provincia,
      tarifa: body.tarifa,
      activo: body.activo,
    });
    if (!tarifa) throw new ApiError("TARIFA_NOT_FOUND", "Tarifa no encontrada", 404);
    return c.json({ success: true, data: tarifa });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deleteTarifa(tenantId, id);
    if (!ok) throw new ApiError("TARIFA_NOT_FOUND", "Tarifa no encontrada", 404);
    return c.json({ success: true, data: null });
  };
}
