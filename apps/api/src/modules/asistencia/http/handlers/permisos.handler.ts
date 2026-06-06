import type {
  CreatePermisoAsistenciaInput,
  ListPermisosQueryInput,
  RechazarPermisoInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class PermisosHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListPermisosQueryInput;
    const result = await this.repo.listPermisos(tenantId, {
      usuario_id: query.usuario_id,
      estado: query.estado,
      tipo_permiso: query.tipo_permiso,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
      page: query.page,
      limit: query.limit,
    });
    return c.json({ success: true, data: result });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreatePermisoAsistenciaInput;
    const permiso = await this.repo.createPermiso(tenantId, {
      usuario_id: body.usuario_id,
      fecha_inicio: body.fecha_inicio,
      fecha_fin: body.fecha_fin,
      tipo_permiso: body.tipo_permiso,
      motivo: body.motivo,
      archivo_url: body.archivo_url,
      afecta_pago: body.afecta_pago,
    });
    return c.json({ success: true, data: permiso }, 201);
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const permiso = await this.repo.findPermisoById(tenantId, id);
    if (!permiso) throw new ApiError("PERMISO_NOT_FOUND", "Permiso no encontrado", 404);
    return c.json({ success: true, data: permiso });
  };

  aprobar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const id = c.req.param("id") as string;
    const permiso = await this.repo.aprobarPermiso(tenantId, adminId, id);
    if (!permiso) throw new ApiError("PERMISO_NOT_FOUND", "Permiso no encontrado", 404);
    return c.json({ success: true, data: permiso });
  };

  rechazar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as RechazarPermisoInput;
    const permiso = await this.repo.rechazarPermiso(tenantId, adminId, id, body.motivo_rechazo);
    if (!permiso) throw new ApiError("PERMISO_NOT_FOUND", "Permiso no encontrado", 404);
    return c.json({ success: true, data: permiso });
  };
}
