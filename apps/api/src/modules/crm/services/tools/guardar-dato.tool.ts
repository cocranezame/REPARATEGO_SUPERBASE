import type { ToolContext, ToolDef, ToolResult } from "./types.js";

// Mapa campo → código de etiqueta
const CAMPO_ETIQUETA_MAP: Record<string, string> = {
  nombre: "NOMBRE_CAPTURADO",
  equipo_descripcion: "EQUIPO_IDENTIFICADO",
  falla_descripcion: "FALLA_DESCRITA",
  ubicacion: "UBICACION_CAPTURADA",
};

export const guardarDato: ToolDef = {
  name: "guardarDato",
  description:
    "Guarda un dato del cliente/lead (nombre, descripción del equipo, descripción de la falla o ubicación) y asigna la etiqueta correspondiente. Úsalo apenas captures información del cliente.",
  input_schema: {
    type: "object",
    properties: {
      campo: {
        type: "string",
        enum: ["nombre", "equipo_descripcion", "falla_descripcion", "ubicacion"],
        description: "Campo del lead a actualizar",
      },
      valor: {
        type: "string",
        description: "Valor a guardar en el campo",
      },
    },
    required: ["campo", "valor"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const campo = input.campo as string;
    const valor = input.valor as string;

    if (!campo || !valor) {
      return { success: false, error: "campo y valor son requeridos" };
    }

    await ctx.repo.guardarDatoLead(ctx.tenantId, ctx.leadId, campo, valor);

    const codigoEtiqueta = CAMPO_ETIQUETA_MAP[campo];
    if (codigoEtiqueta) {
      await ctx.repo.asignarEtiquetaNico(ctx.tenantId, ctx.leadId, codigoEtiqueta);
    }

    return { success: true, data: { campo, valor } };
  },
};
