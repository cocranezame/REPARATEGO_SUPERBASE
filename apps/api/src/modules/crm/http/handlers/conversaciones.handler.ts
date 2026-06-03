import type {
  AsignarVendedorConvInput,
  CambiarModoInput,
  EnviarMensajeInput,
  ListConversacionesQuery,
  ListMensajesQuery,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../../infra/services/meta-sender.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

const VENTANA_24H_MS = 24 * 60 * 60 * 1000;

export class ConversacionesHandler {
  constructor(
    private readonly repo: ICrmRepository,
    private readonly metaSender: MetaSenderService
  ) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListConversacionesQuery;
    const result = await this.repo.listConversaciones(tenantId, query);
    return c.json({ success: true, data: result.items, total: result.total });
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const conv = await this.repo.findConversacionById(tenantId, id);
    if (!conv) throw new ApiError("CONVERSACION_NOT_FOUND", "Conversación no encontrada", 404);
    return c.json({ success: true, data: conv });
  };

  listMensajes = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const query = c.req.valid("query") as ListMensajesQuery;
    const result = await this.repo.listMensajes(tenantId, id, query);
    return c.json({ success: true, data: result.items, total: result.total });
  };

  enviarMensaje = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as EnviarMensajeInput;

    const conv = await this.repo.findConversacionById(tenantId, id);
    if (!conv) throw new ApiError("CONVERSACION_NOT_FOUND", "Conversación no encontrada", 404);

    const ultimoEntrante = await this.repo.getUltimoMensajeEntrante(tenantId, id);
    if (!ultimoEntrante || Date.now() - ultimoEntrante.getTime() > VENTANA_24H_MS) {
      throw new ApiError(
        "VENTANA_24H_CERRADA",
        "La ventana de 24h de Meta ha cerrado. No se puede enviar mensaje de texto libre.",
        400
      );
    }

    let wa_message_id: string | undefined;
    try {
      const result = await this.metaSender.sendTextMessage(tenantId, {
        wa_cuenta_id: conv.wa_cuenta_id,
        celular_destino: conv.celular,
        texto: body.contenido,
      });
      wa_message_id = result.wa_message_id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar mensaje";
      throw new ApiError("META_SEND_ERROR", msg, 502);
    }

    const mensaje = await this.repo.guardarMensaje(tenantId, {
      conversacion_id: id,
      wa_message_id,
      direccion: "SALIENTE",
      origen: "VENDEDOR",
      tipo: body.tipo ?? "TEXTO",
      contenido: body.contenido,
      ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
    });

    return c.json({ success: true, data: mensaje }, 201);
  };

  cambiarModo = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as CambiarModoInput;
    const conv = await this.repo.cambiarModo(tenantId, id, body.modo);
    if (!conv) throw new ApiError("CONVERSACION_NOT_FOUND", "Conversación no encontrada", 404);
    return c.json({ success: true, data: conv });
  };

  asignarVendedor = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AsignarVendedorConvInput;
    const conv = await this.repo.asignarVendedorConv(tenantId, id, body.vendedor_id);
    if (!conv) throw new ApiError("CONVERSACION_NOT_FOUND", "Conversación no encontrada", 404);
    return c.json({ success: true, data: conv });
  };
}
