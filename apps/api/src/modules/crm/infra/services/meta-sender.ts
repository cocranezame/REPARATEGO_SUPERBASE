import type { DbClient } from "@kallpasoft/db";
import { sql } from "drizzle-orm";

export type MetaSendOptions = {
  wa_cuenta_id: string;
  celular_destino: string;
  texto: string;
};

export type MetaSendTemplateOptions = {
  wa_cuenta_id: string;
  celular_destino: string;
  template_name: string;
  variables: string[];
  language?: string | undefined;
};

export type MetaSendResult = {
  wa_message_id: string;
};

export class MetaSenderService {
  constructor(private readonly db: DbClient) {}

  async sendTextMessage(tenantId: string, options: MetaSendOptions): Promise<MetaSendResult> {
    const key = process.env.CRM_ENCRYPTION_KEY;
    if (!key) throw new Error("CRM_ENCRYPTION_KEY no configurado");

    const rows = await this.db.execute(sql`
      SELECT phone_number_id,
             pgp_sym_decrypt(access_token_encrypted, ${key})::text AS access_token
      FROM wa_cuenta
      WHERE id = ${options.wa_cuenta_id}::uuid AND tenant_id = ${tenantId}::uuid AND activo = true
    `);
    const cuenta = rows[0] as { phone_number_id: string; access_token: string } | undefined;
    if (!cuenta) throw new Error("WA cuenta no encontrada o inactiva");

    const url = `https://graph.facebook.com/v18.0/${cuenta.phone_number_id}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: options.celular_destino,
      type: "text",
      text: { preview_url: false, body: options.texto },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cuenta.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorMsg =
        (errorBody as { error?: { message?: string } })?.error?.message ??
        `HTTP ${response.status}`;
      throw new Error(`Meta API error: ${errorMsg}`);
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const wa_message_id = data?.messages?.[0]?.id;
    if (!wa_message_id) throw new Error("Meta API no retornó message_id");

    return { wa_message_id };
  }

  async sendTemplateMessage(
    tenantId: string,
    options: MetaSendTemplateOptions
  ): Promise<MetaSendResult> {
    const key = process.env.CRM_ENCRYPTION_KEY;
    if (!key) throw new Error("CRM_ENCRYPTION_KEY no configurado");

    const rows = await this.db.execute(sql`
      SELECT phone_number_id,
             pgp_sym_decrypt(access_token_encrypted, ${key})::text AS access_token
      FROM wa_cuenta
      WHERE id = ${options.wa_cuenta_id}::uuid AND tenant_id = ${tenantId}::uuid AND activo = true
    `);
    const cuenta = rows[0] as { phone_number_id: string; access_token: string } | undefined;
    if (!cuenta) throw new Error("WA cuenta no encontrada o inactiva");

    const url = `https://graph.facebook.com/v18.0/${cuenta.phone_number_id}/messages`;
    const parameters = options.variables.map((v) => ({ type: "text", text: v }));
    const payload = {
      messaging_product: "whatsapp",
      to: options.celular_destino,
      type: "template",
      template: {
        name: options.template_name,
        language: { code: options.language ?? "es" },
        ...(parameters.length > 0 ? { components: [{ type: "body", parameters }] } : {}),
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cuenta.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorMsg =
        (errorBody as { error?: { message?: string } })?.error?.message ??
        `HTTP ${response.status}`;
      throw new Error(`Meta API template error: ${errorMsg}`);
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const wa_message_id = data?.messages?.[0]?.id;
    if (!wa_message_id) throw new Error("Meta API no retornó message_id para plantilla");

    return { wa_message_id };
  }
}
