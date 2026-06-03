import type { UpdateBotInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../../infra/services/meta-sender.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

const VENTANA_24H_MS = 24 * 60 * 60 * 1000;

export class BotsHandler {
  constructor(
    private readonly repo: ICrmRepository,
    private readonly metaSender: MetaSenderService
  ) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const items = await this.repo.listBots(tenantId);
    return c.json({ success: true, data: items });
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateBotInput;
    const bot = await this.repo.updateBot(tenantId, id, body);
    if (!bot) throw new ApiError("BOT_NOT_FOUND", "Bot no encontrado", 404);
    return c.json({ success: true, data: bot });
  };

  findConfig = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const bot = await this.repo.findBotById(tenantId, id);
    if (!bot) throw new ApiError("BOT_NOT_FOUND", "Bot no encontrado", 404);
    return c.json({ success: true, data: bot });
  };

  ejecutarRecordatorio = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const candidatos = await this.repo.getBotesRecordatorio(tenantId);
    let procesados = 0;
    let derivados_sin_respuesta = 0;

    for (const cand of candidatos) {
      const { lead_id, conversacion_id, tiempo_espera_horas, max_intentos, wa_cuenta_id, celular } =
        cand;

      const intentos = await this.repo.countEventosBotLead(tenantId, lead_id);

      if (intentos >= max_intentos) {
        // Mover a SIN_RESPUESTA
        await this.repo.moverEtapaDesdeBot(tenantId, lead_id, "SIN_RESPUESTA");
        await this.repo.registrarEventoBot(tenantId, lead_id, conversacion_id, {
          accion: "MOVER_SIN_RESPUESTA",
          intentos,
          max_intentos,
        });
        derivados_sin_respuesta++;
        continue;
      }

      // Verificar si han pasado suficientes horas desde último mensaje entrante
      const ultimoEntrante = await this.repo.getUltimoMensajeEntrante(tenantId, conversacion_id);
      const ahora = Date.now();
      const tiempoEsperaMs = tiempo_espera_horas * 60 * 60 * 1000;

      if (ultimoEntrante && ahora - ultimoEntrante.getTime() < tiempoEsperaMs) {
        continue; // Aún no ha pasado suficiente tiempo
      }

      // Verificar ventana 24h Meta
      const dentroVentana = ultimoEntrante
        ? ahora - ultimoEntrante.getTime() < VENTANA_24H_MS
        : false;

      const mensajeRecordatorio =
        "Hola, ¿pudiste revisar nuestra respuesta anterior? Estamos aquí para ayudarte 😊";

      try {
        let wa_message_id: string | undefined;

        if (dentroVentana) {
          const result = await this.metaSender.sendTextMessage(tenantId, {
            wa_cuenta_id,
            celular_destino: celular,
            texto: mensajeRecordatorio,
          });
          wa_message_id = result.wa_message_id;
        } else {
          // Fuera de ventana — buscar plantilla APROBADA para recordatorio
          const plantillas = await this.repo.listPlantillas(tenantId);
          const plantillaAprobada = plantillas.find((p) => p.estado_meta === "APROBADA");
          if (!plantillaAprobada?.meta_template_name) {
            // Sin plantilla disponible, registrar intento fallido
            await this.repo.registrarEventoBot(tenantId, lead_id, conversacion_id, {
              accion: "SIN_PLANTILLA_APROBADA",
              intentos: intentos + 1,
            });
            continue;
          }
          const result = await this.metaSender.sendTemplateMessage(tenantId, {
            wa_cuenta_id,
            celular_destino: celular,
            template_name: plantillaAprobada.meta_template_name,
            variables: [],
          });
          wa_message_id = result.wa_message_id;
        }

        await this.repo.guardarMensaje(tenantId, {
          conversacion_id,
          wa_message_id,
          direccion: "SALIENTE",
          origen: "BOT",
          tipo: "TEXTO",
          contenido: mensajeRecordatorio,
          metadata: { recordatorio: true, intento: intentos + 1 },
        });

        await this.repo.registrarEventoBot(tenantId, lead_id, conversacion_id, {
          accion: "RECORDATORIO_ENVIADO",
          intentos: intentos + 1,
          dentro_ventana: dentroVentana,
        });

        procesados++;
      } catch (e) {
        console.error(`[recordatorio] Error enviando a lead ${lead_id}:`, e);
      }
    }

    return c.json({
      success: true,
      data: { procesados, derivados_sin_respuesta, total_candidatos: candidatos.length },
    });
  };
}
