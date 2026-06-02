# Épica 13 — CRM + Agente IA (Nico)

> Referencia: C005 (2026-06-02), incluye C001 (UTM)
> Estado: TODO
> Branch: epic/E13-crm
> 35 tickets / 7 sub-épicas

## Sub-épica 13A: Backend base — Migraciones, schemas, seed data (T1-T4)

- E13.1 — Migración: 15 tablas CRM (wa_cuenta, crm_etapa, crm_etapa_transicion, crm_etiqueta, crm_lead, crm_lead_etiqueta, crm_conversacion, crm_mensaje, crm_nota, crm_agente, crm_accion_agente, crm_plantilla, crm_bot, crm_evento, crm_mensaje_interno). Incluir campos UTM de C001. Aplicar RLS — estado: TODO
- E13.2 — Schema Drizzle + Validators Zod para todas las tablas CRM. Enums compartidos en @kallpasoft/shared — estado: TODO
- E13.3 — Seed data: 15 etapas con operador/objetivo, transiciones dirigidas, 19 etiquetas en 4 grupos, agente Nico (claude-haiku), 3 bots iniciales (COTIZACION_REPUESTO, SERVICIO_PROCESO, RECORDATORIO) — estado: TODO
- E13.4 — API CRUD wa_cuenta con encriptación pgcrypto (GET sin tokens, POST/PUT encripta access_token) — estado: TODO

## Sub-épica 13B: Pipeline, leads y etiquetas (T5-T9)

- E13.5 — API CRUD etapas configurables (nombre, operador, objetivo, color, bot_id editables) + CRUD transiciones (agregar/quitar destinos permitidos) — estado: TODO
- E13.6 — API CRUD etiquetas configurables (nombre, código, grupo, descripción) — estado: TODO
- E13.7 — API leads: GET listado paginado con filtros (etapa, etiqueta, vendedor, UTM, fecha), GET detalle completo, PUT etapa (valida transiciones), PUT etiquetas, PUT vendedor (round-robin default), POST nota — estado: TODO
- E13.8 — API conversaciones: GET listado paginado con filtros (etapa, modo, estado), GET detalle con mensajes paginados, PUT modo (NICO/VENDEDOR), PUT asignar vendedor — estado: TODO
- E13.9 — API envío mensaje humano: POST conversaciones/:id/mensaje (envía vía Meta API, respeta ventana 24h, cambia modo a VENDEDOR al primer envío) — estado: TODO

## Sub-épica 13C: Webhook y motor de agentes — Nico (T10-T15)

- E13.10 — Webhook Meta: GET verificación (hub.challenge), POST recepción (HMAC timing-safe, idempotencia wa_message_id, ruteo por phone_number_id, crear conversación+lead si nuevo contacto, captura UTM automática) — estado: TODO
- E13.11 — Motor de agentes: selección agente por canal, context builder (etiquetas + últimos N mensajes + datos lead + objetivo etapa), llamada Claude Haiku con tools, ejecución secuencial de tool_use, logueo en crm_accion_agente — estado: TODO
- E13.12 — Tool guardarDato: actualiza campos crm_lead (nombre, equipo_descripcion, falla_descripcion, ubicacion) + asigna etiqueta correspondiente automáticamente — estado: TODO
- E13.13 — Tool moverEtapa: valida transiciones permitidas, mueve lead, registra evento ETAPA_CAMBIADA — estado: TODO
- E13.14 — Tools de integración: buscarCliente (lee cliente por doc/celular), crearCliente (escribe en tabla cliente, vincula lead), crearServicio (crea instancia + orden_servicio, requiere confirmación cliente), consultarRepuesto (lee producto + lote, solo lectura) — estado: TODO
- E13.15 — Tools de comunicación: derivarVendedor (cambia modo VENDEDOR, genera evento, notifica), enviarLink (URL sucursal o seguimiento orden) — estado: TODO

## Sub-épica 13D: Bots y plantillas (T16-T19)

- E13.16 — API CRUD plantillas (nombre, contenido, variables, meta_template_name, estado_meta). POST enviar plantilla HSM (solo APROBADA, fuera ventana 24h) — estado: TODO
- E13.17 — API CRUD bots (nombre, código, tipo, config JSONB, activo). GET config detallada — estado: TODO
- E13.18 — Motor bot COTIZACION_REPUESTO: flujo guiado categoría → componente → buscar precio → mostrar resultado. Se activa cuando etapa tiene operador=BOT con bot_id correspondiente — estado: TODO
- E13.19 — Motor bot SERVICIO_PROCESO: pide documento → busca servicios activos → muestra estado — estado: TODO
- E13.20 — Motor bot RECORDATORIO: envía mensaje predefinido → espera respuesta → reintenta hasta max_intentos → marca SIN_RESPUESTA. Respeta ventana 24h (usa plantilla HSM si cerrada) — estado: TODO

## Sub-épica 13E: Métricas, eventos y mensajería interna (T21-T25)

- E13.21 — API métricas dashboard: leads activos, por etapa, tasa conversión, tiempo promedio respuesta, leads por canal UTM — estado: TODO
- E13.22 — API métricas Nico: mensajes procesados, tools usadas, tasa éxito, tiempo promedio, errores — estado: TODO
- E13.23 — API métricas C001: GET /crm/metricas/leads (con UTM), GET /crm/metricas/clientes (ticket promedio, frecuencia, riesgo abandono), GET /crm/metricas/ventas (ingresos, top productos, por canal), GET /crm/audiences — estado: TODO
- E13.24 — API eventos: GET listado paginado con filtros (tipo, origen, lead, fecha). Registro automático de eventos desde motor agentes, webhook, bots — estado: TODO
- E13.25 — API mensajería interna: GET conversaciones del usuario, GET mensajes con otro usuario, POST enviar mensaje, PUT marcar leído — estado: TODO

## Sub-épica 13F: Web — Inbox, chat y kanban (T26-T30)

- E13.26 — Hooks TanStack Query para todos los endpoints CRM — estado: TODO
- E13.27 — Bandeja de conversaciones (inbox): lista con avatar, preview mensaje, etapa badge, modo ícono, mensajes sin leer, filtros laterales — estado: TODO
- E13.28 — Chat en vivo: burbujas estilo WhatsApp (cliente/Nico/vendedor/sistema), input mensaje, indicador ventana 24h, selector plantilla HSM. Panel lateral ficha rápida del lead. Acciones: derivar, devolver a Nico, cambiar etapa, asignar vendedor, enviar plantilla, cerrar — estado: TODO
- E13.29 — Kanban de leads: 15 columnas con cards (nombre, última actividad, etiquetas, vendedor, UTM). Drag & drop con validación transiciones. Filtros por etiqueta, vendedor, fecha, UTM. Color borde por tiempo sin actividad — estado: TODO
- E13.30 — Ficha de lead: 5 tabs (información, conversación con notas, etiquetas toggle, servicios vinculados, timeline de etapas) — estado: TODO

## Sub-épica 13G: Web — Dashboard, configuración y mensajería (T31-T35)

- E13.31 — Dashboard CRM: KPIs (leads activos, conversión, tiempo respuesta, nuevos hoy). Gráficas (por etapa, embudo, por UTM, por período). Rendimiento Nico (mensajes, tools, éxito, errores). Comparativo por período — estado: TODO
- E13.32 — Config agentes: lista con toggle activo, detalle editable (nombre, modelo, tono, prompt base, max contexto), log de acciones con filtros — estado: TODO
- E13.33 — Config etapas + transiciones: lista ordenable drag & drop, formulario crear/editar (nombre, operador, objetivo, bot, tiempo espera, color), gestión transiciones por checkboxes. Config etiquetas: lista por grupo, formulario crear/editar. Config cuentas WhatsApp: lista, formulario alta/edición con campo password para token — estado: TODO
- E13.34 — Config plantillas + bots: plantillas (lista, crear/editar con preview variables, estado Meta). Bots (lista con toggle, editor config JSONB o formulario visual por tipo) — estado: TODO
- E13.35 — Mensajería interna: panel contactos/conversaciones, chat entre empleados, indicador sin leer, buscador empleados — estado: TODO

## Dependencias

- Requiere completado: E1 (seguridad/roles), E2 (catálogos), E3 (clientes), E4 (inventario/productos), E10 (servicios C002)
- Requiere parcial: E11 (ventas C003, para métricas de ventas C001)
- Externos: Meta WhatsApp Cloud API, Anthropic Claude API (Haiku), pgcrypto
- Alimenta: E14 (dashboard — métricas CRM), E10 (servicios — lead_id en orden_servicio)
