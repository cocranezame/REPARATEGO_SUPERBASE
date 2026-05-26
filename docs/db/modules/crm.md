# DB — CRM + Agente IA (Nico)

> Tablas del módulo CRM con integración WhatsApp y agente IA.
> Épica: E13
> 15 tablas en total.

## Tablas principales

### wa_cuenta

Cuenta de WhatsApp Business conectada.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| phone_number_id | VARCHAR(50) | NO | | ID de Meta |
| waba_id | VARCHAR(50) | NO | | WhatsApp Business Account ID |
| token_cifrado | TEXT | NO | | Token cifrado con pgcrypto |
| nombre | VARCHAR(100) | NO | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### etapa_pipeline

Etapas del pipeline de ventas/leads.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(50) | NO | | Ej: Nuevo, Contactado, Cotizado, Cerrado |
| orden | INT | NO | | |
| color | VARCHAR(7) | SI | | Hex color para UI |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |

### etapa_transicion

Define qué transiciones son válidas entre etapas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| etapa_origen_id | UUID | NO | | FK → etapa_pipeline.id |
| etapa_destino_id | UUID | NO | | FK → etapa_pipeline.id |
| created_at | TIMESTAMPTZ | NO | now() | |

### etiqueta

Tags para clasificar leads/conversaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(50) | NO | | |
| color | VARCHAR(7) | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |

### lead

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| cliente_id | UUID | SI | | FK → cliente.id (si ya es cliente) |
| nombre | VARCHAR(100) | NO | | |
| telefono | VARCHAR(20) | SI | | |
| email | VARCHAR(150) | SI | | |
| etapa_id | UUID | NO | | FK → etapa_pipeline.id |
| asignado_a | UUID | SI | | FK → usuario.id |
| origen | VARCHAR(30) | SI | | WHATSAPP, WEB, TELEFONO, REFERIDO |
| valor_estimado | DECIMAL(12,2) | SI | | |
| notas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### lead_etiqueta

Relación N:M entre leads y etiquetas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| lead_id | UUID | NO | | FK → lead.id |
| etiqueta_id | UUID | NO | | FK → etiqueta.id |
| PK compuesto | | | | (lead_id, etiqueta_id) |

### conversacion

Hilo de conversación por WhatsApp u otro canal.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| lead_id | UUID | SI | | FK → lead.id |
| wa_cuenta_id | UUID | SI | | FK → wa_cuenta.id |
| canal | VARCHAR(20) | NO | | WHATSAPP, INTERNO |
| telefono_cliente | VARCHAR(20) | SI | | |
| estado | VARCHAR(15) | NO | 'ABIERTA' | ABIERTA, CERRADA |
| asignado_a | UUID | SI | | FK → usuario.id |
| ultimo_mensaje_at | TIMESTAMPTZ | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### mensaje

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| conversacion_id | UUID | NO | | FK → conversacion.id |
| wa_message_id | VARCHAR(100) | SI | | ID de mensaje de Meta |
| direccion | VARCHAR(10) | NO | | ENTRANTE, SALIENTE |
| tipo | VARCHAR(15) | NO | | TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, TEMPLATE |
| contenido | TEXT | SI | | |
| media_url | VARCHAR(500) | SI | | |
| remitente_tipo | VARCHAR(10) | NO | | CLIENTE, USUARIO, BOT, AGENTE |
| remitente_id | UUID | SI | | FK → usuario.id (si es usuario) |
| estado_envio | VARCHAR(15) | SI | | ENVIADO, ENTREGADO, LEIDO, FALLIDO |
| created_at | TIMESTAMPTZ | NO | now() | |

### plantilla_wa

Plantillas de mensajes de WhatsApp (aprobadas por Meta).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | |
| categoria | VARCHAR(20) | NO | | MARKETING, UTILITY, AUTHENTICATION |
| idioma | VARCHAR(5) | NO | 'es' | |
| contenido_template | TEXT | NO | | Template con variables {{1}}, {{2}} |
| estado_meta | VARCHAR(15) | NO | | APROBADA, PENDIENTE, RECHAZADA |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### bot

Bots automatizados (respuestas automáticas).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | |
| trigger_tipo | VARCHAR(20) | NO | | KEYWORD, HORARIO, PRIMERA_VEZ |
| trigger_valor | TEXT | SI | | Palabra clave, rango horario, etc. |
| respuesta | TEXT | NO | | Mensaje automático |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### agente_config

Configuración del agente IA "Nico".

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre_agente | VARCHAR(50) | NO | 'Nico' | |
| personalidad | TEXT | SI | | System prompt personalizado |
| tools_habilitados | JSONB | NO | '[]' | Lista de tools: consultar_stock, agendar_visita, etc. |
| modelo_llm | VARCHAR(30) | NO | 'claude-sonnet' | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### agente_evento

Log de acciones del agente IA.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| conversacion_id | UUID | NO | | FK → conversacion.id |
| tipo_evento | VARCHAR(30) | NO | | TOOL_CALL, RESPUESTA, ESCALACION, ERROR |
| tool_name | VARCHAR(50) | SI | | |
| input_data | JSONB | SI | | |
| output_data | JSONB | SI | | |
| duracion_ms | INT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |

### mensaje_interno

Mensajería interna entre usuarios del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| de_usuario_id | UUID | NO | | FK → usuario.id |
| para_usuario_id | UUID | NO | | FK → usuario.id |
| contenido | TEXT | NO | | |
| leido | BOOLEAN | NO | false | |
| referencia_tipo | VARCHAR(30) | SI | | ORDEN_SERVICIO, LEAD, VENTA |
| referencia_id | UUID | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |

## Reglas de negocio

- Token de WhatsApp cifrado con pgcrypto (nunca en texto plano)
- Agente Nico tiene tools: consultar_stock, agendar_visita, crear_cotizacion, buscar_estado_orden, etc.
- Transiciones de etapas son validadas (solo las definidas en etapa_transicion)
- Mensajes se reciben via webhook de Meta WhatsApp
- Eventos del agente se loguean para métricas y debugging
- Integración con EventBridge para eventos CRM
