import type {
  ActualizarEnvioInput,
  AddVentaPagoInput,
  AnularVentaInput,
  CreateVentaInput,
  ListEnviosCalendarioQuery,
  ListVentasQuery,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IVentaRepository } from "../domain/ports/venta.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createVentaHandlers(repo: IVentaRepository) {
  // ─── Crear venta ────────────────────────────────────────────────────────────

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreateVentaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const cajaId = c.get("cajaId");

    if (!cajaId) throw new ApiError("CAJA_CERRADA", "No hay caja abierta", 403);

    try {
      const venta = await repo.create(tenantId, {
        caja_id: cajaId,
        tipo: body.tipo,
        created_by: userId,
        ...(body.cliente_id !== undefined ? { cliente_id: body.cliente_id } : {}),
        ...(body.orden_servicio_id !== undefined
          ? { orden_servicio_id: body.orden_servicio_id }
          : {}),
        ...(body.visita_domicilio_id !== undefined
          ? { visita_domicilio_id: body.visita_domicilio_id }
          : {}),
        items: body.items.map((it) => ({
          tipo_item: it.tipo_item as "PRODUCTO" | "SERVICIO" | "ENVIO" | "MANUAL",
          ...(it.produto_id !== undefined ? { produto_id: it.produto_id } : {}),
          ...(it.lote_id !== undefined ? { lote_id: it.lote_id } : {}),
          ...(it.sku !== undefined ? { sku: it.sku } : {}),
          ...(it.numero_serie !== undefined ? { numero_serie: it.numero_serie } : {}),
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          ...(it.es_preventivo !== undefined ? { es_preventivo: it.es_preventivo } : {}),
        })),
        ...(body.pagos !== undefined
          ? {
              pagos: body.pagos.map((p) => ({
                metodo_pago_id: p.metodo_pago_id,
                monto: p.monto,
              })),
            }
          : {}),
        ...(body.requiere_envio !== undefined ? { requiere_envio: body.requiere_envio } : {}),
        ...(body.datos_envio !== undefined
          ? {
              datos_envio: {
                ...(body.datos_envio.direccion_id !== undefined
                  ? { direccion_id: body.datos_envio.direccion_id }
                  : {}),
                ...(body.datos_envio.metodo_envio !== undefined
                  ? { metodo_envio: body.datos_envio.metodo_envio }
                  : {}),
                ...(body.datos_envio.fecha_programada !== undefined
                  ? { fecha_programada: body.datos_envio.fecha_programada }
                  : {}),
                ...(body.datos_envio.costo_envio !== undefined
                  ? { costo_envio: body.datos_envio.costo_envio }
                  : {}),
              },
            }
          : {}),
      });
      return c.json({ success: true, data: venta }, 201);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("CREAR_VENTA_ERROR", (err as Error).message, 422);
    }
  }

  // ─── Listar ventas ──────────────────────────────────────────────────────────

  async function list(c: HonoCtx) {
    const q = c.req.valid("query") as ListVentasQuery;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const rol = c.get("rol");

    // V27: vendedor ve solo sus ventas
    const createdByFilter = rol === "VENDEDOR" ? userId : undefined;

    const result = await repo.list(tenantId, {
      page: q.page,
      pageSize: q.pageSize,
      ...(q.tipo !== undefined ? { tipo: q.tipo } : {}),
      ...(q.estado_pago !== undefined ? { estado_pago: q.estado_pago } : {}),
      ...(q.estado_despacho !== undefined ? { estado_despacho: q.estado_despacho } : {}),
      ...(q.caja_id !== undefined ? { caja_id: q.caja_id } : {}),
      ...(q.cliente_id !== undefined ? { cliente_id: q.cliente_id } : {}),
      ...(q.desde !== undefined ? { desde: q.desde } : {}),
      ...(q.hasta !== undefined ? { hasta: q.hasta } : {}),
      ...(createdByFilter !== undefined ? { created_by: createdByFilter } : {}),
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

  // ─── Detalle venta ──────────────────────────────────────────────────────────

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const rol = c.get("rol");

    const venta = await repo.findById(tenantId, id);
    if (!venta) throw new ApiError("VENTA_NOT_FOUND", "Venta no encontrada", 404);

    // V27: vendedor solo puede ver sus propias ventas
    if (rol === "VENDEDOR" && venta.created_by !== userId) {
      throw new ApiError("AUTH_FORBIDDEN", "No tienes acceso a esta venta", 403);
    }

    return c.json({ success: true, data: venta });
  }

  // ─── Registrar pago ─────────────────────────────────────────────────────────

  async function addPago(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AddVentaPagoInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const cajaId = c.get("cajaId");

    if (!cajaId) throw new ApiError("CAJA_CERRADA", "No hay caja abierta", 403);

    try {
      const pago = await repo.addPago(tenantId, id, {
        metodo_pago_id: body.metodo_pago_id,
        monto: body.monto,
        caja_id: cajaId,
        created_by: userId,
      });
      return c.json({ success: true, data: pago }, 201);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("PAGO_ERROR", (err as Error).message, 422);
    }
  }

  // ─── Anular venta ───────────────────────────────────────────────────────────

  async function anular(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AnularVentaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");

    try {
      const venta = await repo.anular(tenantId, id, {
        motivo: body.motivo,
        anulado_por: userId,
      });
      if (!venta) throw new ApiError("VENTA_NOT_FOUND", "Venta no encontrada", 404);
      return c.json({ success: true, data: venta });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("ANULACION_ERROR", (err as Error).message, 422);
    }
  }

  // ─── Envío ──────────────────────────────────────────────────────────────────

  async function actualizarEnvio(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as ActualizarEnvioInput;
    const tenantId = c.get("tenantId");

    try {
      const envio = await repo.actualizarEnvio(tenantId, id, {
        ...(body.direccion_id !== undefined ? { direccion_id: body.direccion_id } : {}),
        ...(body.metodo_envio !== undefined ? { metodo_envio: body.metodo_envio } : {}),
        ...(body.fecha_programada !== undefined ? { fecha_programada: body.fecha_programada } : {}),
        ...(body.costo_envio !== undefined ? { costo_envio: body.costo_envio } : {}),
      });
      return c.json({ success: true, data: envio });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("ENVIO_ERROR", (err as Error).message, 422);
    }
  }

  async function despacharEnvio(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");

    const envio = await repo.despacharEnvio(tenantId, id);
    if (!envio) throw new ApiError("ENVIO_NOT_FOUND", "Envío no encontrado", 404);
    return c.json({ success: true, data: envio });
  }

  async function listVentasEnvios(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const page = Number(c.req.query("page") ?? 1);
    const pageSize = Number(c.req.query("pageSize") ?? 20);

    const result = await repo.listVentasEnvios(tenantId, { page, pageSize });
    const totalPages = Math.ceil(result.total / pageSize);

    return c.json({
      success: true,
      data: result.items,
      meta: { total: result.total, page, pageSize, totalPages },
    });
  }

  async function listEnviosCalendario(c: HonoCtx) {
    const q = c.req.valid("query") as ListEnviosCalendarioQuery;
    const tenantId = c.get("tenantId");

    const envios = await repo.listEnviosCalendario(tenantId, {
      fecha_desde: q.fecha_desde,
      fecha_hasta: q.fecha_hasta,
      ...(q.sucursal_id !== undefined ? { sucursal_id: q.sucursal_id } : {}),
    });
    return c.json({ success: true, data: envios });
  }

  return {
    create,
    list,
    getById,
    addPago,
    anular,
    actualizarEnvio,
    despacharEnvio,
    listVentasEnvios,
    listEnviosCalendario,
  };
}
