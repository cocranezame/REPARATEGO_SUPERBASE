import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const buscarCliente: ToolDef = {
  name: "buscarCliente",
  description:
    "Busca un cliente existente en el sistema por número de documento (DNI/RUC) o celular. Solo lectura — no crea ni modifica datos.",
  input_schema: {
    type: "object",
    properties: {
      numero_doc: {
        type: "string",
        description: "Número de documento (DNI/RUC) del cliente",
      },
      celular: {
        type: "string",
        description: "Número de celular del cliente",
      },
    },
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const numeroDoc = input.numero_doc as string | undefined;
    const celular = input.celular as string | undefined;

    if (!numeroDoc && !celular) {
      return { success: false, error: "Debes proporcionar numero_doc o celular para buscar" };
    }

    const cliente = await ctx.repo.buscarClientePorDocOrCelular(ctx.tenantId, numeroDoc, celular);

    if (!cliente) {
      return { success: true, data: null };
    }

    return { success: true, data: cliente };
  },
};
