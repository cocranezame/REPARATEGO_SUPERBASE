import type {
  CreatePlantillaInput,
  EnviarPlantillaInput,
  UpdatePlantillaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../../infra/services/meta-sender.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class PlantillasHandler {
  constructor(
    private readonly repo: ICrmRepository,
    private readonly metaSender: MetaSenderService
  ) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const items = await this.repo.listPlantillas(tenantId);
    return c.json({ success: true, data: items });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreatePlantillaInput;
    const plantilla = await this.repo.createPlantilla(
      tenantId,
      {
        nombre: body.nombre,
        contenido: body.contenido,
        ...(body.variables !== undefined ? { variables: body.variables } : {}),
        ...(body.meta_template_name !== undefined
          ? { meta_template_name: body.meta_template_name }
          : {}),
      },
      userId
    );
    return c.json({ success: true, data: plantilla }, 201);
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdatePlantillaInput;
    const plantilla = await this.repo.updatePlantilla(tenantId, id, body);
    if (!plantilla) throw new ApiError("PLANTILLA_NOT_FOUND", "Plantilla no encontrada", 404);
    return c.json({ success: true, data: plantilla });
  };

  enviar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as EnviarPlantillaInput;

    const plantilla = await this.repo.findPlantillaById(tenantId, id);
    if (!plantilla) throw new ApiError("PLANTILLA_NOT_FOUND", "Plantilla no encontrada", 404);

    // N5: solo plantillas APROBADAS
    if (plantilla.estado_meta !== "APROBADA") {
      throw new ApiError(
        "PLANTILLA_NO_APROBADA",
        "Solo se pueden enviar plantillas con estado_meta=APROBADA",
        422
      );
    }

    if (!plantilla.meta_template_name) {
      throw new ApiError(
        "PLANTILLA_SIN_NOMBRE_META",
        "La plantilla no tiene meta_template_name configurado",
        422
      );
    }

    const conv = await this.repo.findConversacionById(tenantId, body.conversacion_id);
    if (!conv) throw new ApiError("CONVERSACION_NOT_FOUND", "Conversación no encontrada", 404);

    // Ordenar variables según el orden definido en plantilla.variables
    const varNames = plantilla.variables ?? [];
    const variables = varNames.map((v) => body.variables_valores[v] ?? "");

    let wa_message_id: string | undefined;
    try {
      const result = await this.metaSender.sendTemplateMessage(tenantId, {
        wa_cuenta_id: conv.wa_cuenta_id,
        celular_destino: conv.celular,
        template_name: plantilla.meta_template_name,
        variables,
      });
      wa_message_id = result.wa_message_id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar plantilla";
      throw new ApiError("META_SEND_ERROR", msg, 502);
    }

    const mensaje = await this.repo.guardarMensaje(tenantId, {
      conversacion_id: body.conversacion_id,
      wa_message_id,
      direccion: "SALIENTE",
      origen: "VENDEDOR",
      tipo: "PLANTILLA",
      contenido: plantilla.contenido,
      metadata: {
        plantilla_id: id,
        meta_template_name: plantilla.meta_template_name,
        variables_valores: body.variables_valores,
      },
    });

    return c.json({ success: true, data: mensaje }, 201);
  };
}
