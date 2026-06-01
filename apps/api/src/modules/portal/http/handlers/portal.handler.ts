import type {
  PortalAceptarPresupuestoInput,
  PortalAceptarValidacionInput,
  PortalLoginInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { signPortalToken } from "../../../../lib/portal-jwt.js";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { PortalVariables } from "../../../../middlewares/portal-auth.js";
import type { IPortalRepository } from "../../domain/ports/portal.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: PortalVariables }, string, any>;
// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoPublicCtx = Context<{ Variables: Record<string, unknown> }, string, any>;

export class PortalHandler {
  constructor(private readonly repo: IPortalRepository) {}

  login = async (c: HonoPublicCtx) => {
    const body = c.req.valid("json") as PortalLoginInput;
    const tenantId = c.req.header("X-Tenant-Id");

    if (!tenantId) {
      throw new ApiError("MISSING_TENANT", "Header X-Tenant-Id requerido", 400);
    }

    const cliente = await this.repo.loginByDocCelular(tenantId, body.numero_doc, body.celular);

    if (!cliente) {
      throw new ApiError("PORTAL_AUTH_FAILED", "Número de documento o celular incorrectos", 401);
    }

    const token = signPortalToken(cliente.id, tenantId);

    return c.json({
      success: true,
      data: { token, cliente_id: cliente.id, cliente_nombre: cliente.nombre },
    });
  };

  misEquipos = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const clienteId = c.get("portalClienteId");

    const instancias = await this.repo.listInstancias(tenantId, clienteId);
    return c.json({ success: true, data: instancias });
  };

  getServicio = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const clienteId = c.get("portalClienteId");
    const ordenId = c.req.param("id") as string;

    const servicio = await this.repo.getServicio(tenantId, ordenId, clienteId);
    if (!servicio) throw new ApiError("NOT_FOUND", "Servicio no encontrado", 404);

    return c.json({ success: true, data: servicio });
  };

  aceptarValidacion = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const clienteId = c.get("portalClienteId");
    const ordenId = c.req.param("id") as string;
    const body = c.req.valid("json") as PortalAceptarValidacionInput;

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      undefined;

    try {
      const result = await this.repo.aceptarValidacion(tenantId, ordenId, clienteId, {
        documento_version: body.documento_version,
        texto_mostrado: body.texto_mostrado,
        ...(ip !== undefined ? { ip_address: ip } : {}),
      });
      return c.json({ success: true, data: result });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al aceptar validación";
      throw new ApiError("ACEPTACION_ERROR", msg, 400);
    }
  };

  aceptarPresupuesto = async (c: HonoCtx) => {
    const tenantId = c.get("portalTenantId");
    const clienteId = c.get("portalClienteId");
    const ordenId = c.req.param("id") as string;
    const body = c.req.valid("json") as PortalAceptarPresupuestoInput;

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      undefined;

    try {
      const result = await this.repo.aceptarPresupuesto(tenantId, ordenId, clienteId, {
        preventivo_accepted: body.preventivo_accepted,
        documento_version: body.documento_version,
        texto_mostrado: body.texto_mostrado,
        ...(ip !== undefined ? { ip_address: ip } : {}),
      });
      return c.json({ success: true, data: result });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al aceptar presupuesto";
      throw new ApiError("ACEPTACION_ERROR", msg, 400);
    }
  };
}
