import type {
  PortalTrabajadorHistorialQueryInput,
  PortalTrabajadorLoginInput,
  PortalTrabajadorPlanillaQueryInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { PortalTrabajadorVariables } from "../../../../middlewares/portal-trabajador-auth.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic — C008
type HonoCtx = Context<{ Variables: PortalTrabajadorVariables }, string, any>;

export class PortalTrabajadorHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  login = async (c: HonoCtx) => {
    const tenantId = c.req.header("X-Tenant-Id");
    if (!tenantId) {
      throw new ApiError("MISSING_TENANT", "Header X-Tenant-Id requerido", 400);
    }
    const body = c.req.valid("json") as PortalTrabajadorLoginInput;
    const result = await this.repo.loginTrabajador(tenantId, body.numero_doc, body.password);
    return c.json({ success: true, data: result });
  };

  estado = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const usuarioId = c.get("portalUsuarioId");
    const estado = await this.repo.getPortalEstado(tenantId, usuarioId);
    return c.json({ success: true, data: estado });
  };

  historial = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const usuarioId = c.get("portalUsuarioId");
    const query = c.req.valid("query") as PortalTrabajadorHistorialQueryInput;
    const historial = await this.repo.getPortalHistorial(tenantId, usuarioId, query.mes);
    return c.json({ success: true, data: historial });
  };

  planilla = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const usuarioId = c.get("portalUsuarioId");
    const query = c.req.valid("query") as PortalTrabajadorPlanillaQueryInput;
    const planilla = await this.repo.getPortalPlanilla(tenantId, usuarioId, query.periodo);
    return c.json({ success: true, data: planilla });
  };
}
