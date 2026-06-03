import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";
import type { AgentEngine } from "../../services/agent-engine.js";
import type { BotEngine } from "../../services/bot-engine.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

// Meta webhook body types
type MetaMsg = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string } | undefined;
};

type MetaContact = {
  profile: { name: string };
  wa_id: string;
};

type MetaWebhookBody = {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: MetaContact[] | undefined;
        messages?: MetaMsg[] | undefined;
      };
    }>;
  }>;
};

function verifyHmac(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
  try {
    const eBuf = Buffer.from(expected, "utf8");
    const sBuf = Buffer.from(signature, "utf8");
    if (eBuf.length !== sBuf.length) return false;
    return timingSafeEqual(eBuf, sBuf);
  } catch {
    return false;
  }
}

export class WebhookHandler {
  constructor(
    private readonly repo: ICrmRepository,
    private readonly agentEngine: AgentEngine,
    private readonly botEngine: BotEngine
  ) {}

  verify = async (c: HonoCtx) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    if (mode !== "subscribe" || !token || !challenge) return c.text("", 403);

    const found = await this.repo.findWaCuentaByVerifyToken(token);
    if (!found) return c.text("", 403);

    return c.text(challenge);
  };

  handle = async (c: HonoCtx) => {
    const secret = process.env.META_APP_SECRET;
    if (!secret) {
      console.error("[webhook] META_APP_SECRET no configurado");
      return c.json({ ok: true });
    }

    const rawBody = await c.req.text();
    const signature = c.req.header("x-hub-signature-256");

    if (!verifyHmac(rawBody, signature, secret)) return c.json({}, 403);

    let body: MetaWebhookBody;
    try {
      body = JSON.parse(rawBody) as MetaWebhookBody;
    } catch {
      return c.json({ ok: true });
    }

    if (body.object !== "whatsapp_business_account") return c.json({ ok: true });

    // Procesar async — Meta espera 200 rápido
    this.processWebhook(body).catch((e) => console.error("[webhook] Error procesando:", e));

    return c.json({ ok: true });
  };

  private async processWebhook(body: MetaWebhookBody): Promise<void> {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const { phone_number_id } = change.value.metadata;
        const waCuenta = await this.repo.findWaCuentaByPhoneNumberId(phone_number_id);
        if (!waCuenta) continue;

        for (const msg of change.value.messages ?? []) {
          if (msg.type !== "text") continue;

          await this.processMessage({
            tenantId: waCuenta.tenant_id,
            waCuentaId: waCuenta.id,
            celular: msg.from,
            waMessageId: msg.id,
            contenido: msg.text?.body ?? "",
            senderName: change.value.contacts?.[0]?.profile?.name ?? null,
          });
        }
      }
    }
  }

  private async processMessage(p: {
    tenantId: string;
    waCuentaId: string;
    celular: string;
    waMessageId: string;
    contenido: string;
    senderName: string | null;
  }): Promise<void> {
    // N2: idempotencia — ignorar mensaje ya procesado
    if (await this.repo.existsMensajeByWaId(p.tenantId, p.waMessageId)) return;

    // Buscar o crear conversación + lead
    let conv = await this.repo.findConversacionActivaByCelular(p.tenantId, p.waCuentaId, p.celular);

    if (!conv) {
      conv = await this.repo.crearConversacionConLead(p.tenantId, {
        waCuentaId: p.waCuentaId,
        celular: p.celular,
        ...(p.senderName !== null ? { nombre: p.senderName } : {}),
      });
    }

    // N1: guardar mensaje ANTES de procesar para idempotencia
    await this.repo.guardarMensaje(p.tenantId, {
      conversacion_id: conv.id,
      wa_message_id: p.waMessageId,
      direccion: "ENTRANTE",
      origen: "CLIENTE",
      tipo: "TEXTO",
      contenido: p.contenido,
    });

    // N7: si modo VENDEDOR, no invocar agente
    if (conv.modo === "VENDEDOR") return;

    // N18: rutear según operador de la etapa actual del lead
    const lead = await this.repo.findLeadForAgent(p.tenantId, conv.lead_id);
    if (!lead) return;

    const operador = lead.etapa_operador;

    if (operador === "BOT" && lead.etapa_bot_id) {
      await this.botEngine.run({
        tenantId: p.tenantId,
        conversacionId: conv.id,
        leadId: conv.lead_id,
        waCuentaId: p.waCuentaId,
        celular: p.celular,
        mensajeEntrante: p.contenido,
        botId: lead.etapa_bot_id,
      });
    } else if (operador === "IA") {
      await this.agentEngine.run({
        tenantId: p.tenantId,
        conversacionId: conv.id,
        leadId: conv.lead_id,
        waCuentaId: p.waCuentaId,
        celular: p.celular,
        mensajeEntrante: p.contenido,
      });
    }
    // HUMANO y SISTEMA: no invocar nada
  }
}
