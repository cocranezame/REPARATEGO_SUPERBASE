import type { CreateClienteInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IClienteRepository, ListClientesParams } from "../domain/ports/cliente.repository.js";
import type { IClienteDireccionRepository } from "../domain/ports/cliente-direccion.repository.js";
import { buscarClientePorDocumento } from "../domain/use-cases/buscar-documento.js";
import { createCliente } from "../domain/use-cases/create-cliente.js";
import { createClienteDireccion } from "../domain/use-cases/create-cliente-direccion.js";
import { deleteCliente } from "../domain/use-cases/delete-cliente.js";
import { deleteClienteDireccion } from "../domain/use-cases/delete-cliente-direccion.js";
import { getClienteById } from "../domain/use-cases/get-cliente-by-id.js";
import { listClienteDirecciones } from "../domain/use-cases/list-cliente-direcciones.js";
import { listClientes } from "../domain/use-cases/list-clientes.js";
import type { UpdateClienteInput } from "../domain/use-cases/update-cliente.js";
import { updateCliente } from "../domain/use-cases/update-cliente.js";
import { updateClienteDireccion } from "../domain/use-cases/update-cliente-direccion.js";
import type {
  BuscarDocumentoQuery,
  CreateClienteDireccionHttpInput,
  ListClientesQuery,
  UpdateClienteDireccionHttpInput,
  UpdateClienteHttpInput,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

export function createClienteHandlers(
  clienteRepo: IClienteRepository,
  direccionRepo: IClienteDireccionRepository
) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListClientesQuery;
    const tenantId = c.get("tenantId");

    const params: ListClientesParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
      ...(query.tipo_documento !== undefined ? { tipo_documento: query.tipo_documento } : {}),
      ...(query.tipo_persona !== undefined ? { tipo_persona: query.tipo_persona } : {}),
    };

    const result = await listClientes(clienteRepo, tenantId, params);
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
    const body = c.req.valid("json") as CreateClienteInput;
    const tenantId = c.get("tenantId");
    try {
      const cliente = await createCliente(clienteRepo, tenantId, body);
      return c.json({ success: true, data: cliente }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_CLIENTE",
          "Número de documento ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const cliente = await getClienteById(clienteRepo, tenantId, id);
    if (!cliente) throw new ApiError("CLIENTE_NOT_FOUND", "Cliente no encontrado", 404);
    return c.json({ success: true, data: cliente });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateClienteHttpInput;
    const tenantId = c.get("tenantId");

    const input: UpdateClienteInput = {
      ...(body.tipo_documento !== undefined ? { tipo_documento: body.tipo_documento } : {}),
      ...(body.numero_documento !== undefined ? { numero_documento: body.numero_documento } : {}),
      ...(body.tipo_persona !== undefined ? { tipo_persona: body.tipo_persona } : {}),
      ...(body.nombres !== undefined ? { nombres: body.nombres } : {}),
      ...(body.apellidos !== undefined ? { apellidos: body.apellidos } : {}),
      ...(body.razon_social !== undefined ? { razon_social: body.razon_social } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.telefono !== undefined ? { telefono: body.telefono } : {}),
      ...(body.telefono_secundario !== undefined
        ? { telefono_secundario: body.telefono_secundario }
        : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    };

    try {
      const cliente = await updateCliente(clienteRepo, tenantId, id, input);
      if (!cliente) throw new ApiError("CLIENTE_NOT_FOUND", "Cliente no encontrado", 404);
      return c.json({ success: true, data: cliente });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_CLIENTE",
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
    const deleted = await deleteCliente(clienteRepo, tenantId, id);
    if (!deleted) throw new ApiError("CLIENTE_NOT_FOUND", "Cliente no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  async function buscarDocumento(c: HonoCtx) {
    const query = c.req.valid("query") as BuscarDocumentoQuery;
    const tenantId = c.get("tenantId");
    const cliente = await buscarClientePorDocumento(
      clienteRepo,
      tenantId,
      query.tipo,
      query.numero
    );
    if (!cliente) throw new ApiError("CLIENTE_NOT_FOUND", "Cliente no encontrado", 404);
    return c.json({ success: true, data: cliente });
  }

  async function listDirecciones(c: HonoCtx) {
    const clienteId = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const dirs = await listClienteDirecciones(direccionRepo, tenantId, clienteId);
    return c.json({ success: true, data: dirs });
  }

  async function createDireccion(c: HonoCtx) {
    const clienteId = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateClienteDireccionHttpInput;
    const tenantId = c.get("tenantId");
    const dir = await createClienteDireccion(direccionRepo, tenantId, clienteId, body);
    return c.json({ success: true, data: dir }, 201);
  }

  async function updateDireccion(c: HonoCtx) {
    const clienteId = c.req.param("clienteId") as string;
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateClienteDireccionHttpInput;
    const tenantId = c.get("tenantId");
    const dir = await updateClienteDireccion(direccionRepo, tenantId, id, clienteId, body);
    if (!dir) throw new ApiError("DIRECCION_NOT_FOUND", "Dirección no encontrada", 404);
    return c.json({ success: true, data: dir });
  }

  async function removeDireccion(c: HonoCtx) {
    const clienteId = c.req.param("clienteId") as string;
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteClienteDireccion(direccionRepo, tenantId, id, clienteId);
    if (!deleted) throw new ApiError("DIRECCION_NOT_FOUND", "Dirección no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return {
    list,
    create,
    getById,
    update,
    remove,
    buscarDocumento,
    listDirecciones,
    createDireccion,
    updateDireccion,
    removeDireccion,
  };
}
