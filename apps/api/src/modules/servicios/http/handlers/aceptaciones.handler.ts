import type { AceptacionManualInput, AceptacionPortalInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

function isManual(
  body: AceptacionManualInput | AceptacionPortalInput
): body is AceptacionManualInput {
  return "canal_aceptacion" in body;
}

export class AceptacionesHandler {
  constructor(private readonly repo: IServicioRepository) {}

  registrar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as AceptacionManualInput | AceptacionPortalInput;

    try {
      const result = await this.repo.registrarAceptacion(tenantId, ordenId, {
        tipo: body.tipo,
        canal_aceptacion: isManual(body) ? body.canal_aceptacion : "PORTAL",
        ...(isManual(body) && body.evidence_image_url !== undefined
          ? { evidence_image_url: body.evidence_image_url }
          : {}),
        ...(!isManual(body) && body.metodo_aceptacion !== undefined
          ? { metodo_aceptacion: body.metodo_aceptacion }
          : {}),
        ...(body.preventivo_accepted !== undefined
          ? { preventivo_accepted: body.preventivo_accepted }
          : {}),
        ...(isManual(body) && body.password !== undefined ? { password: body.password } : {}),
        ...(!isManual(body) && body.ip_address !== undefined
          ? { ip_address: body.ip_address }
          : {}),
        ...(!isManual(body) && body.documento_version !== undefined
          ? { documento_version: body.documento_version }
          : {}),
        ...(!isManual(body) && body.texto_mostrado !== undefined
          ? { texto_mostrado: body.texto_mostrado }
          : {}),
        ...(isManual(body) && body.manual_reason !== undefined
          ? { manual_reason: body.manual_reason }
          : {}),
        userId,
      });
      return c.json({ success: true, data: result }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al registrar aceptación";
      throw new ApiError("ACEPTACION_ERROR", msg, 400);
    }
  };
}
