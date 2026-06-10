import type { Context } from "hono";
import { isDuplicateKeyError } from "../../../lib/db-errors.js";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type {
  IProveedorRepository,
  ListProveedoresParams,
} from "../domain/ports/proveedor.repository.js";
import { createCondicionPago } from "../domain/use-cases/create-condicion-pago.js";
import { createProveedor } from "../domain/use-cases/create-proveedor.js";
import { createProveedorContacto } from "../domain/use-cases/create-proveedor-contacto.js";
import { createProveedorLinea } from "../domain/use-cases/create-proveedor-linea.js";
import { createProveedorMetodoPago } from "../domain/use-cases/create-proveedor-metodo-pago.js";
import { deleteCondicionPago } from "../domain/use-cases/delete-condicion-pago.js";
import { deleteProveedor } from "../domain/use-cases/delete-proveedor.js";
import { deleteProveedorContacto } from "../domain/use-cases/delete-proveedor-contacto.js";
import { deleteProveedorLinea } from "../domain/use-cases/delete-proveedor-linea.js";
import { deleteProveedorMetodoPago } from "../domain/use-cases/delete-proveedor-metodo-pago.js";
import { getProveedorById } from "../domain/use-cases/get-proveedor-by-id.js";
import { listCondicionesPago } from "../domain/use-cases/list-condiciones-pago.js";
import { listProveedorContactos } from "../domain/use-cases/list-proveedor-contactos.js";
import { listProveedorLineas } from "../domain/use-cases/list-proveedor-lineas.js";
import { listProveedorMetodosPago } from "../domain/use-cases/list-proveedor-metodos-pago.js";
import { listProveedores } from "../domain/use-cases/list-proveedores.js";
import type { UpdateCondicionPagoInput } from "../domain/use-cases/update-condicion-pago.js";
import { updateCondicionPago } from "../domain/use-cases/update-condicion-pago.js";
import type { UpdateProveedorInput } from "../domain/use-cases/update-proveedor.js";
import { updateProveedor } from "../domain/use-cases/update-proveedor.js";
import type { UpdateProveedorContactoInput } from "../domain/use-cases/update-proveedor-contacto.js";
import { updateProveedorContacto } from "../domain/use-cases/update-proveedor-contacto.js";
import type { UpdateProveedorMetodoPagoInput } from "../domain/use-cases/update-proveedor-metodo-pago.js";
import { updateProveedorMetodoPago } from "../domain/use-cases/update-proveedor-metodo-pago.js";
import type {
  CreateCondicionPagoHttpInput,
  CreateProveedorContactoHttpInput,
  CreateProveedorHttpInput,
  CreateProveedorLineaHttpInput,
  CreateProveedorMetodoPagoHttpInput,
  ListProveedoresQuery,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createProveedorHandlers(repo: IProveedorRepository) {
  // ─── Condición de pago ────────────────────────────────────────────────────

  async function listCondiciones(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const items = await listCondicionesPago(repo, tenantId);
    return c.json({ success: true, data: items });
  }

  async function createCondicion(c: HonoCtx) {
    const body = c.req.valid("json") as CreateCondicionPagoHttpInput;
    const tenantId = c.get("tenantId");
    try {
      const condicion = await createCondicionPago(repo, tenantId, body);
      return c.json({ success: true, data: condicion }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_CONDICION_PAGO",
          "Ya existe una condición con ese nombre",
          409
        );
      }
      throw err;
    }
  }

  async function updateCondicion(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateCondicionPagoInput;
    const tenantId = c.get("tenantId");
    const condicion = await updateCondicionPago(repo, tenantId, id, body);
    if (!condicion)
      throw new ApiError("CONDICION_PAGO_NOT_FOUND", "Condición de pago no encontrada", 404);
    return c.json({ success: true, data: condicion });
  }

  async function removeCondicion(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteCondicionPago(repo, tenantId, id);
    if (!deleted)
      throw new ApiError("CONDICION_PAGO_NOT_FOUND", "Condición de pago no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  // ─── Proveedor ────────────────────────────────────────────────────────────

  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListProveedoresQuery;
    const tenantId = c.get("tenantId");

    const params: ListProveedoresParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listProveedores(repo, tenantId, params);
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

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreateProveedorHttpInput;
    const tenantId = c.get("tenantId");
    try {
      const proveedor = await createProveedor(repo, tenantId, body);
      return c.json({ success: true, data: proveedor }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError("DUPLICATE_PROVEEDOR", "RUC ya registrado para este tenant", 409);
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const proveedor = await getProveedorById(repo, tenantId, id);
    if (!proveedor) throw new ApiError("PROVEEDOR_NOT_FOUND", "Proveedor no encontrado", 404);
    return c.json({ success: true, data: proveedor });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateProveedorInput;
    const tenantId = c.get("tenantId");
    try {
      const proveedor = await updateProveedor(repo, tenantId, id, body);
      if (!proveedor) throw new ApiError("PROVEEDOR_NOT_FOUND", "Proveedor no encontrado", 404);
      return c.json({ success: true, data: proveedor });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError("DUPLICATE_PROVEEDOR", "RUC ya registrado para este tenant", 409);
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteProveedor(repo, tenantId, id);
    if (!deleted) throw new ApiError("PROVEEDOR_NOT_FOUND", "Proveedor no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  // ─── Contactos ────────────────────────────────────────────────────────────

  async function listContactos(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await listProveedorContactos(repo, tenantId, proveedorId);
    return c.json({ success: true, data: items });
  }

  async function createContacto(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateProveedorContactoHttpInput;
    const tenantId = c.get("tenantId");
    const contacto = await createProveedorContacto(repo, tenantId, proveedorId, body);
    return c.json({ success: true, data: contacto }, 201);
  }

  async function updateContacto(c: HonoCtx) {
    const proveedorId = c.req.param("provId") as string;
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateProveedorContactoInput;
    const tenantId = c.get("tenantId");
    const contacto = await updateProveedorContacto(repo, tenantId, id, proveedorId, body);
    if (!contacto) throw new ApiError("CONTACTO_NOT_FOUND", "Contacto no encontrado", 404);
    return c.json({ success: true, data: contacto });
  }

  async function removeContacto(c: HonoCtx) {
    const proveedorId = c.req.param("provId") as string;
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteProveedorContacto(repo, tenantId, id, proveedorId);
    if (!deleted) throw new ApiError("CONTACTO_NOT_FOUND", "Contacto no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  // ─── Métodos de pago ──────────────────────────────────────────────────────

  async function listMetodosPago(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await listProveedorMetodosPago(repo, tenantId, proveedorId);
    return c.json({ success: true, data: items });
  }

  async function createMetodoPago(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateProveedorMetodoPagoHttpInput;
    const tenantId = c.get("tenantId");
    const metodo = await createProveedorMetodoPago(repo, tenantId, proveedorId, body);
    return c.json({ success: true, data: metodo }, 201);
  }

  async function updateMetodoPago(c: HonoCtx) {
    const proveedorId = c.req.param("provId") as string;
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateProveedorMetodoPagoInput;
    const tenantId = c.get("tenantId");
    const metodo = await updateProveedorMetodoPago(repo, tenantId, id, proveedorId, body);
    if (!metodo) throw new ApiError("METODO_PAGO_NOT_FOUND", "Método de pago no encontrado", 404);
    return c.json({ success: true, data: metodo });
  }

  async function removeMetodoPago(c: HonoCtx) {
    const proveedorId = c.req.param("provId") as string;
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteProveedorMetodoPago(repo, tenantId, id, proveedorId);
    if (!deleted) throw new ApiError("METODO_PAGO_NOT_FOUND", "Método de pago no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  // ─── Líneas ───────────────────────────────────────────────────────────────

  async function listLineas(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await listProveedorLineas(repo, tenantId, proveedorId);
    return c.json({ success: true, data: items });
  }

  async function createLinea(c: HonoCtx) {
    const proveedorId = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateProveedorLineaHttpInput;
    const tenantId = c.get("tenantId");
    const linea = await createProveedorLinea(repo, tenantId, proveedorId, body);
    return c.json({ success: true, data: linea }, 201);
  }

  async function removeLinea(c: HonoCtx) {
    const proveedorId = c.req.param("provId") as string;
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteProveedorLinea(repo, tenantId, id, proveedorId);
    if (!deleted) throw new ApiError("LINEA_NOT_FOUND", "Línea de proveedor no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return {
    listCondiciones,
    createCondicion,
    updateCondicion,
    removeCondicion,
    list,
    create,
    getById,
    update,
    remove,
    listContactos,
    createContacto,
    updateContacto,
    removeContacto,
    listMetodosPago,
    createMetodoPago,
    updateMetodoPago,
    removeMetodoPago,
    listLineas,
    createLinea,
    removeLinea,
  };
}
