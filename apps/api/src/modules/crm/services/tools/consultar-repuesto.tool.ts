import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const consultarRepuesto: ToolDef = {
  name: "consultarRepuesto",
  description:
    "Consulta disponibilidad y precio de repuestos en el inventario. Solo lectura. Retorna hasta 5 resultados con stock disponible y precio de venta.",
  input_schema: {
    type: "object",
    properties: {
      busqueda: {
        type: "string",
        description: "Texto de búsqueda del repuesto (nombre del producto)",
      },
      categoria_id: {
        type: "string",
        description: "UUID de la categoría para filtrar (opcional)",
      },
    },
    required: ["busqueda"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const busqueda = input.busqueda as string;
    const categoriaId = input.categoria_id as string | undefined;

    if (!busqueda || busqueda.trim().length === 0) {
      return { success: false, error: "busqueda es requerida" };
    }

    const repuestos = await ctx.repo.consultarRepuestos(ctx.tenantId, busqueda.trim(), categoriaId);

    return { success: true, data: repuestos };
  },
};
