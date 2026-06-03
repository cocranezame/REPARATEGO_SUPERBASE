import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const derivarVendedor: ToolDef = {
  name: "derivarVendedor",
  description:
    "Transfiere la conversación a un vendedor humano. Usa esto cuando el cliente necesite atención personalizada, cuando la consulta sea compleja o cuando el cliente lo solicite explícitamente. Después de derivar, Nico deja de responder en esta conversación.",
  input_schema: {
    type: "object",
    properties: {
      motivo: {
        type: "string",
        description:
          "Motivo de la derivación (e.g. 'solicitud del cliente', 'consulta compleja', 'cotización especial')",
      },
    },
    required: ["motivo"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const motivo = input.motivo as string;
    if (!motivo) {
      return { success: false, error: "motivo es requerido" };
    }

    const result = await ctx.repo.derivarVendedorNico(
      ctx.tenantId,
      ctx.leadId,
      ctx.conversacionId,
      motivo
    );

    return {
      success: true,
      data: {
        vendedor_id: result.vendedor_id,
        vendedor_nombre: result.vendedor_nombre,
        modo: "VENDEDOR",
        motivo,
      },
    };
  },
};
