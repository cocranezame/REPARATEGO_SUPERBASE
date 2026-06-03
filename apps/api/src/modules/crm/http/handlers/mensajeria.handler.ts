import type { CreateMensajeInternoInput, ListMensajesInternosQuery } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class MensajeriaHandler {
  constructor(private readonly repo: ICrmRepository) {}

  listConversaciones = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const query = c.req.valid("query") as ListMensajesInternosQuery;
    const result = await this.repo.listMensajeriaConversaciones(tenantId, userId, {
      page: query.page,
      pageSize: query.pageSize,
    });
    return c.json({ success: true, data: result.items, total: result.total });
  };

  listMensajes = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const otroUsuarioId = c.req.param("usuario_id") as string;
    const query = c.req.valid("query") as ListMensajesInternosQuery;
    const result = await this.repo.listMensajesInternos(tenantId, userId, otroUsuarioId, {
      page: query.page,
      pageSize: query.pageSize,
    });
    return c.json({ success: true, data: result.items, total: result.total });
  };

  sendMensaje = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateMensajeInternoInput;
    const mensaje = await this.repo.createMensajeInterno(tenantId, userId, {
      destinatario_id: body.destinatario_id,
      contenido: body.contenido,
    });
    return c.json({ success: true, data: mensaje }, 201);
  };

  marcarLeido = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const mensajeId = c.req.param("mensaje_id") as string;
    const ok = await this.repo.marcarMensajeLeidoInterno(tenantId, mensajeId, userId);
    if (!ok) throw new ApiError("MENSAJE_NOT_FOUND", "Mensaje no encontrado o no autorizado", 404);
    return c.json({ success: true, data: { leido: true } });
  };
}
