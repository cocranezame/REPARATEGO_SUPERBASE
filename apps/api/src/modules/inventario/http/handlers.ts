import type {
  CreateLoteInput,
  CreateMetodoPagoInput,
  CreateMovimientoInput,
  CreateProductoInput,
  CreateTasaPrecioInput,
  IngresoManualInput,
  SyncCategoriasProductoInput,
  SyncCompatibilidadesInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { isDuplicateKeyError } from "../../../lib/db-errors.js";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IMetodoPagoRepository } from "../domain/ports/metodo-pago.repository.js";
import type {
  IProductoRepository,
  ListProductosParams,
} from "../domain/ports/producto.repository.js";
import type { IStockRepository } from "../domain/ports/stock.repository.js";
import type { ITasaPrecioRepository } from "../domain/ports/tasa-precio.repository.js";
import { createMetodoPago } from "../domain/use-cases/create-metodo-pago.js";
import { createProducto } from "../domain/use-cases/create-producto.js";
import { createTasaPrecio } from "../domain/use-cases/create-tasa-precio.js";
import { deleteMetodoPago } from "../domain/use-cases/delete-metodo-pago.js";
import { deleteProducto } from "../domain/use-cases/delete-producto.js";
import { deleteTasaPrecio } from "../domain/use-cases/delete-tasa-precio.js";
import { getProductoById } from "../domain/use-cases/get-producto-by-id.js";
import { listCategoriasProducto } from "../domain/use-cases/list-categorias-producto.js";
import { listCompatibilidades } from "../domain/use-cases/list-compatibilidades.js";
import { listMetodosPago } from "../domain/use-cases/list-metodos-pago.js";
import { listProductos } from "../domain/use-cases/list-productos.js";
import { listTasasPrecio } from "../domain/use-cases/list-tasas-precio.js";
import { syncCategoriasProducto } from "../domain/use-cases/sync-categorias-producto.js";
import { syncCompatibilidades } from "../domain/use-cases/sync-compatibilidades.js";
import type { UpdateMetodoPagoInput } from "../domain/use-cases/update-metodo-pago.js";
import { updateMetodoPago } from "../domain/use-cases/update-metodo-pago.js";
import type { UpdateProductoInput } from "../domain/use-cases/update-producto.js";
import { updateProducto } from "../domain/use-cases/update-producto.js";
import type { UpdateTasaPrecioInput } from "../domain/use-cases/update-tasa-precio.js";
import { updateTasaPrecio } from "../domain/use-cases/update-tasa-precio.js";
import type {
  ListLotesQuery,
  ListMovimientosQuery,
  ListProductosQuery,
  ListSimpleQuery,
  ListStockQuery,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createInventarioHandlers(
  productoRepo: IProductoRepository,
  tasaPrecioRepo: ITasaPrecioRepository,
  metodoPagoRepo: IMetodoPagoRepository,
  stockRepo: IStockRepository
) {
  // ── GRUPO 1: Dashboard ─────────────────────────────────────────────────────

  async function getDashboardHandler(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const data = await stockRepo.getDashboard(tenantId);
    return c.json({ success: true, data });
  }

  // ── GRUPO 2: Alertas stock mínimo ──────────────────────────────────────────

  async function getStockAlertasHandler(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const items = await stockRepo.getStockAlertas(tenantId);
    return c.json({ success: true, data: { productos: items } });
  }

  // ── Productos ──────────────────────────────────────────────────────────────

  async function listProductosHandler(c: HonoCtx) {
    const query = c.req.valid("query") as ListProductosQuery;
    const tenantId = c.get("tenantId");

    const params: ListProductosParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.tipo !== undefined ? { tipo: query.tipo } : {}),
      ...(query.categoria_id !== undefined ? { categoria_id: query.categoria_id } : {}),
      ...(query.componente_id !== undefined ? { componente_id: query.componente_id } : {}),
      ...(query.marca_id !== undefined ? { marca_id: query.marca_id } : {}),
      ...(query.modelo_id !== undefined ? { modelo_id: query.modelo_id } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
      ...(query.con_imagen !== undefined ? { con_imagen: query.con_imagen } : {}),
      ...(query.sin_cotizacion !== undefined ? { sin_cotizacion: query.sin_cotizacion } : {}),
      ...(query.sin_tasa !== undefined ? { sin_tasa: query.sin_tasa } : {}),
    };

    const result = await listProductos(productoRepo, tenantId, params);
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  }

  async function createProductoHandler(c: HonoCtx) {
    const body = c.req.valid("json") as CreateProductoInput;
    const tenantId = c.get("tenantId");
    try {
      const producto = await createProducto(productoRepo, tenantId, body);
      return c.json({ success: true, data: producto }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError("DUPLICATE_PRODUCTO", "Código de producto ya registrado", 409);
      }
      throw err;
    }
  }

  async function getProductoByIdHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const producto = await getProductoById(productoRepo, tenantId, id);
    if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    const compatibilidades = await listCompatibilidades(productoRepo, tenantId, id);
    return c.json({ success: true, data: { ...producto, compatibilidades } });
  }

  async function updateProductoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateProductoInput;
    const tenantId = c.get("tenantId");
    try {
      const producto = await updateProducto(productoRepo, tenantId, id, body);
      if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
      return c.json({ success: true, data: producto });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw err;
    }
  }

  async function deleteProductoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteProducto(productoRepo, tenantId, id);
    if (!deleted) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  // ── Compatibilidades ───────────────────────────────────────────────────────

  async function listCompatibilidadesHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const producto = await getProductoById(productoRepo, tenantId, id);
    if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    const items = await listCompatibilidades(productoRepo, tenantId, id);
    return c.json({ success: true, data: items });
  }

  async function syncCompatibilidadesHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as SyncCompatibilidadesInput;
    const tenantId = c.get("tenantId");
    const producto = await getProductoById(productoRepo, tenantId, id);
    if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    try {
      const items = await syncCompatibilidades(productoRepo, tenantId, id, body);
      return c.json({ success: true, data: items });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError("DUPLICATE_COMPATIBILIDAD", "Modelo ya asociado a este producto", 409);
      }
      throw err;
    }
  }

  // ── Categorías (alcance CATEGORIA) ────────────────────────────────────────

  async function listCategoriasProductoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const producto = await getProductoById(productoRepo, tenantId, id);
    if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    const items = await listCategoriasProducto(productoRepo, tenantId, id);
    return c.json({ success: true, data: items });
  }

  async function syncCategoriasProductoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as SyncCategoriasProductoInput;
    const tenantId = c.get("tenantId");
    const producto = await getProductoById(productoRepo, tenantId, id);
    if (!producto) throw new ApiError("PRODUCTO_NOT_FOUND", "Producto no encontrado", 404);
    const items = await syncCategoriasProducto(productoRepo, tenantId, id, body);
    return c.json({ success: true, data: items });
  }

  // ── GRUPO 3: Tasas de precio (jerarquía) ───────────────────────────────────

  async function listTasasPrecioHandler(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const items = await listTasasPrecio(tasaPrecioRepo, tenantId);
    return c.json({ success: true, data: items });
  }

  async function createTasaPrecioHandler(c: HonoCtx) {
    const body = c.req.valid("json") as CreateTasaPrecioInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    try {
      const tasa = await createTasaPrecio(tasaPrecioRepo, tenantId, userId, body);
      return c.json({ success: true, data: tasa }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_TASA_PRECIO",
          "Ya existe una tasa para este nivel/producto",
          409
        );
      }
      throw err;
    }
  }

  async function updateTasaPrecioHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateTasaPrecioInput;
    const tenantId = c.get("tenantId");
    const tasa = await updateTasaPrecio(tasaPrecioRepo, tenantId, id, body);
    if (!tasa) throw new ApiError("TASA_PRECIO_NOT_FOUND", "Tasa de precio no encontrada", 404);
    return c.json({ success: true, data: tasa });
  }

  async function deleteTasaPrecioHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteTasaPrecio(tasaPrecioRepo, tenantId, id);
    if (!deleted) throw new ApiError("TASA_PRECIO_NOT_FOUND", "Tasa de precio no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  // ── Métodos de pago ────────────────────────────────────────────────────────

  async function listMetodosPagoHandler(c: HonoCtx) {
    const query = c.req.valid("query") as ListSimpleQuery;
    const tenantId = c.get("tenantId");
    const items = await listMetodosPago(metodoPagoRepo, tenantId, query.activo);
    return c.json({ success: true, data: items });
  }

  async function createMetodoPagoHandler(c: HonoCtx) {
    const body = c.req.valid("json") as CreateMetodoPagoInput;
    const tenantId = c.get("tenantId");
    try {
      const metodo = await createMetodoPago(metodoPagoRepo, tenantId, body);
      return c.json({ success: true, data: metodo }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError("DUPLICATE_METODO_PAGO", "Nombre de método de pago ya registrado", 409);
      }
      throw err;
    }
  }

  async function updateMetodoPagoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateMetodoPagoInput;
    const tenantId = c.get("tenantId");
    const metodo = await updateMetodoPago(metodoPagoRepo, tenantId, id, body);
    if (!metodo) throw new ApiError("METODO_PAGO_NOT_FOUND", "Método de pago no encontrado", 404);
    return c.json({ success: true, data: metodo });
  }

  async function deleteMetodoPagoHandler(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteMetodoPago(metodoPagoRepo, tenantId, id);
    if (!deleted) throw new ApiError("METODO_PAGO_NOT_FOUND", "Método de pago no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  // ── Stock ──────────────────────────────────────────────────────────────────

  async function listStockHandler(c: HonoCtx) {
    const query = c.req.valid("query") as ListStockQuery;
    const tenantId = c.get("tenantId");
    const items = await stockRepo.listStock(tenantId, {
      ...(query.producto_id !== undefined ? { producto_id: query.producto_id } : {}),
      ...(query.sucursal_id !== undefined ? { sucursal_id: query.sucursal_id } : {}),
      ...(query.alerta_minimo !== undefined ? { alerta_minimo: query.alerta_minimo } : {}),
    });
    return c.json({ success: true, data: items });
  }

  async function getStockDetalleHandler(c: HonoCtx) {
    const productoId = c.req.param("productoId") as string;
    const tenantId = c.get("tenantId");
    const items = await stockRepo.getStockDetalle(tenantId, productoId);
    return c.json({ success: true, data: items });
  }

  // ── Lotes ──────────────────────────────────────────────────────────────────

  async function listLotesHandler(c: HonoCtx) {
    const query = c.req.valid("query") as ListLotesQuery;
    const tenantId = c.get("tenantId");
    const result = await stockRepo.listLotes(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.producto_id !== undefined ? { producto_id: query.producto_id } : {}),
      ...(query.sucursal_id !== undefined ? { sucursal_id: query.sucursal_id } : {}),
    });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  }

  async function createLoteHandler(c: HonoCtx) {
    const body = c.req.valid("json") as CreateLoteInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    const lote = await stockRepo.createLote(tenantId, {
      producto_id: body.producto_id,
      sucursal_id: body.sucursal_id,
      cantidad: body.cantidad,
      precio_unitario: body.precio_unitario,
      fecha_ingreso: body.fecha_ingreso,
      usuario_id: usuarioId,
      ...(body.orden_compra_id !== undefined ? { orden_compra_id: body.orden_compra_id } : {}),
      ...(body.fecha_vencimiento !== undefined
        ? { fecha_vencimiento: body.fecha_vencimiento }
        : {}),
    });
    return c.json({ success: true, data: lote }, 201);
  }

  // ── GRUPO 6: Ingreso manual ────────────────────────────────────────────────

  async function ingresoManualHandler(c: HonoCtx) {
    const body = c.req.valid("json") as IngresoManualInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    const result = await stockRepo.ingresoManual(tenantId, {
      producto_id: body.producto_id,
      sucursal_id: body.sucursal_id,
      cantidad: body.cantidad,
      precio_unitario: body.precio_unitario,
      usuario_id: usuarioId,
      ...(body.proveedor_id !== undefined ? { proveedor_id: body.proveedor_id } : {}),
      ...(body.cotizacion_id !== undefined ? { cotizacion_id: body.cotizacion_id } : {}),
    });
    return c.json({ success: true, data: result }, 201);
  }

  // ── GRUPO 7: Ingreso automático OC ────────────────────────────────────────

  async function ingresoOCHandler(c: HonoCtx) {
    const ordenCompraId = c.req.param("ordenCompraId") as string;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    try {
      await stockRepo.ingresoOC(tenantId, ordenCompraId, usuarioId);
      return c.json({ success: true, data: null });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("TERMINADA")) throw new ApiError("INVALID_OC_STATE", msg, 422);
      if (msg.includes("no encontrada")) throw new ApiError("OC_NOT_FOUND", msg, 404);
      throw err;
    }
  }

  // ── Movimientos ────────────────────────────────────────────────────────────

  async function listMovimientosHandler(c: HonoCtx) {
    const query = c.req.valid("query") as ListMovimientosQuery;
    const tenantId = c.get("tenantId");
    const result = await stockRepo.listMovimientos(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.producto_id !== undefined ? { producto_id: query.producto_id } : {}),
      ...(query.tipo !== undefined ? { tipo: query.tipo } : {}),
      ...(query.sucursal_id !== undefined ? { sucursal_id: query.sucursal_id } : {}),
      ...(query.desde !== undefined ? { desde: query.desde } : {}),
      ...(query.hasta !== undefined ? { hasta: query.hasta } : {}),
    });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  }

  async function createMovimientoHandler(c: HonoCtx) {
    const body = c.req.valid("json") as CreateMovimientoInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");
    const movimiento = await stockRepo.createMovimiento(tenantId, {
      producto_id: body.producto_id,
      sucursal_id: body.sucursal_id,
      tipo: body.tipo,
      cantidad: body.cantidad,
      usuario_id: usuarioId,
      ...(body.lote_id !== undefined ? { lote_id: body.lote_id } : {}),
      ...(body.referencia_tipo !== undefined ? { referencia_tipo: body.referencia_tipo } : {}),
      ...(body.referencia_id !== undefined ? { referencia_id: body.referencia_id } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });
    return c.json({ success: true, data: movimiento }, 201);
  }

  // ── GRUPO 4: Proveedores sugeridos ─────────────────────────────────────────

  async function getProveedoresSugeridosHandler(c: HonoCtx) {
    const productoId = c.req.param("productoId") as string;
    const tenantId = c.get("tenantId");
    const data = await stockRepo.getProveedoresSugeridos(tenantId, productoId);
    return c.json({ success: true, data });
  }

  return {
    getDashboard: getDashboardHandler,
    getStockAlertas: getStockAlertasHandler,
    listProductos: listProductosHandler,
    createProducto: createProductoHandler,
    getProductoById: getProductoByIdHandler,
    updateProducto: updateProductoHandler,
    deleteProducto: deleteProductoHandler,
    listCompatibilidades: listCompatibilidadesHandler,
    syncCompatibilidades: syncCompatibilidadesHandler,
    listCategoriasProducto: listCategoriasProductoHandler,
    syncCategoriasProducto: syncCategoriasProductoHandler,
    listTasasPrecio: listTasasPrecioHandler,
    createTasaPrecio: createTasaPrecioHandler,
    updateTasaPrecio: updateTasaPrecioHandler,
    deleteTasaPrecio: deleteTasaPrecioHandler,
    listMetodosPago: listMetodosPagoHandler,
    createMetodoPago: createMetodoPagoHandler,
    updateMetodoPago: updateMetodoPagoHandler,
    deleteMetodoPago: deleteMetodoPagoHandler,
    listStock: listStockHandler,
    getStockDetalle: getStockDetalleHandler,
    listLotes: listLotesHandler,
    createLote: createLoteHandler,
    ingresoManual: ingresoManualHandler,
    ingresoOC: ingresoOCHandler,
    listMovimientos: listMovimientosHandler,
    createMovimiento: createMovimientoHandler,
    getProveedoresSugeridos: getProveedoresSugeridosHandler,
  };
}
