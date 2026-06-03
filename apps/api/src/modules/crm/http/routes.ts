import {
  asignarEtiquetasSchema,
  asignarVendedorConvSchema,
  asignarVendedorLeadSchema,
  cambiarModoSchema,
  createEtapaSchema,
  createEtiquetaSchema,
  createMensajeInternoSchema,
  createNotaSchema,
  createPlantillaSchema,
  createTransicionSchema,
  createWaCuentaSchema,
  enviarMensajeSchema,
  enviarPlantillaSchema,
  listAccionesAgenteQuerySchema,
  listConversacionesQuerySchema,
  listEventosQuerySchema,
  listLeadsQuerySchema,
  listMensajesInternosQuerySchema,
  listMensajesQuerySchema,
  metricasQuerySchema,
  moverEtapaSchema,
  updateAgenteSchema,
  updateBotSchema,
  updateEtapaSchema,
  updateEtiquetaSchema,
  updatePlantillaSchema,
  updateWaCuentaSchema,
} from "@kallpasoft/validators";
import { Hono } from "hono";
import { getDb } from "../../../lib/db.js";
import { authMiddleware } from "../../../middlewares/auth.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validateBody, validateQuery } from "../../../middlewares/validate.js";
import type { HonoVariables } from "../../../types/context.js";
import { CrmDrizzleRepository } from "../infra/repositories/crm.drizzle.js";
import { MetaSenderService } from "../infra/services/meta-sender.js";
import { AgentEngine } from "../services/agent-engine.js";
import { BotEngine } from "../services/bot-engine.js";
import { AgentesHandler } from "./handlers/agentes.handler.js";
import { BotsHandler } from "./handlers/bots.handler.js";
import { ConversacionesHandler } from "./handlers/conversaciones.handler.js";
import { EtapasHandler } from "./handlers/etapas.handler.js";
import { EtiquetasHandler } from "./handlers/etiquetas.handler.js";
import { EventosHandler } from "./handlers/eventos.handler.js";
import { LeadsHandler } from "./handlers/leads.handler.js";
import { MensajeriaHandler } from "./handlers/mensajeria.handler.js";
import { MetricasHandler } from "./handlers/metricas.handler.js";
import { PlantillasHandler } from "./handlers/plantillas.handler.js";
import { WaCuentasHandler } from "./handlers/wa-cuentas.handler.js";
import { WebhookHandler } from "./handlers/webhook.handler.js";

const db = getDb();
const repo = new CrmDrizzleRepository(db);
const metaSender = new MetaSenderService(db);

const agentEngine = new AgentEngine(repo, metaSender);
const botEngine = new BotEngine(repo, metaSender);
const webhookH = new WebhookHandler(repo, agentEngine, botEngine);

const waCuentasH = new WaCuentasHandler(repo);
const etapasH = new EtapasHandler(repo);
const etiquetasH = new EtiquetasHandler(repo);
const leadsH = new LeadsHandler(repo);
const conversacionesH = new ConversacionesHandler(repo, metaSender);
const plantillasH = new PlantillasHandler(repo, metaSender);
const botsH = new BotsHandler(repo, metaSender);
const agentesH = new AgentesHandler(repo);
const eventosH = new EventosHandler(repo);
const mensajeriaH = new MensajeriaHandler(repo);
const metricasH = new MetricasHandler(repo);

export const crmRoutes = new Hono<{ Variables: HonoVariables }>();

crmRoutes.get("/crm/health", (c) => c.json({ status: "ok" }));

// Webhook Meta — NO requiere authMiddleware (verificación HMAC propia)
crmRoutes.get("/crm/webhook", webhookH.verify);
crmRoutes.post("/crm/webhook", webhookH.handle);

crmRoutes.use("/crm/*", authMiddleware);

// ─── WA Cuentas ───────────────────────────────────────────────────────────────
crmRoutes.get("/crm/wa-cuentas", authorize("ADMIN"), waCuentasH.list);
crmRoutes.post(
  "/crm/wa-cuentas",
  authorize("ADMIN"),
  validateBody(createWaCuentaSchema),
  waCuentasH.create
);
crmRoutes.put(
  "/crm/wa-cuentas/:id",
  authorize("ADMIN"),
  validateBody(updateWaCuentaSchema),
  waCuentasH.update
);
crmRoutes.delete("/crm/wa-cuentas/:id", authorize("ADMIN"), waCuentasH.remove);

// ─── Etapas ───────────────────────────────────────────────────────────────────
crmRoutes.get("/crm/etapas", authorize("VENDEDOR", "ADMIN"), etapasH.list);
crmRoutes.post("/crm/etapas", authorize("ADMIN"), validateBody(createEtapaSchema), etapasH.create);
crmRoutes.put(
  "/crm/etapas/:id",
  authorize("ADMIN"),
  validateBody(updateEtapaSchema),
  etapasH.update
);
crmRoutes.delete("/crm/etapas/:id", authorize("ADMIN"), etapasH.remove);

crmRoutes.get(
  "/crm/etapas/:id/transiciones",
  authorize("VENDEDOR", "ADMIN"),
  etapasH.listTransiciones
);
crmRoutes.post(
  "/crm/etapas/:id/transiciones",
  authorize("ADMIN"),
  validateBody(createTransicionSchema),
  etapasH.createTransicion
);
crmRoutes.delete(
  "/crm/etapas/:id/transiciones/:destino_id",
  authorize("ADMIN"),
  etapasH.deleteTransicion
);

// ─── Etiquetas ────────────────────────────────────────────────────────────────
crmRoutes.get("/crm/etiquetas", authorize("VENDEDOR", "ADMIN"), etiquetasH.list);
crmRoutes.post(
  "/crm/etiquetas",
  authorize("ADMIN"),
  validateBody(createEtiquetaSchema),
  etiquetasH.create
);
crmRoutes.put(
  "/crm/etiquetas/:id",
  authorize("ADMIN"),
  validateBody(updateEtiquetaSchema),
  etiquetasH.update
);
crmRoutes.delete("/crm/etiquetas/:id", authorize("ADMIN"), etiquetasH.remove);

// ─── Leads ────────────────────────────────────────────────────────────────────
crmRoutes.get(
  "/crm/leads",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listLeadsQuerySchema),
  leadsH.list
);
crmRoutes.get("/crm/leads/:id", authorize("VENDEDOR", "ADMIN"), leadsH.findById);
crmRoutes.put(
  "/crm/leads/:id/etapa",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(moverEtapaSchema),
  leadsH.moverEtapa
);
crmRoutes.put(
  "/crm/leads/:id/etiquetas",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(asignarEtiquetasSchema),
  leadsH.asignarEtiquetas
);
crmRoutes.put(
  "/crm/leads/:id/vendedor",
  authorize("ADMIN"),
  validateBody(asignarVendedorLeadSchema),
  leadsH.asignarVendedor
);
crmRoutes.post(
  "/crm/leads/:id/nota",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(createNotaSchema),
  leadsH.createNota
);

// ─── Conversaciones ───────────────────────────────────────────────────────────
crmRoutes.get(
  "/crm/conversaciones",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listConversacionesQuerySchema),
  conversacionesH.list
);
crmRoutes.get("/crm/conversaciones/:id", authorize("VENDEDOR", "ADMIN"), conversacionesH.findById);
crmRoutes.get(
  "/crm/conversaciones/:id/mensajes",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(listMensajesQuerySchema),
  conversacionesH.listMensajes
);
crmRoutes.post(
  "/crm/conversaciones/:id/mensaje",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(enviarMensajeSchema),
  conversacionesH.enviarMensaje
);
crmRoutes.put(
  "/crm/conversaciones/:id/modo",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(cambiarModoSchema),
  conversacionesH.cambiarModo
);
crmRoutes.put(
  "/crm/conversaciones/:id/asignar",
  authorize("ADMIN"),
  validateBody(asignarVendedorConvSchema),
  conversacionesH.asignarVendedor
);

// ─── Plantillas HSM ───────────────────────────────────────────────────────────
crmRoutes.get("/crm/plantillas", authorize("VENDEDOR", "ADMIN"), plantillasH.list);
crmRoutes.post(
  "/crm/plantillas",
  authorize("ADMIN"),
  validateBody(createPlantillaSchema),
  plantillasH.create
);
crmRoutes.put(
  "/crm/plantillas/:id",
  authorize("ADMIN"),
  validateBody(updatePlantillaSchema),
  plantillasH.update
);
crmRoutes.post(
  "/crm/plantillas/:id/enviar",
  authorize("VENDEDOR", "ADMIN"),
  validateBody(enviarPlantillaSchema),
  plantillasH.enviar
);

// ─── Bots ─────────────────────────────────────────────────────────────────────
crmRoutes.get("/crm/bots", authorize("ADMIN"), botsH.list);
crmRoutes.put("/crm/bots/:id", authorize("ADMIN"), validateBody(updateBotSchema), botsH.update);
crmRoutes.get("/crm/bots/:id/config", authorize("ADMIN"), botsH.findConfig);
// Endpoint especial para ejecutar el bot recordatorio (cron/manual)
crmRoutes.post("/crm/bots/recordatorio/ejecutar", authorize("ADMIN"), botsH.ejecutarRecordatorio);

// ─── Agentes ──────────────────────────────────────────────────────────────────
crmRoutes.get("/crm/agentes", authorize("ADMIN"), agentesH.list);
crmRoutes.put(
  "/crm/agentes/:id",
  authorize("ADMIN"),
  validateBody(updateAgenteSchema),
  agentesH.update
);
crmRoutes.get(
  "/crm/agentes/:id/acciones",
  authorize("ADMIN"),
  validateQuery(listAccionesAgenteQuerySchema),
  agentesH.listAcciones
);

// ─── Eventos ──────────────────────────────────────────────────────────────────
crmRoutes.get(
  "/crm/eventos",
  authorize("ADMIN"),
  validateQuery(listEventosQuerySchema),
  eventosH.list
);

// ─── Mensajería interna ───────────────────────────────────────────────────────
crmRoutes.get(
  "/crm/mensajeria",
  authorize("VENDEDOR", "TECNICO", "ADMIN"),
  validateQuery(listMensajesInternosQuerySchema),
  mensajeriaH.listConversaciones
);
crmRoutes.get(
  "/crm/mensajeria/:usuario_id",
  authorize("VENDEDOR", "TECNICO", "ADMIN"),
  validateQuery(listMensajesInternosQuerySchema),
  mensajeriaH.listMensajes
);
crmRoutes.post(
  "/crm/mensajeria",
  authorize("VENDEDOR", "TECNICO", "ADMIN"),
  validateBody(createMensajeInternoSchema),
  mensajeriaH.sendMensaje
);
crmRoutes.put(
  "/crm/mensajeria/:mensaje_id/leer",
  authorize("VENDEDOR", "TECNICO", "ADMIN"),
  mensajeriaH.marcarLeido
);

// ─── Métricas ─────────────────────────────────────────────────────────────────
crmRoutes.get(
  "/crm/metricas/dashboard",
  authorize("ADMIN"),
  validateQuery(metricasQuerySchema),
  metricasH.dashboard
);
crmRoutes.get(
  "/crm/metricas/nico",
  authorize("ADMIN"),
  validateQuery(metricasQuerySchema),
  metricasH.nico
);
crmRoutes.get(
  "/crm/metricas/leads",
  authorize("VENDEDOR", "ADMIN"),
  validateQuery(metricasQuerySchema),
  metricasH.leads
);
crmRoutes.get(
  "/crm/metricas/clientes",
  authorize("ADMIN"),
  validateQuery(metricasQuerySchema),
  metricasH.clientes
);
crmRoutes.get(
  "/crm/metricas/ventas",
  authorize("ADMIN"),
  validateQuery(metricasQuerySchema),
  metricasH.ventas
);
crmRoutes.get("/crm/audiences", authorize("ADMIN"), metricasH.audiencias);
