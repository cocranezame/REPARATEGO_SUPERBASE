# Módulo: CRM + Agente IA (Nico) — API Endpoints

> Referencia: C005 (2026-06-02), incluye C001 (UTM + métricas)
> Base path: /crm
> Auth: JWT requerido en todos excepto webhook

## Webhook Meta WhatsApp

GET /crm/webhook
  → recibe: query params { hub.mode, hub.verify_token, hub.challenge }
  → retorna: challenge (texto plano)
  → permiso: público (verificación de Meta)
  → regla: valida hub.verify_token contra wa_cuenta.webhook_verify_token

POST /crm/webhook
  → recibe: body completo de Meta con mensajes
  → retorna: 200 OK (siempre, para no reintentos de Meta)
  → permiso: público (validado por HMAC)
  → reglas:
    - Validación HMAC timing-safe obligatoria. Si falla → 403
    - Idempotencia por wa_message_id: si ya existe → ignorar duplicado
    - Ruteo por phone_number_id → identifica wa_cuenta → negocio
    - Mensaje se guarda ANTES de procesar con agente
    - Si no existe conversación activa con ese celular → crear conversación + lead nuevo
    - Si conversación en modo VENDEDOR → notificar vendedor, Nico NO interviene
    - Si conversación en modo NICO → invocar motor de agentes
    - Captura automática de UTM si la URL de origen contiene parámetros (C001)

## Health check

GET /crm/health
  → retorna: { status: "ok" }
  → permiso: público

## Cuentas WhatsApp

GET /crm/wa-cuentas
  → retorna: { lista de cuentas SIN tokens ni access_token_encrypted }
  → permiso: [ADMINISTRADOR]

POST /crm/wa-cuentas
  → recibe: { phone_number_id, waba_id, access_token, webhook_verify_token, nombre, negocio_nombre }
  → retorna: { wa_cuenta_id, nombre, phone_number_id }
  → permiso: [ADMINISTRADOR]
  → regla: access_token se encripta con pgcrypto antes de guardar

PUT /crm/wa-cuentas/:id
  → recibe: { campos a actualizar (si incluye access_token, se re-encripta) }
  → retorna: { cuenta actualizada sin tokens }
  → permiso: [ADMINISTRADOR]

DELETE /crm/wa-cuentas/:id
  → retorna: { confirmación soft delete }
  → permiso: [ADMINISTRADOR]

## Etapas del pipeline (configurables)

GET /crm/etapas
  → retorna: { etapas ordenadas con objetivo, operador, color, conteo de leads por etapa, bot vinculado si aplica }
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /crm/etapas
  → recibe: { nombre, codigo, orden, objetivo, operador (IA|BOT|HUMANO|SISTEMA), bot_id (si BOT), tiempo_espera_horas, max_intentos_recordatorio, color }
  → retorna: { etapa creada }
  → permiso: [ADMINISTRADOR]

PUT /crm/etapas/:id
  → recibe: { campos a actualizar (nombre, objetivo, operador, bot_id, tiempo_espera_horas, color, etc.) }
  → retorna: { etapa actualizada }
  → permiso: [ADMINISTRADOR]

DELETE /crm/etapas/:id
  → retorna: { confirmación soft delete }
  → permiso: [ADMINISTRADOR]
  → regla: no se puede eliminar etapa que tenga leads activos

## Transiciones de etapas

GET /crm/etapas/:id/transiciones
  → retorna: { etapas destino permitidas desde esta etapa }
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /crm/etapas/:id/transiciones
  → recibe: { etapa_destino_id }
  → retorna: { transición creada }
  → permiso: [ADMINISTRADOR]

DELETE /crm/etapas/:id/transiciones/:destino_id
  → retorna: { confirmación }
  → permiso: [ADMINISTRADOR]

## Etiquetas (configurables)

GET /crm/etiquetas
  → retorna: { etiquetas agrupadas por grupo }
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /crm/etiquetas
  → recibe: { nombre, codigo, grupo (IDENTIFICACION|RUTA_ACTIVA|CAPTURA_DATOS|ESTADO_OPERATIVO), descripcion }
  → retorna: { etiqueta creada }
  → permiso: [ADMINISTRADOR]

PUT /crm/etiquetas/:id
  → recibe: { campos a actualizar }
  → retorna: { etiqueta actualizada }
  → permiso: [ADMINISTRADOR]

DELETE /crm/etiquetas/:id
  → retorna: { confirmación soft delete }
  → permiso: [ADMINISTRADOR]

## Leads

GET /crm/leads
  → query params: { etapa_id, etiqueta_id, vendedor_id, fecha_desde, fecha_hasta, utm_source, utm_campaign, activo, page, limit }
  → retorna: { leads paginados con etapa, etiquetas, último mensaje, vendedor asignado }
  → permiso: [VENDEDOR, ADMINISTRADOR]

GET /crm/leads/:id
  → retorna: { lead completo: datos capturados, etapa, etiquetas, conversación, notas, servicios vinculados (vía cliente_id), historial de etapas transitadas, UTM }
  → permiso: [VENDEDOR, ADMINISTRADOR]

PUT /crm/leads/:id/etapa
  → recibe: { etapa_id }
  → retorna: { lead actualizado con nueva etapa }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: valida transiciones permitidas en crm_etapa_transicion. Excepción: DERIVACION_VENDEDOR puede mover a cualquier etapa. Registra evento ETAPA_CAMBIADA.

PUT /crm/leads/:id/etiquetas
  → recibe: { etiqueta_ids[], asignado_por (VENDEDOR) }
  → retorna: { lead actualizado con etiquetas }
  → permiso: [VENDEDOR, ADMINISTRADOR]

PUT /crm/leads/:id/vendedor
  → recibe: { vendedor_id }
  → retorna: { lead actualizado }
  → permiso: [ADMINISTRADOR]
  → regla: round-robin por sucursal como default si no se especifica vendedor

POST /crm/leads/:id/nota
  → recibe: { contenido }
  → retorna: { nota creada con origen VENDEDOR }
  → permiso: [VENDEDOR, ADMINISTRADOR]

## Conversaciones

GET /crm/conversaciones
  → query params: { etapa_id, etiqueta_id, vendedor_id, modo (NICO|VENDEDOR), estado (ACTIVA|CERRADA), page, limit }
  → retorna: { conversaciones paginadas con lead, último mensaje, mensajes_sin_leer, ordenadas por ultimo_mensaje_at DESC }
  → permiso: [VENDEDOR, ADMINISTRADOR]

GET /crm/conversaciones/:id
  → retorna: { conversación con lead completo, mensajes (paginados), notas }
  → permiso: [VENDEDOR, ADMINISTRADOR]

GET /crm/conversaciones/:id/mensajes
  → query params: { page, limit, antes_de (cursor temporal) }
  → retorna: { mensajes paginados en orden cronológico }
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /crm/conversaciones/:id/mensaje
  → recibe: { texto }
  → retorna: { mensaje enviado vía Meta API, guardado en BD }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → reglas:
    - Usa credenciales de wa_cuenta para enviar vía Meta Cloud API
    - Respeta ventana 24h de Meta. Fuera de ventana solo plantillas HSM
    - Al enviar primer mensaje de vendedor, modo cambia automáticamente a VENDEDOR
    - Nico se pausa en esta conversación

PUT /crm/conversaciones/:id/modo
  → recibe: { modo: "NICO" | "VENDEDOR" }
  → retorna: { conversación actualizada }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: al cambiar a NICO, vendedor devuelve control. Al cambiar a VENDEDOR, Nico se pausa.

PUT /crm/conversaciones/:id/asignar
  → recibe: { vendedor_id }
  → retorna: { conversación actualizada }
  → permiso: [ADMINISTRADOR]

## Agentes

GET /crm/agentes
  → retorna: { lista de agentes con config (nombre, canal, modelo, tono, activo) }
  → permiso: [ADMINISTRADOR]

PUT /crm/agentes/:id
  → recibe: { campos a actualizar (tono, prompt_base, max_mensajes_contexto, activo) }
  → retorna: { agente actualizado }
  → permiso: [ADMINISTRADOR]

GET /crm/agentes/:id/acciones
  → query params: { fecha_desde, fecha_hasta, tool_name, exitoso, page, limit }
  → retorna: { acciones paginadas con tool, input, output, duración, error }
  → permiso: [ADMINISTRADOR]

## Motor de agentes (interno, no expuesto como endpoint REST)

El motor se invoca internamente desde el webhook handler:
1. Selecciona agente activo para el canal (WhatsApp → Nico)
2. Context builder: comprime etiquetas del lead + últimos N mensajes + datos capturados + objetivo de etapa actual
3. Llama Claude Haiku con context + tools disponibles
4. Si respuesta contiene tool_use → ejecuta tools secuencialmente, loguea en crm_accion_agente
5. Texto de respuesta se envía al cliente vía Meta API
6. Respuesta saliente se guarda como crm_mensaje con origen AGENTE

Tools disponibles para Nico:
- guardarDato({ campo, valor }) → actualiza crm_lead + asigna etiqueta
- moverEtapa({ etapa_destino_codigo }) → valida transición, mueve lead, registra evento
- buscarCliente({ numero_doc?, celular? }) → lee de tabla cliente
- crearCliente({ nombre, numero_doc, celular, tipo_documento }) → escribe en tabla cliente, vincula lead
- crearServicio({ falla_ingreso, categoria_id?, canal }) → crea instancia + orden_servicio. Requiere confirmación del cliente antes de ejecutar
- derivarVendedor({ motivo }) → cambia modo a VENDEDOR, genera evento, notifica vendedor
- enviarLink({ tipo, referencia_id? }) → envía URL sucursal o seguimiento orden
- consultarRepuesto({ busqueda, categoria_id? }) → lee producto + lote para stock y precio. Solo lectura.

## Plantillas

GET /crm/plantillas
  → retorna: { lista de plantillas con estado Meta }
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /crm/plantillas
  → recibe: { nombre, contenido, variables, meta_template_name }
  → retorna: { plantilla creada }
  → permiso: [ADMINISTRADOR]

PUT /crm/plantillas/:id
  → recibe: { campos a actualizar }
  → retorna: { plantilla actualizada }
  → permiso: [ADMINISTRADOR]

POST /crm/plantillas/:id/enviar
  → recibe: { conversacion_id, variables_valores }
  → retorna: { mensaje enviado vía plantilla HSM }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: solo plantillas con estado_meta=APROBADA

## Bots

GET /crm/bots
  → retorna: { lista de bots con estado y tipo }
  → permiso: [ADMINISTRADOR]

PUT /crm/bots/:id
  → recibe: { activo, config (JSONB con pasos del flujo), nombre }
  → retorna: { bot actualizado }
  → permiso: [ADMINISTRADOR]

GET /crm/bots/:id/config
  → retorna: { config detallada del bot con pasos }
  → permiso: [ADMINISTRADOR]

## Eventos

GET /crm/eventos
  → query params: { tipo, origen, lead_id, fecha_desde, fecha_hasta, page, limit }
  → retorna: { eventos paginados }
  → permiso: [ADMINISTRADOR]

## Mensajería interna

GET /crm/mensajeria
  → query params: { page, limit }
  → retorna: { conversaciones internas del usuario autenticado, ordenadas por último mensaje }
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

GET /crm/mensajeria/:usuario_id
  → retorna: { mensajes entre usuario autenticado y usuario_id, paginados }
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

POST /crm/mensajeria
  → recibe: { destinatario_id, contenido }
  → retorna: { mensaje_interno creado }
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

PUT /crm/mensajeria/:mensaje_id/leer
  → retorna: { leido: true }
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]
  → regla: solo el destinatario puede marcar como leído

## Métricas (C001 + C005)

GET /crm/metricas/dashboard
  → query params: { from (ISO date), to (ISO date) }
  → retorna: { leads_activos, leads_por_etapa (array con conteo), tasa_conversion (leads convertidos / total), tiempo_promedio_respuesta_minutos, total_leads_periodo, leads_por_canal_utm }
  → permiso: [ADMINISTRADOR]

GET /crm/metricas/nico
  → query params: { from (ISO date), to (ISO date) }
  → retorna: { mensajes_procesados, tools_usadas (conteo por tool), tasa_exito (tools exitosas / total), tiempo_promedio_respuesta_ms, errores (conteo y tipos) }
  → permiso: [ADMINISTRADOR]

GET /crm/metricas/leads
  → query params: { from (ISO date), to (ISO date) }
  → retorna: { array: id, fecha, estado (etapa actual), convertido (boolean), dias_para_convertir, utm_source, utm_campaign, utm_medium }
  → permiso: [ADMINISTRADOR, VENDEDOR]
  → nota: endpoint de C001

GET /crm/metricas/clientes
  → query params: { from (ISO date), to (ISO date) }
  → retorna: { ticket_promedio, frecuencia_compra, ultima_compra, riesgo_abandono (clientes sin compra 60+ días) }
  → permiso: [ADMINISTRADOR]
  → nota: endpoint de C001, cruza crm_lead + cliente + venta

GET /crm/metricas/ventas
  → query params: { from (ISO date), to (ISO date) }
  → retorna: { ingresos_brutos, total_transacciones, top_productos (top 10), ingresos_por_canal (TIENDA/DOMICILIO/WHATSAPP) }
  → permiso: [ADMINISTRADOR]
  → nota: endpoint de C001, cruza venta + venta_item + orden_servicio

GET /crm/audiences
  → retorna: { array: id, nombre, criterio, total_contactos }
  → permiso: [ADMINISTRADOR]
  → nota: endpoint de C001, audiencias dinámicas por filtros sobre crm_lead + crm_lead_etiqueta + cliente
