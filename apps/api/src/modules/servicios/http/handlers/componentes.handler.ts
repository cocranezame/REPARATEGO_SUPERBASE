import type { UpsertComponentesOrdenInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class ComponentesHandler {
  constructor(private readonly repo: IServicioRepository) {}

  upsert = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as UpsertComponentesOrdenInput;

    try {
      const items = await this.repo.upsertComponentes(
        tenantId,
        ordenId,
        {
          etapa: body.etapa,
          items: body.items.map((it) => ({
            componente_id: it.componente_id,
            tipo_afectacion: it.tipo_afectacion,
            tipo_accion: it.tipo_accion,
            etapa: it.etapa,
          })),
        },
        userId
      );
      return c.json({ success: true, data: items });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al actualizar componentes";
      throw new ApiError("COMPONENTES_ERROR", msg, 400);
    }
  };

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listComponentes(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };
}
