import type {
  CreateTrabajadorConfigInput,
  UpdateTrabajadorConfigInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class TrabajadoresHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const trabajadores = await this.repo.listTrabajadores(tenantId);
    return c.json({ success: true, data: trabajadores });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateTrabajadorConfigInput;
    const trabajador = await this.repo.createTrabajador(tenantId, {
      usuario_id: body.usuario_id,
      turno_id: body.turno_id,
      sucursal_id: body.sucursal_id,
      tipo_contrato: body.tipo_contrato,
      sueldo_base: body.sueldo_base,
      modalidad_pago: body.modalidad_pago,
      fecha_ingreso: body.fecha_ingreso,
      fecha_cese: body.fecha_cese,
      factor_hora_extra: body.factor_hora_extra,
      descuento_x_tardanza: body.descuento_x_tardanza,
      monto_descuento_min: body.monto_descuento_min,
      activo: body.activo,
    });
    return c.json({ success: true, data: trabajador }, 201);
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const trabajador = await this.repo.findTrabajadorById(tenantId, id);
    if (!trabajador) throw new ApiError("TRABAJADOR_NOT_FOUND", "Trabajador no encontrado", 404);
    return c.json({ success: true, data: trabajador });
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateTrabajadorConfigInput;
    const trabajador = await this.repo.updateTrabajador(tenantId, id, {
      turno_id: body.turno_id,
      sucursal_id: body.sucursal_id,
      tipo_contrato: body.tipo_contrato,
      sueldo_base: body.sueldo_base,
      modalidad_pago: body.modalidad_pago,
      fecha_ingreso: body.fecha_ingreso,
      fecha_cese: body.fecha_cese,
      factor_hora_extra: body.factor_hora_extra,
      descuento_x_tardanza: body.descuento_x_tardanza,
      monto_descuento_min: body.monto_descuento_min,
      activo: body.activo,
    });
    if (!trabajador) throw new ApiError("TRABAJADOR_NOT_FOUND", "Trabajador no encontrado", 404);
    return c.json({ success: true, data: trabajador });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deleteTrabajador(tenantId, id);
    if (!ok) throw new ApiError("TRABAJADOR_NOT_FOUND", "Trabajador no encontrado", 404);
    return c.json({ success: true, data: null });
  };
}
