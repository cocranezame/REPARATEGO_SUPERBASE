import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const crearCliente: ToolDef = {
  name: "crearCliente",
  description:
    "Crea un nuevo cliente en el sistema y lo vincula al lead actual. Úsalo solo cuando el cliente no exista (verificar primero con buscarCliente). Al crear el cliente se asigna automáticamente la etiqueta CLIENTE_NUEVO.",
  input_schema: {
    type: "object",
    properties: {
      nombre: {
        type: "string",
        description: "Nombre completo del cliente",
      },
      numero_doc: {
        type: "string",
        description: "Número de documento (DNI u otro)",
      },
      celular: {
        type: "string",
        description: "Número de celular del cliente",
      },
      tipo_documento: {
        type: "string",
        enum: ["DNI", "RUC", "CE"],
        description: "Tipo de documento (por defecto DNI)",
      },
    },
    required: ["nombre", "numero_doc", "celular"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const nombre = input.nombre as string;
    const numero_doc = input.numero_doc as string;
    const celular = input.celular as string;
    const tipo_documento = input.tipo_documento as string | undefined;

    if (!nombre || !numero_doc || !celular) {
      return { success: false, error: "nombre, numero_doc y celular son requeridos" };
    }

    const cliente = await ctx.repo.crearClienteNico(ctx.tenantId, {
      nombre,
      numero_doc,
      celular,
      ...(tipo_documento !== undefined ? { tipo_documento } : {}),
      leadId: ctx.leadId,
    });

    // Asignar etiqueta CLIENTE_NUEVO
    await ctx.repo.asignarEtiquetaNico(ctx.tenantId, ctx.leadId, "CLIENTE_NUEVO");

    return { success: true, data: cliente };
  },
};
