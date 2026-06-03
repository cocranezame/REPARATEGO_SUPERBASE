import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const moverEtapa: ToolDef = {
  name: "moverEtapa",
  description:
    "Mueve el lead a una nueva etapa del CRM. Solo úsalo cuando el lead cumpla con los criterios objetivos de la etapa destino. La transición debe estar permitida por la configuración del pipeline.",
  input_schema: {
    type: "object",
    properties: {
      codigo_etapa: {
        type: "string",
        description:
          "Código de la etapa destino (e.g. CALIFICACION, OFERTA_ENVIADA, CONVERTIDO, PERDIDO)",
      },
    },
    required: ["codigo_etapa"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const codigoEtapa = input.codigo_etapa as string;
    if (!codigoEtapa) {
      return { success: false, error: "codigo_etapa es requerido" };
    }

    const etapa = await ctx.repo.findEtapaByCodigo(ctx.tenantId, codigoEtapa);
    if (!etapa) {
      return { success: false, error: `Etapa con código "${codigoEtapa}" no encontrada` };
    }

    try {
      // moverEtapaLead valida la transición internamente
      // Pasamos "NICO" como userId — se almacena en JSONB datos.usuario_id (no es FK)
      await ctx.repo.moverEtapaLead(ctx.tenantId, ctx.leadId, etapa.id, "NICO");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al mover etapa";
      return { success: false, error: msg };
    }

    return {
      success: true,
      data: { etapa_id: etapa.id, etapa_nombre: etapa.nombre, etapa_codigo: etapa.codigo },
    };
  },
};
