import type {
  CreateRequerimientoInput,
  UpdateRequerimientoEstadoInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class RequerimientosHandler {
  constructor(private readonly repo: IServicioRepository) {}

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateRequerimientoInput;
    const req = await this.repo.createRequerimiento(
      tenantId,
      ordenId,
      {
        ...(body.producto_id !== undefined ? { producto_id: body.producto_id } : {}),
        ...(body.imagen_url !== undefined ? { imagen_url: body.imagen_url } : {}),
        descripcion: body.descripcion,
        cantidad: body.cantidad,
        ...(body.observacion !== undefined ? { observacion: body.observacion } : {}),
      },
      userId
    );
    return c.json({ success: true, data: req }, 201);
  };

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listRequerimientos(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };

  updateEstado = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateRequerimientoEstadoInput;
    const req = await this.repo.updateRequerimientoEstado(tenantId, id, { estado: body.estado });
    if (!req) throw new ApiError("REQUERIMIENTO_NOT_FOUND", "Requerimiento no encontrado", 404);
    return c.json({ success: true, data: req });
  };
}
