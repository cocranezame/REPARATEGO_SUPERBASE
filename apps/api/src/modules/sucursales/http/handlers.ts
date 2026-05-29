import type { CreateSucursalInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type {
  ISucursalRepository,
  ListSucursalesParams,
} from "../domain/ports/sucursal.repository.js";
import { createSucursal } from "../domain/use-cases/create-sucursal.js";
import { deleteSucursal } from "../domain/use-cases/delete-sucursal.js";
import { getSucursalById } from "../domain/use-cases/get-sucursal-by-id.js";
import { listSucursales } from "../domain/use-cases/list-sucursales.js";
import type { UpdateSucursalInput } from "../domain/use-cases/update-sucursal.js";
import { updateSucursal } from "../domain/use-cases/update-sucursal.js";
import type { ListSucursalesQuery, UpdateSucursalHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createSucursalHandlers(repo: ISucursalRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListSucursalesQuery;
    const tenantId = c.get("tenantId");

    const params: ListSucursalesParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listSucursales(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateSucursalInput;
    const tenantId = c.get("tenantId");
    const sucursal = await createSucursal(repo, tenantId, body);
    return c.json({ success: true, data: sucursal }, 201);
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const sucursal = await getSucursalById(repo, tenantId, id);
    if (!sucursal) throw new ApiError("SUCURSAL_NOT_FOUND", "Sucursal no encontrada", 404);
    return c.json({ success: true, data: sucursal });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateSucursalHttpInput;
    const tenantId = c.get("tenantId");

    const input: UpdateSucursalInput = {
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
      ...(body.direccion !== undefined ? { direccion: body.direccion } : {}),
      ...(body.distrito !== undefined ? { distrito: body.distrito } : {}),
      ...(body.telefono !== undefined ? { telefono: body.telefono } : {}),
      ...(body.es_principal !== undefined ? { es_principal: body.es_principal } : {}),
    };

    const sucursal = await updateSucursal(repo, tenantId, id, input);
    if (!sucursal) throw new ApiError("SUCURSAL_NOT_FOUND", "Sucursal no encontrada", 404);
    return c.json({ success: true, data: sucursal });
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteSucursal(repo, tenantId, id);
    if (!deleted) throw new ApiError("SUCURSAL_NOT_FOUND", "Sucursal no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
