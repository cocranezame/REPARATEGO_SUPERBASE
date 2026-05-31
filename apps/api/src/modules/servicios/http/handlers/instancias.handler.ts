import type {
  AddInstanciaImagenInput,
  CreateInstanciaInput,
  ListInstanciasQuery,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class InstanciasHandler {
  constructor(private readonly repo: IServicioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListInstanciasQuery;
    const result = await this.repo.listInstancias(tenantId, {
      ...(query.cliente_id !== undefined ? { cliente_id: query.cliente_id } : {}),
      ...(query.producto_id !== undefined ? { producto_id: query.producto_id } : {}),
      page: query.page,
      pageSize: query.pageSize,
    });
    const totalPages = Math.ceil(result.total / query.pageSize);
    return c.json({
      success: true,
      data: result.items,
      meta: { total: result.total, page: query.page, pageSize: query.pageSize, totalPages },
    });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateInstanciaInput;
    const instancia = await this.repo.createInstancia(
      tenantId,
      {
        cliente_id: body.cliente_id,
        producto_id: body.producto_id,
        ...(body.numero_serie !== undefined ? { numero_serie: body.numero_serie } : {}),
      },
      userId
    );
    return c.json({ success: true, data: instancia }, 201);
  };

  addImagen = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const instanciaId = c.req.param("id") as string;
    const body = c.req.valid("json") as AddInstanciaImagenInput;
    const imagen = await this.repo.addInstanciaImagen(tenantId, instanciaId, {
      url: body.url,
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      ...(body.orden !== undefined ? { orden: body.orden } : {}),
    });
    return c.json({ success: true, data: imagen }, 201);
  };
}
