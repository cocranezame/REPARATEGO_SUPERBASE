import type { ToolContext, ToolDef, ToolResult } from "./types.js";

const PORTAL_BASE_URL = process.env.PORTAL_URL ?? "https://portal.reparatego.com";

export const enviarLink: ToolDef = {
  name: "enviarLink",
  description:
    "Envía un enlace útil al cliente por WhatsApp: ubicación de la sucursal o seguimiento de su orden de servicio.",
  input_schema: {
    type: "object",
    properties: {
      tipo: {
        type: "string",
        enum: ["SUCURSAL", "SEGUIMIENTO_ORDEN"],
        description: "Tipo de link a enviar",
      },
      referencia_id: {
        type: "string",
        description:
          "ID de referencia: para SUCURSAL es el sucursal_id (opcional, usa la del lead), para SEGUIMIENTO_ORDEN es el orden_servicio_id",
      },
    },
    required: ["tipo"],
  },
  execute: async (input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const tipo = input.tipo as "SUCURSAL" | "SEGUIMIENTO_ORDEN";
    const referenciaId = input.referencia_id as string | undefined;

    if (!tipo) {
      return { success: false, error: "tipo es requerido" };
    }

    let texto: string;
    let linkUrl: string;

    if (tipo === "SUCURSAL") {
      // Buscar sucursal del lead o por referenciaId
      let sucursalId = referenciaId;
      if (!sucursalId) {
        const lead = await ctx.repo.findLeadForAgent(ctx.tenantId, ctx.leadId);
        sucursalId = lead?.sucursal_id ?? undefined;
      }

      if (sucursalId) {
        const sucursal = await ctx.repo.findSucursalById(ctx.tenantId, sucursalId);
        if (sucursal) {
          const dir = sucursal.direccion ?? "consulta en tienda";
          texto = `Puedes visitar nuestra sucursal "${sucursal.nombre}" en: ${dir}`;
          linkUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
        } else {
          texto = "Puedes visitar cualquiera de nuestras sucursales para tu servicio.";
          linkUrl = "https://reparatego.com/sucursales";
        }
      } else {
        texto = "Puedes visitar cualquiera de nuestras sucursales para tu servicio.";
        linkUrl = "https://reparatego.com/sucursales";
      }
    } else {
      // SEGUIMIENTO_ORDEN
      const osId = referenciaId ?? "";
      linkUrl = `${PORTAL_BASE_URL}/seguimiento/${osId}`;
      texto = osId
        ? `Puedes seguir el estado de tu equipo aquí: ${linkUrl}`
        : `Consulta el estado de tu orden en: ${PORTAL_BASE_URL}/seguimiento`;
    }

    const mensajeCompleto = texto;

    try {
      const { wa_message_id } = await ctx.metaSender.sendTextMessage(ctx.tenantId, {
        wa_cuenta_id: ctx.waCuentaId,
        celular_destino: ctx.celular,
        texto: mensajeCompleto,
      });

      await ctx.repo.guardarMensaje(ctx.tenantId, {
        conversacion_id: ctx.conversacionId,
        wa_message_id,
        direccion: "SALIENTE",
        origen: "AGENTE",
        tipo: "LINK",
        contenido: mensajeCompleto,
        metadata: { tipo, referencia_id: referenciaId ?? null, url: linkUrl },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar link";
      return { success: false, error: msg };
    }

    return { success: true, data: { tipo, url: linkUrl, texto: mensajeCompleto } };
  },
};
