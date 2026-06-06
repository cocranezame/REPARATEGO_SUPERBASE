import type {
  CreatePuntoControlWifiInput,
  UpdatePuntoControlWifiInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class PuntosControlHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const puntos = await this.repo.listPuntosControl(tenantId);
    return c.json({ success: true, data: puntos });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreatePuntoControlWifiInput;
    const punto = await this.repo.createPuntoControl(tenantId, {
      sucursal_id: body.sucursal_id,
      nombre: body.nombre,
      ssid: body.ssid,
      bssid: body.bssid,
      latitud: body.latitud,
      longitud: body.longitud,
      radio_metros: body.radio_metros,
      activo: body.activo,
    });
    return c.json({ success: true, data: punto }, 201);
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const punto = await this.repo.findPuntoControlById(tenantId, id);
    if (!punto)
      throw new ApiError("PUNTO_CONTROL_NOT_FOUND", "Punto de control no encontrado", 404);
    return c.json({ success: true, data: punto });
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdatePuntoControlWifiInput;
    const punto = await this.repo.updatePuntoControl(tenantId, id, {
      sucursal_id: body.sucursal_id,
      nombre: body.nombre,
      ssid: body.ssid,
      bssid: body.bssid,
      latitud: body.latitud,
      longitud: body.longitud,
      radio_metros: body.radio_metros,
      activo: body.activo,
    });
    if (!punto)
      throw new ApiError("PUNTO_CONTROL_NOT_FOUND", "Punto de control no encontrado", 404);
    return c.json({ success: true, data: punto });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deletePuntoControl(tenantId, id);
    if (!ok) throw new ApiError("PUNTO_CONTROL_NOT_FOUND", "Punto de control no encontrado", 404);
    return c.json({ success: true, data: null });
  };
}
