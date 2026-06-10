import type { CreateUsuarioInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { isDuplicateKeyError } from "../../../lib/db-errors.js";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IUsuarioRepository, ListUsuariosParams } from "../domain/ports/usuario.repository.js";
import { createUsuario } from "../domain/use-cases/create-usuario.js";
import { deleteUsuario } from "../domain/use-cases/delete-usuario.js";
import { getUsuarioById } from "../domain/use-cases/get-usuario-by-id.js";
import { listUsuarios } from "../domain/use-cases/list-usuarios.js";
import type { UpdateUsuarioInput } from "../domain/use-cases/update-usuario.js";
import { updateUsuario } from "../domain/use-cases/update-usuario.js";
import type { ListUsuariosQuery, UpdateUsuarioHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createUsuarioHandlers(repo: IUsuarioRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListUsuariosQuery;
    const tenantId = c.get("tenantId");

    const params: ListUsuariosParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.rol !== undefined ? { rol: query.rol } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listUsuarios(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateUsuarioInput;
    const tenantId = c.get("tenantId");
    try {
      const usuario = await createUsuario(repo, tenantId, body);
      return c.json({ success: true, data: usuario }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_DOCUMENTO",
          "Número de documento ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    // param is always defined for routes that declare :id
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const usuario = await getUsuarioById(repo, tenantId, id);
    if (!usuario) throw new ApiError("USER_NOT_FOUND", "Usuario no encontrado", 404);
    return c.json({ success: true, data: usuario });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateUsuarioHttpInput;
    const tenantId = c.get("tenantId");
    // Build input explicitly — exactOptionalPropertyTypes forbids spreading Zod partials directly
    const input: UpdateUsuarioInput = {
      ...(body.tipo_documento !== undefined ? { tipo_documento: body.tipo_documento } : {}),
      ...(body.numero_documento !== undefined ? { numero_documento: body.numero_documento } : {}),
      ...(body.nombres !== undefined ? { nombres: body.nombres } : {}),
      ...(body.apellidos !== undefined ? { apellidos: body.apellidos } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.telefono !== undefined ? { telefono: body.telefono } : {}),
      ...(body.password !== undefined ? { password: body.password } : {}),
      ...(body.rol !== undefined ? { rol: body.rol } : {}),
      ...(body.sucursal_id !== undefined ? { sucursal_id: body.sucursal_id } : {}),
    };
    try {
      const usuario = await updateUsuario(repo, tenantId, id, input);
      if (!usuario) throw new ApiError("USER_NOT_FOUND", "Usuario no encontrado", 404);
      return c.json({ success: true, data: usuario });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_DOCUMENTO",
          "Número de documento ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteUsuario(repo, tenantId, id);
    if (!deleted) throw new ApiError("USER_NOT_FOUND", "Usuario no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
