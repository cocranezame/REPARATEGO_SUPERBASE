import Anthropic from "@anthropic-ai/sdk";
import type {
  AgenteActivo,
  ICrmRepository,
  LeadForAgent,
  MensajeContexto,
} from "../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../infra/services/meta-sender.js";
import { buscarCliente } from "./tools/buscar-cliente.tool.js";
import { consultarRepuesto } from "./tools/consultar-repuesto.tool.js";
import { crearCliente } from "./tools/crear-cliente.tool.js";
import { crearServicio } from "./tools/crear-servicio.tool.js";
import { derivarVendedor } from "./tools/derivar-vendedor.tool.js";
import { enviarLink } from "./tools/enviar-link.tool.js";
import { guardarDato } from "./tools/guardar-dato.tool.js";
import { moverEtapa } from "./tools/mover-etapa.tool.js";
import type { ToolContext, ToolDef, ToolResult } from "./tools/types.js";

export type AgentRunParams = {
  tenantId: string;
  conversacionId: string;
  leadId: string;
  waCuentaId: string;
  celular: string;
  mensajeEntrante: string;
};

export class AgentEngine {
  private readonly tools: ToolDef[];

  constructor(
    private readonly repo: ICrmRepository,
    private readonly metaSender: MetaSenderService
  ) {
    this.tools = [
      guardarDato,
      moverEtapa,
      buscarCliente,
      crearCliente,
      crearServicio,
      derivarVendedor,
      enviarLink,
      consultarRepuesto,
    ];
  }

  async run(params: AgentRunParams): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[agent] ANTHROPIC_API_KEY no configurado");
      return;
    }

    const agente = await this.repo.findAgenteActivo(params.tenantId, "WHATSAPP");
    if (!agente) {
      console.warn("[agent] Sin agente activo para WHATSAPP en tenant:", params.tenantId);
      return;
    }

    const lead = await this.repo.findLeadForAgent(params.tenantId, params.leadId);
    if (!lead) return;

    const historial = await this.repo.listMensajesParaContexto(
      params.tenantId,
      params.conversacionId,
      agente.max_mensajes_contexto
    );

    const system = this.buildSystem(agente, lead);
    const messages = this.buildMessages(historial, params.mensajeEntrante);

    const toolDefs = this.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    const toolCtx: ToolContext = {
      repo: this.repo,
      tenantId: params.tenantId,
      conversacionId: params.conversacionId,
      leadId: params.leadId,
      waCuentaId: params.waCuentaId,
      celular: params.celular,
      metaSender: this.metaSender,
    };

    const client = new Anthropic({ apiKey });
    // biome-ignore lint/suspicious/noExplicitAny: Anthropic SDK message history is mutable
    const messages_ = messages as any;

    let textoFinal = "";

    for (let iter = 0; iter < 5; iter++) {
      const response = await client.messages.create({
        model: agente.modelo_ia,
        max_tokens: 1024,
        system,
        messages: messages_,
        tools: toolDefs as unknown as Anthropic.Tool[],
      });

      if (response.stop_reason === "end_turn") {
        textoFinal = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type !== "tool_use") continue;

          const start = Date.now();
          let result: ToolResult;
          try {
            const tool = this.tools.find((t) => t.name === block.name);
            if (!tool) throw new Error(`Tool ${block.name} no encontrada`);
            result = await tool.execute(block.input as Record<string, unknown>, toolCtx);
          } catch (e) {
            result = {
              success: false,
              error: e instanceof Error ? e.message : "Error desconocido",
            };
          }
          const duracion = Date.now() - start;

          // N11: Log toda acción del agente
          await this.repo.logAccionAgente(params.tenantId, {
            agente_id: agente.id,
            conversacion_id: params.conversacionId,
            lead_id: params.leadId,
            tool_name: block.name,
            tool_input: block.input,
            tool_output: result,
            exitoso: result.success,
            duracion_ms: duracion,
            ...(result.error !== undefined ? { error: result.error } : {}),
          });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        messages_.push({ role: "assistant", content: response.content });
        messages_.push({ role: "user", content: toolResults });
      }
    }

    if (textoFinal.trim()) {
      try {
        const { wa_message_id } = await this.metaSender.sendTextMessage(params.tenantId, {
          wa_cuenta_id: params.waCuentaId,
          celular_destino: params.celular,
          texto: textoFinal,
        });
        await this.repo.guardarMensaje(params.tenantId, {
          conversacion_id: params.conversacionId,
          wa_message_id,
          direccion: "SALIENTE",
          origen: "AGENTE",
          tipo: "TEXTO",
          contenido: textoFinal,
        });
      } catch (e) {
        console.error("[agent] Error enviando respuesta:", e);
      }
    }
  }

  private buildSystem(agente: AgenteActivo, lead: LeadForAgent): string {
    const base =
      agente.prompt_base ??
      "Eres Nico, asistente de ReparaTego. Ayuda a los clientes con sus consultas de reparación.";
    const tono = agente.tono ?? "";
    const objetivo = lead.etapa_objetivo ?? "Asistir al cliente";
    const datos = [
      lead.nombre ? `Nombre: ${lead.nombre}` : null,
      lead.equipo_descripcion ? `Equipo: ${lead.equipo_descripcion}` : null,
      lead.falla_descripcion ? `Falla: ${lead.falla_descripcion}` : null,
      lead.ubicacion ? `Ubicación: ${lead.ubicacion}` : null,
    ]
      .filter(Boolean)
      .join(". ");

    return [
      base,
      tono,
      `Objetivo en esta etapa (${lead.etapa_nombre}): ${objetivo}`,
      datos ? `Datos del cliente: ${datos}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private buildMessages(
    historial: MensajeContexto[],
    mensajeActual: string
  ): Anthropic.MessageParam[] {
    const msgs: Anthropic.MessageParam[] = [];

    // Construir historial alternando user/assistant estrictamente
    // Los mensajes están en orden ASC (buildMessages recibe historial ya ordenado ASC)
    let pendingRole: "user" | "assistant" | null = null;
    let pendingContent = "";

    for (const m of historial) {
      const role: "user" | "assistant" = m.direccion === "ENTRANTE" ? "user" : "assistant";
      const contenido = m.contenido ?? "";

      if (pendingRole === null) {
        pendingRole = role;
        pendingContent = contenido;
      } else if (pendingRole === role) {
        // Concatenar mensajes del mismo rol
        pendingContent = pendingContent + "\n" + contenido;
      } else {
        msgs.push({ role: pendingRole, content: pendingContent });
        pendingRole = role;
        pendingContent = contenido;
      }
    }

    if (pendingRole !== null) {
      msgs.push({ role: pendingRole, content: pendingContent });
    }

    // El mensaje actual es siempre "user"
    // Si el último mensaje en msgs es también "user", concatenar
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === "user" && typeof lastMsg.content === "string") {
      lastMsg.content = lastMsg.content + "\n" + mensajeActual;
    } else {
      msgs.push({ role: "user", content: mensajeActual });
    }

    // Anthropic: el primer mensaje debe ser "user"
    // Si empieza con "assistant", agregar mensaje vacío inicial de user
    if (msgs.length > 0 && msgs[0]?.role === "assistant") {
      msgs.unshift({ role: "user", content: "" });
    }

    return msgs;
  }
}
