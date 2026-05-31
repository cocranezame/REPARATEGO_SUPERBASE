import type { BuscarPresupuestoQuery, RegistrarCotizacionInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class CotizacionHandler {
  constructor(private readonly repo: IServicioRepository) {}

  buscarPresupuesto = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as BuscarPresupuestoQuery;
    const result = await this.repo.buscarPresupuesto(tenantId, {
      ...(query.tipo !== undefined ? { tipo: query.tipo } : {}),
      ...(query.categoria_id !== undefined ? { categoria_id: query.categoria_id } : {}),
      ...(query.marca_id !== undefined ? { marca_id: query.marca_id } : {}),
      ...(query.modelo_id !== undefined ? { modelo_id: query.modelo_id } : {}),
      ...(query.componente_id !== undefined ? { componente_id: query.componente_id } : {}),
      ...(query.busqueda !== undefined ? { busqueda: query.busqueda } : {}),
      ...(query.nivel !== undefined ? { nivel: query.nivel } : {}),
      page: query.page,
      pageSize: query.pageSize,
    });
    return c.json({ success: true, data: result });
  };

  registrar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const body = c.req.valid("json") as RegistrarCotizacionInput;

    try {
      const cotizacion = await this.repo.registrarCotizacion(tenantId, ordenId, {
        items: body.items.map((it) => ({
          tipo_item: it.tipo_item,
          ...(it.producto_id !== undefined ? { producto_id: it.producto_id } : {}),
          ...(it.componente_id !== undefined ? { componente_id: it.componente_id } : {}),
          ...(it.descripcion_manual !== undefined
            ? { descripcion_manual: it.descripcion_manual }
            : {}),
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          es_preventivo: it.es_preventivo,
        })),
        ...(body.observacion !== undefined ? { observacion: body.observacion } : {}),
      });
      return c.json({ success: true, data: cotizacion }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al registrar cotización";
      throw new ApiError("COTIZACION_ERROR", msg, 400);
    }
  };

  get = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const cotizacion = await this.repo.getOrdenCotizacion(tenantId, ordenId);
    return c.json({ success: true, data: cotizacion });
  };
}
