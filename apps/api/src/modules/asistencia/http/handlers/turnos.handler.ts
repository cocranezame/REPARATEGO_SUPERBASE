import type { CreateTurnoTrabajoInput, UpdateTurnoTrabajoInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class TurnosHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const turnos = await this.repo.listTurnos(tenantId);
    return c.json({ success: true, data: turnos });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateTurnoTrabajoInput;
    const turno = await this.repo.createTurno(tenantId, {
      nombre: body.nombre,
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin,
      tolerancia_minutos: body.tolerancia_minutos,
      dias_laborales: body.dias_laborales as string[],
      activo: body.activo,
    });
    return c.json({ success: true, data: turno }, 201);
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const turno = await this.repo.findTurnoById(tenantId, id);
    if (!turno) throw new ApiError("TURNO_NOT_FOUND", "Turno no encontrado", 404);
    return c.json({ success: true, data: turno });
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateTurnoTrabajoInput;
    const turno = await this.repo.updateTurno(tenantId, id, {
      nombre: body.nombre,
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin,
      tolerancia_minutos: body.tolerancia_minutos,
      dias_laborales: body.dias_laborales as string[] | undefined,
      activo: body.activo,
    });
    if (!turno) throw new ApiError("TURNO_NOT_FOUND", "Turno no encontrado", 404);
    return c.json({ success: true, data: turno });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deleteTurno(tenantId, id);
    if (!ok) throw new ApiError("TURNO_NOT_FOUND", "Turno no encontrado", 404);
    return c.json({ success: true, data: null });
  };
}
