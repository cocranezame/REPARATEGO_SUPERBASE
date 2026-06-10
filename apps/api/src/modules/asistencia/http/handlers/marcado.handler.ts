import type {
  ListAsistenciaParamsInput,
  MarcarAsistenciaInput,
  RegistroManualAsistenciaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class MarcadoHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  marcar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    const body = c.req.valid("json") as MarcarAsistenciaInput;

    const userAgent = c.req.header("User-Agent") ?? "unknown";
    const ip =
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      c.req.header("CF-Connecting-IP") ??
      "unknown";

    const result = await this.repo.marcar(tenantId, usuarioId, {
      ssid: body.ssid,
      bssid: body.bssid,
      latitud: body.latitud,
      longitud: body.longitud,
      tipo_evento: body.tipo_evento,
      dispositivo_info: { userAgent, ip },
    });

    return c.json({ success: true, data: result }, result.aprobado ? 200 : 200);
  };

  miHistorial = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    const query = c.req.valid("query") as ListAsistenciaParamsInput;
    const mes = query.mes ?? new Date().toISOString().slice(0, 7);
    const historial = await this.repo.getHistorial(tenantId, usuarioId, mes);
    return c.json({ success: true, data: historial });
  };

  registroManual = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const body = c.req.valid("json") as RegistroManualAsistenciaInput;
    const evento = await this.repo.registroManual(tenantId, adminId, {
      usuario_id: body.usuario_id,
      tipo_evento: body.tipo_evento,
      fecha_hora: body.fecha_hora,
      observacion: body.observacion,
    });
    return c.json({ success: true, data: evento }, 201);
  };

  panelHoy = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const panel = await this.repo.getPanelHoy(tenantId);
    return c.json({ success: true, data: panel });
  };
}
