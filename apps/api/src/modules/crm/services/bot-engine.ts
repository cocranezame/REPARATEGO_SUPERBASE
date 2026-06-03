import type { ICrmRepository } from "../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../infra/services/meta-sender.js";

// ─── Tipos internos de config de nodo ──────────────────────────────────────────

type NodoOpcion = {
  id: string;
  label?: string | undefined;
  letra?: string | undefined;
  destino_nodo_id: string | null;
  accion?: string | undefined;
};

type BotNodo = {
  id: string;
  tipo: "MENSAJE" | "CONSULTA_INVENTARIO" | "CONSULTA_SERVICIO" | "RESULTADO" | "FIN";
  mensaje?: string | undefined;
  mensaje_template?: string | undefined;
  tipo_respuesta?: "BOTONES" | "LETRA" | "TEXTO_LIBRE" | "NINGUNA" | undefined;
  opciones?: NodoOpcion[] | undefined;
  consulta?: { categoria?: string | undefined; componente?: string | undefined } | undefined;
  destino_nodo_id?: string | undefined;
  accion_final?: string | undefined;
  etapa_destino_codigo?: string | undefined;
};

type BotConfig = {
  nodos: BotNodo[];
  nodo_inicial_id: string;
  timeout_minutos?: number | undefined;
};

export type BotEngineParams = {
  tenantId: string;
  conversacionId: string;
  leadId: string;
  waCuentaId: string;
  celular: string;
  mensajeEntrante: string;
  botId: string;
};

export class BotEngine {
  constructor(
    private readonly repo: ICrmRepository,
    private readonly metaSender: MetaSenderService
  ) {}

  async run(params: BotEngineParams): Promise<void> {
    const bot = await this.repo.findBotById(params.tenantId, params.botId);
    if (!bot || !bot.activo) return;

    const config = bot.config as BotConfig;
    if (!config?.nodos || !config.nodo_inicial_id) return;

    const lastBotMsg = await this.repo.getLastBotMessage(params.tenantId, params.conversacionId);

    if (!lastBotMsg) {
      // Primera vez que entra el bot: enviar nodo inicial
      const nodoInicial = config.nodos.find((n) => n.id === config.nodo_inicial_id);
      if (!nodoInicial) return;
      await this.sendNode(nodoInicial, params, config, null);
      return;
    }

    // Verificar timeout
    if (config.timeout_minutos) {
      const elapsed = (Date.now() - lastBotMsg.created_at.getTime()) / 60000;
      if (elapsed > config.timeout_minutos) {
        await this.handleFinalizar(params);
        return;
      }
    }

    const meta = lastBotMsg.metadata as Record<string, unknown> | null;
    const currentNodeId = meta?.current_node_id as string | undefined;
    if (!currentNodeId) return;

    const currentNode = config.nodos.find((n) => n.id === currentNodeId);
    if (!currentNode) return;

    const nextNodeId = this.matchInput(params.mensajeEntrante, currentNode);

    if (!nextNodeId) {
      // Input no reconocido: re-enviar nodo actual
      await this.sendNode(currentNode, params, config, null);
      return;
    }

    // Chequear si la opción tiene una acción especial (destino_nodo_id === null)
    const opcionSeleccionada = (currentNode.opciones ?? []).find((o) => {
      if (currentNode.tipo_respuesta === "BOTONES") {
        return this.matchBoton(params.mensajeEntrante, o);
      }
      if (currentNode.tipo_respuesta === "LETRA") {
        return this.matchLetra(params.mensajeEntrante, o);
      }
      return false;
    });

    if (opcionSeleccionada?.accion && !opcionSeleccionada.destino_nodo_id) {
      await this.handleAccion(opcionSeleccionada.accion, null, params);
      return;
    }

    await this.executeChain(nextNodeId, config, params, null);
  }

  private async executeChain(
    nodeId: string,
    config: BotConfig,
    params: BotEngineParams,
    contexto: string | null
  ): Promise<void> {
    const node = config.nodos.find((n) => n.id === nodeId);
    if (!node) return;

    if (node.tipo === "CONSULTA_INVENTARIO") {
      const lead = await this.repo.findLeadForAgent(params.tenantId, params.leadId);
      const busqueda = node.consulta?.componente ?? node.consulta?.categoria ?? "";
      const repuestos = await this.repo.consultarRepuestos(params.tenantId, busqueda);
      const resultado = this.formatRepuestos(repuestos);
      const nextId = node.destino_nodo_id;
      if (nextId) {
        await this.executeChain(nextId, config, params, resultado);
      }
      return;
    }

    if (node.tipo === "CONSULTA_SERVICIO") {
      const lead = await this.repo.findLeadForAgent(params.tenantId, params.leadId);
      let resultado = "No se encontraron servicios activos.";
      if (lead?.cliente_id) {
        const servicios = await this.repo.consultarServiciosCliente(
          params.tenantId,
          lead.cliente_id
        );
        resultado = this.formatServicios(servicios);
      }
      const nextId = node.destino_nodo_id;
      if (nextId) {
        await this.executeChain(nextId, config, params, resultado);
      }
      return;
    }

    if (node.tipo === "FIN") {
      const mensaje = node.mensaje ?? "Gracias por contactarnos. ¡Hasta pronto!";
      await this.enviarMensaje(params, mensaje, node.id);

      if (node.accion_final) {
        await this.handleAccion(node.accion_final, node.etapa_destino_codigo ?? null, params);
      }
      return;
    }

    // MENSAJE o RESULTADO
    const texto = this.resolveTemplate(node, contexto);
    await this.sendNode({ ...node, mensaje: texto } as BotNodo, params, config, contexto);
  }

  private async sendNode(
    node: BotNodo,
    params: BotEngineParams,
    config: BotConfig,
    contexto: string | null
  ): Promise<void> {
    const texto = this.resolveTemplate(node, contexto);
    if (!texto) return;

    await this.enviarMensaje(params, texto, node.id);
  }

  private async enviarMensaje(
    params: BotEngineParams,
    texto: string,
    currentNodeId: string
  ): Promise<void> {
    let wa_message_id: string | undefined;
    try {
      const result = await this.metaSender.sendTextMessage(params.tenantId, {
        wa_cuenta_id: params.waCuentaId,
        celular_destino: params.celular,
        texto,
      });
      wa_message_id = result.wa_message_id;
    } catch (e) {
      console.error("[bot-engine] Error enviando mensaje:", e);
      return;
    }

    await this.repo.guardarMensaje(params.tenantId, {
      conversacion_id: params.conversacionId,
      wa_message_id,
      direccion: "SALIENTE",
      origen: "BOT",
      tipo: "TEXTO",
      contenido: texto,
      metadata: { current_node_id: currentNodeId },
    });
  }

  private async handleAccion(
    accion: string,
    etapaCodigo: string | null,
    params: BotEngineParams
  ): Promise<void> {
    switch (accion) {
      case "DERIVAR_VENDEDOR":
        await this.repo.derivarVendedorNico(
          params.tenantId,
          params.leadId,
          params.conversacionId,
          "Derivado por bot"
        );
        break;
      case "MOVER_ETAPA":
        if (etapaCodigo) {
          await this.repo.moverEtapaDesdeBot(params.tenantId, params.leadId, etapaCodigo);
        }
        break;
      case "FINALIZAR":
        await this.handleFinalizar(params);
        break;
      case "INICIAR_BOT":
        // Queda fuera de scope — bot simplemente finaliza
        await this.handleFinalizar(params);
        break;
    }
  }

  private async handleFinalizar(params: BotEngineParams): Promise<void> {
    // Volver a modo NICO para que el agente pueda retomar
    await this.repo.cambiarModo(params.tenantId, params.conversacionId, "NICO");
  }

  // ─── Matching helpers ───────────────────────────────────────────────────────

  private matchInput(mensaje: string, nodo: BotNodo): string | null {
    if (!nodo.tipo_respuesta || nodo.tipo_respuesta === "NINGUNA") {
      return nodo.destino_nodo_id ?? null;
    }

    if (nodo.tipo_respuesta === "TEXTO_LIBRE") {
      return nodo.opciones?.[0]?.destino_nodo_id ?? null;
    }

    for (const opt of nodo.opciones ?? []) {
      if (nodo.tipo_respuesta === "BOTONES" && this.matchBoton(mensaje, opt)) {
        return opt.destino_nodo_id;
      }
      if (nodo.tipo_respuesta === "LETRA" && this.matchLetra(mensaje, opt)) {
        return opt.destino_nodo_id;
      }
    }
    return null;
  }

  private matchBoton(mensaje: string, opt: NodoOpcion): boolean {
    if (!opt.label) return false;
    const m = mensaje.trim().toLowerCase();
    if (m === opt.label.toLowerCase()) return true;
    // Matching numérico "1", "2", "3"
    return false;
  }

  private matchLetra(mensaje: string, opt: NodoOpcion): boolean {
    if (!opt.letra) return false;
    const primeraLetra = mensaje.trim().charAt(0).toUpperCase();
    return primeraLetra === opt.letra.toUpperCase();
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────

  private resolveTemplate(node: BotNodo, contexto: string | null): string {
    const template = node.mensaje_template ?? node.mensaje ?? "";
    if (!contexto) return template;
    return template.replace("{items}", contexto).replace("{count}", "varios");
  }

  private formatRepuestos(
    repuestos: Array<{ nombre: string; stock_disponible: number; precio_venta: string }>
  ): string {
    if (repuestos.length === 0) return "No encontré repuestos disponibles para tu búsqueda.";
    return repuestos
      .map((r, i) => `${i + 1}. ${r.nombre} — Stock: ${r.stock_disponible} — S/ ${r.precio_venta}`)
      .join("\n");
  }

  private formatServicios(
    servicios: Array<{ codigo: string; estado: string; falla_ingreso: string }>
  ): string {
    if (servicios.length === 0) return "No encontré servicios activos para tu equipo.";
    return servicios.map((s) => `• ${s.codigo}: ${s.estado} — ${s.falla_ingreso}`).join("\n");
  }
}
