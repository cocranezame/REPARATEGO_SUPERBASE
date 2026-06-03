import {
  asignarEtiquetasSchema,
  asignarVendedorConvSchema,
  asignarVendedorLeadSchema,
  cambiarModoSchema,
  createEtapaSchema,
  createEtiquetaSchema,
  createNotaSchema,
  createTransicionSchema,
  createWaCuentaSchema,
  enviarMensajeSchema,
  listConversacionesQuerySchema,
  listLeadsQuerySchema,
  listMensajesQuerySchema,
  moverEtapaSchema,
  updateEtapaSchema,
  updateEtiquetaSchema,
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
import { ConversacionesHandler } from "./handlers/conversaciones.handler.js";
import { EtapasHandler } from "./handlers/etapas.handler.js";
import { EtiquetasHandler } from "./handlers/etiquetas.handler.js";
import { LeadsHandler } from "./handlers/leads.handler.js";
import { WaCuentasHandler } from "./handlers/wa-cuentas.handler.js";
import { WebhookHandler } from "./handlers/webhook.handler.js";

const db = getDb();
const repo = new CrmDrizzleRepository(db);
const metaSender = new MetaSenderService(db);

const agentEngine = new AgentEngine(repo, metaSender);
const webhookH = new WebhookHandler(repo, agentEngine);

const waCuentasH = new WaCuentasHandler(repo);
const etapasH = new EtapasHandler(repo);
const etiquetasH = new EtiquetasHandler(repo);
const leadsH = new LeadsHandler(repo);
const conversacionesH = new ConversacionesHandler(repo, metaSender);

export const crmRoutes = new Hono<{ Variables: HonoVariables }>();

crmRoutes.get("/crm/health", (c) => c.json({ status: "ok" }));

// Webhook Meta — NO requiere authMiddleware (verificación HMAC propia)
crmRoutes.get("/crm/webhook", webhookH.verify);
crmRoutes.post("/crm/webhook", webhookH.handle);

crmRoutes.use("/crm/*", authMiddleware);

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
