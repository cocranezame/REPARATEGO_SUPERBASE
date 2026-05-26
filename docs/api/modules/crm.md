# API — CRM + Agente IA (Nico)

> Endpoints del CRM, WhatsApp, agente IA y mensajería interna.
> Épica: E13

## Cuentas WhatsApp

### GET /api/v1/crm/wa-cuentas
### POST /api/v1/crm/wa-cuentas
- Body: `{ phone_number_id, waba_id, token, nombre }`
- Token se cifra con pgcrypto antes de guardar

### PUT /api/v1/crm/wa-cuentas/:id
### DELETE /api/v1/crm/wa-cuentas/:id

## Webhook WhatsApp

### GET /api/v1/webhook/whatsapp
- Verificación de webhook (challenge de Meta)

### POST /api/v1/webhook/whatsapp
- Recibe mensajes entrantes de Meta
- Crea/actualiza conversación y mensaje
- Si hay bot activo con trigger, responde automáticamente
- Si agente Nico activo, procesa con LLM

## Etapas del pipeline

### GET /api/v1/crm/etapas
### POST /api/v1/crm/etapas
- Body: `{ nombre, orden, color? }`
### PUT /api/v1/crm/etapas/:id
### DELETE /api/v1/crm/etapas/:id

### GET /api/v1/crm/etapas/transiciones
### POST /api/v1/crm/etapas/transiciones
- Body: `{ etapa_origen_id, etapa_destino_id }`
### DELETE /api/v1/crm/etapas/transiciones/:id

## Etiquetas

### GET /api/v1/crm/etiquetas
### POST /api/v1/crm/etiquetas
### PUT /api/v1/crm/etiquetas/:id
### DELETE /api/v1/crm/etiquetas/:id

## Leads

### GET /api/v1/crm/leads
- Query: `?etapa_id=&asignado_a=&origen=&search=&page=1&pageSize=20`

### POST /api/v1/crm/leads
- Body: `{ nombre, telefono?, email?, etapa_id, asignado_a?, origen?, valor_estimado?, notas?, etiqueta_ids? }`

### GET /api/v1/crm/leads/:id
### PUT /api/v1/crm/leads/:id
### PUT /api/v1/crm/leads/:id/etapa
- Body: `{ etapa_id }` — valida transición

### PUT /api/v1/crm/leads/:id/etiquetas
- Body: `{ etiqueta_ids: UUID[] }` — sync

## Conversaciones

### GET /api/v1/crm/conversaciones
- Query: `?estado=&asignado_a=&canal=&page=1&pageSize=20`

### GET /api/v1/crm/conversaciones/:id
- Incluye mensajes paginados

## Mensajes

### POST /api/v1/crm/mensajes
- Body: `{ conversacion_id, contenido?, tipo, media_url? }`
- Envía por WhatsApp si canal=WHATSAPP

### POST /api/v1/crm/mensajes/plantilla
- Body: `{ conversacion_id, plantilla_id, variables: string[] }`

## Plantillas WhatsApp

### GET /api/v1/crm/plantillas
### POST /api/v1/crm/plantillas
### PUT /api/v1/crm/plantillas/:id
### DELETE /api/v1/crm/plantillas/:id

## Bots

### GET /api/v1/crm/bots
### POST /api/v1/crm/bots
- Body: `{ nombre, trigger_tipo, trigger_valor?, respuesta }`
### PUT /api/v1/crm/bots/:id
### DELETE /api/v1/crm/bots/:id

## Agente Nico

### GET /api/v1/crm/agente
### PUT /api/v1/crm/agente
- Body: `{ nombre_agente?, personalidad?, tools_habilitados?, modelo_llm?, activo }`

### GET /api/v1/crm/agente/eventos
- Query: `?conversacion_id=&tipo_evento=&desde=&hasta=&page=1&pageSize=20`

## Mensajería interna

### GET /api/v1/crm/mensajes-internos
- Query: `?leido=false`

### POST /api/v1/crm/mensajes-internos
- Body: `{ para_usuario_id, contenido, referencia_tipo?, referencia_id? }`

### PUT /api/v1/crm/mensajes-internos/:id/leer
