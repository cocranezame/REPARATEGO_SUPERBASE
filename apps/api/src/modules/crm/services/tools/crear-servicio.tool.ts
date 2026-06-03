import type { ToolContext, ToolDef, ToolResult } from "./types.js";

export const crearServicio: ToolDef = {
  name: "crearServicio",
  description:
    "Crea una Orden de Servicio (OS) para el equipo del cliente. IMPORTANTE: Antes de usar esta herramienta, confirma con el cliente: '¿Confirmo que quieres registrar tu equipo para reparación?' El cliente debe tener un perfil creado (usa crearCliente primero si no existe). Al crear la OS se asigna automáticamente la etiqueta SERVICIO_CREADO.",
  input_schema: {
    type: "object",
    properties: {
      falla_ingreso: {
        type: "string",
        description: "Descripción de la falla ingresada para la OS",
      },
      categoria_id: {
        type: "string",
        description: "UUID de la categoría del equipo (opcional, para calcular costo revisión)",
      },
      canal: {
        type: "string",
        enum: ["TIENDA", "DOMICILIO"],
        description: "Canal de ingreso del servicio (por defecto TIENDA)",
      },
    },
    required: ["falla_ingreso"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const falla_ingreso = input.falla_ingreso as string;
    const categoria_id = input.categoria_id as string | undefined;
    const canal = input.canal as string | undefined;

    if (!falla_ingreso) {
      return { success: false, error: "falla_ingreso es requerida" };
    }

    // Verificar que el lead tiene cliente asociado
    const lead = await ctx.repo.findLeadForAgent(ctx.tenantId, ctx.leadId);
    if (!lead) {
      return { success: false, error: "Lead no encontrado" };
    }
    if (!lead.cliente_id) {
      return {
        success: false,
        error: "El lead no tiene un cliente asociado. Usa crearCliente o buscarCliente primero.",
      };
    }

    try {
      const os = await ctx.repo.crearServicioNico(ctx.tenantId, {
        leadId: ctx.leadId,
        clienteId: lead.cliente_id,
        falla_ingreso,
        ...(categoria_id !== undefined ? { categoria_id } : {}),
        ...(canal !== undefined ? { canal } : {}),
      });

      // Asignar etiqueta SERVICIO_CREADO
      await ctx.repo.asignarEtiquetaNico(ctx.tenantId, ctx.leadId, "SERVICIO_CREADO");

      return { success: true, data: os };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear servicio";
      return { success: false, error: msg };
    }
  },
};
