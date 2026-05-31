import type {
  AddVentaPagoInput,
  AnularVentaInput,
  CreateVentaEnvioInput,
  CreateVentaInput,
  UpdateEnvioEstadoInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IVentaRepository } from "../domain/ports/venta.repository.js";
import type { ListEnviosQuery, ListVentasQueryLocal } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createVentaHandlers(repo: IVentaRepository) {
  async function list(c: HonoCtx) {
    const q = c.req.valid("query") as ListVentasQueryLocal;
    const tenantId = c.get("tenantId");
    const result = await repo.list(tenantId, {
      page: q.page,
      pageSize: q.pageSize,
      ...(q.tipo_venta !== undefined ? { tipo_venta: q.tipo_venta } : {}),
      ...(q.estado !== undefined ? { estado: q.estado } : {}),
      ...(q.caja_id !== undefined ? { caja_id: q.caja_id } : {}),
      ...(q.cliente_id !== undefined ? { cliente_id: q.cliente_id } : {}),
      ...(q.desde !== undefined ? { desde: q.desde } : {}),
      ...(q.hasta !== undefined ? { hasta: q.hasta } : {}),
      ...(q.search !== undefined ? { search: q.search } : {}),
    });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: q.page,
        pageSize: q.pageSize,
        totalPages: Math.ceil(result.total / q.pageSize),
      },
    });
  }

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreateVentaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const venta = await repo.create(tenantId, {
      caja_id: body.caja_id,
      sucursal_id: body.caja_id,
      usuario_id: userId,
      ...(body.cliente_id !== undefined ? { cliente_id: body.cliente_id } : {}),
      ...(body.tipo_venta !== undefined ? { tipo_venta: body.tipo_venta } : {}),
      ...(body.orden_servicio_id !== undefined
        ? { orden_servicio_id: body.orden_servicio_id }
        : {}),
      ...(body.visita_domicilio_id !== undefined
        ? { visita_domicilio_id: body.visita_domicilio_id }
        : {}),
      items: body.items.map((it) => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        ...(it.producto_id !== undefined ? { producto_id: it.producto_id } : {}),
        ...(it.descuento !== undefined ? { descuento: it.descuento } : {}),
      })),
      ...(body.tipo_comprobante !== undefined ? { tipo_comprobante: body.tipo_comprobante } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });
    return c.json({ success: true, data: venta }, 201);
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const venta = await repo.findById(tenantId, id);
    if (!venta) throw new ApiError("VENTA_NOT_FOUND", "Venta no encontrada", 404);
    return c.json({ success: true, data: venta });
  }

  async function anular(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AnularVentaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    try {
      const venta = await repo.anular(tenantId, id, body.motivo, userId);
      if (!venta) throw new ApiError("VENTA_NOT_FOUND", "Venta no encontrada", 404);
      return c.json({ success: true, data: venta });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("ANULACION_ERROR", (err as Error).message, 422);
    }
  }

  async function listPagos(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const pagos = await repo.listPagos(tenantId, id);
    return c.json({ success: true, data: pagos });
  }

  async function addPago(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AddVentaPagoInput;
    const tenantId = c.get("tenantId");
    try {
      const pago = await repo.addPago(tenantId, id, {
        metodo_pago_id: body.metodo_pago_id,
        monto: body.monto,
        ...(body.referencia !== undefined ? { referencia: body.referencia } : {}),
      });
      return c.json({ success: true, data: pago }, 201);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("PAGO_ERROR", (err as Error).message, 422);
    }
  }

  async function getEnvio(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const envio = await repo.getEnvio(tenantId, id);
    return c.json({ success: true, data: envio });
  }

  async function createEnvio(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateVentaEnvioInput;
    const tenantId = c.get("tenantId");
    const envio = await repo.createEnvio(tenantId, id, {
      direccion_texto: body.direccion_texto,
      ...(body.direccion_id !== undefined ? { direccion_id: body.direccion_id } : {}),
      ...(body.costo_envio !== undefined ? { costo_envio: body.costo_envio } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });
    return c.json({ success: true, data: envio }, 201);
  }

  async function updateEnvioEstado(c: HonoCtx) {
    const ventaId = c.req.param("ventaId") as string;
    const body = c.req.valid("json") as UpdateEnvioEstadoInput;
    const tenantId = c.get("tenantId");
    const envio = await repo.updateEnvioEstado(tenantId, ventaId, body.estado);
    if (!envio) throw new ApiError("ENVIO_NOT_FOUND", "Envío no encontrado", 404);
    return c.json({ success: true, data: envio });
  }

  async function listEnvios(c: HonoCtx) {
    const q = c.req.valid("query") as ListEnviosQuery;
    const tenantId = c.get("tenantId");
    const result = await repo.listEnvios(tenantId, { page: q.page, pageSize: q.pageSize });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: q.page,
        pageSize: q.pageSize,
        totalPages: Math.ceil(result.total / q.pageSize),
      },
    });
  }

  return {
    list,
    create,
    getById,
    anular,
    listPagos,
    addPago,
    getEnvio,
    createEnvio,
    updateEnvioEstado,
    listEnvios,
  };
}
