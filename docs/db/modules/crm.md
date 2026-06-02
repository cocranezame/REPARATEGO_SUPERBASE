# Módulo: CRM + Agente IA (Nico) — Schema de Base de Datos

> Referencia: C005 (2026-06-02), incluye C001 (UTM)

## Conceptos clave

- NEGOCIO: entidad lógica que agrupa cuentas WhatsApp (single-tenant por ahora, multi-tenant futuro)
- WA_CUENTA: número de WhatsApp vinculado con credenciales encriptadas (pgcrypto)
- CONVERSACIÓN: hilo de mensajes entre un número de celular y una wa_cuenta, con modo NICO/VENDEDOR
- LEAD: prospecto comercial que avanza por el pipeline de 15 etapas configurables
- ETAPA: paso del pipeline con operador (IA/BOT/HUMANO/SISTEMA), objetivo y transiciones dirigidas
- ETIQUETA: clasificador de leads en 4 grupos para contexto rápido de Nico y filtrado
- AGENTE: entidad IA (Nico) con canal, modelo, tono y estado
- BOT: flujo determinístico (no IA) con pasos configurables en JSONB
- Las etapas, etiquetas, operadores y objetivos son EDITABLES desde el panel admin

## Tablas

### TABLA: wa_cuenta
- wa_cuenta_id SERIAL PK
- negocio_nombre VARCHAR(100) NOT NULL
- phone_number_id VARCHAR(50) UNIQUE NOT NULL
- waba_id VARCHAR(50) NOT NULL
- access_token_encrypted BYTEA NOT NULL — pgcrypto, nunca expuesto en GET ni logs
- webhook_verify_token VARCHAR(100) NOT NULL — token para verificación GET de Meta
- nombre VARCHAR(100)
- activo BOOLEAN DEFAULT true
- created_by FK usuario
- created_at, updated_at

### TABLA: crm_etapa
- etapa_id SERIAL PK
- nombre VARCHAR(100) NOT NULL
- codigo VARCHAR(50) UNIQUE NOT NULL — PRIMER_CONTACTO, IDENTIFICACION, etc.
- orden INTEGER NOT NULL — posición en el pipeline/kanban
- objetivo TEXT — qué debe cumplirse antes de avanzar (se inyecta en prompt de Nico)
- operador ENUM('IA','BOT','HUMANO','SISTEMA') NOT NULL
- bot_id FK crm_bot — si operador=BOT, qué bot ejecuta esta etapa
- tiempo_espera_horas INTEGER DEFAULT 24 — para bot recordatorio
- max_intentos_recordatorio INTEGER DEFAULT 3
- color VARCHAR(7) — hex para UI del kanban
- activo BOOLEAN DEFAULT true
- created_at, updated_at
- Regla: todo es editable desde panel admin. Operador determina quién responde: IA=Nico, HUMANO=vendedor, BOT=flujo determinístico, SISTEMA=automático

### TABLA: crm_etapa_transicion
- transicion_id SERIAL PK
- etapa_origen_id FK crm_etapa NOT NULL
- etapa_destino_id FK crm_etapa NOT NULL
- UNIQUE(etapa_origen_id, etapa_destino_id)
- created_at
- Regla: transiciones dirigidas, no se puede saltar de cualquier etapa a cualquier otra

### TABLA: crm_etiqueta
- etiqueta_id SERIAL PK
- nombre VARCHAR(50) NOT NULL
- codigo VARCHAR(50) UNIQUE NOT NULL
- grupo ENUM('IDENTIFICACION','RUTA_ACTIVA','CAPTURA_DATOS','ESTADO_OPERATIVO') NOT NULL
- descripcion TEXT — criterio de asignación
- activo BOOLEAN DEFAULT true
- created_at

### TABLA: crm_lead
- lead_id SERIAL PK
- wa_cuenta_id FK NOT NULL
- celular VARCHAR(20) NOT NULL
- nombre VARCHAR(150)
- equipo_descripcion TEXT — categoría/marca/modelo capturado por Nico
- falla_descripcion TEXT — falla descrita por el cliente
- ubicacion TEXT — ubicación capturada
- etapa_id FK crm_etapa NOT NULL
- vendedor_id FK usuario — vendedor asignado (round-robin por sucursal default)
- cliente_id FK — si se vinculó/creó cliente en módulo clientes
- sucursal_id FK — sucursal asignada según ubicación
- utm_source VARCHAR(50) — meta | tiktok | google | organic (C001)
- utm_campaign VARCHAR(100) — ID campaña ej: camp_001 (C001)
- utm_medium VARCHAR(50) — paid | organic | referral (C001)
- activo BOOLEAN DEFAULT true
- created_at, updated_at
- Regla: UTM se captura automáticamente de la URL de origen al crear el lead (C001)

### TABLA: crm_lead_etiqueta
- lead_id FK NOT NULL
- etiqueta_id FK NOT NULL
- PK(lead_id, etiqueta_id)
- asignado_por ENUM('NICO','VENDEDOR','SISTEMA') DEFAULT 'SISTEMA'
- created_at

### TABLA: crm_conversacion
- conversacion_id SERIAL PK
- wa_cuenta_id FK NOT NULL
- lead_id FK NOT NULL
- celular VARCHAR(20) NOT NULL
- modo ENUM('NICO','VENDEDOR') DEFAULT 'NICO'
- estado ENUM('ACTIVA','CERRADA') DEFAULT 'ACTIVA'
- ultimo_mensaje_at TIMESTAMP
- mensajes_sin_leer INTEGER DEFAULT 0
- created_at, updated_at
- Regla: cuando modo cambia a VENDEDOR, Nico se pausa automáticamente en esta conversación. Vendedor devuelve control a NICO explícitamente.

### TABLA: crm_mensaje
- mensaje_id SERIAL PK
- conversacion_id FK NOT NULL
- wa_message_id VARCHAR(100) UNIQUE — idempotencia Meta, si se recibe duplicado se ignora
- direccion ENUM('ENTRANTE','SALIENTE') NOT NULL
- origen ENUM('CLIENTE','AGENTE','VENDEDOR','BOT','SISTEMA') NOT NULL
- tipo ENUM('TEXTO','IMAGEN','PLANTILLA','LINK') DEFAULT 'TEXTO'
- contenido TEXT
- metadata JSONB — datos adicionales del mensaje (plantilla vars, link URL, etc.)
- created_at
- Regla: mensaje se guarda ANTES de procesarlo con agente. Si agente falla, mensaje no se pierde.

### TABLA: crm_nota
- nota_id SERIAL PK
- lead_id FK NOT NULL
- contenido TEXT NOT NULL
- origen ENUM('NICO','VENDEDOR') NOT NULL
- created_by FK usuario — nullable si es Nico
- created_at
- Regla: notas de Nico son observaciones internas, no se envían al cliente

### TABLA: crm_agente
- agente_id SERIAL PK
- nombre VARCHAR(50) NOT NULL — ej: "Nico"
- canal ENUM('WHATSAPP') NOT NULL
- modelo_ia VARCHAR(50) NOT NULL — ej: "claude-haiku"
- tono TEXT — personalidad y estilo de comunicación
- prompt_base TEXT — instrucciones base (se complementa con objetivo de etapa)
- max_mensajes_contexto INTEGER DEFAULT 20 — últimos N mensajes para context builder
- activo BOOLEAN DEFAULT true
- created_at, updated_at
- Regla: Nico solo opera en canal WhatsApp. Solo texto y links por ahora, no imágenes.
- Regla: Nico responde 24/7. Si necesita humano fuera de horario, deja nota y avisa horario laboral.

### TABLA: crm_accion_agente
- accion_id SERIAL PK
- agente_id FK NOT NULL
- conversacion_id FK NOT NULL
- lead_id FK NOT NULL
- tool_name VARCHAR(100) NOT NULL — guardarDato, moverEtapa, buscarCliente, crearCliente, crearServicio, derivarVendedor, enviarLink, consultarRepuesto
- tool_input JSONB — parámetros enviados a la tool
- tool_output JSONB — resultado de la tool
- exitoso BOOLEAN NOT NULL
- duracion_ms INTEGER
- error TEXT
- created_at
- Regla: toda tool se loguea sin excepción. Consultable por rango fecha y tool para monitoreo.

### TABLA: crm_plantilla
- plantilla_id SERIAL PK
- nombre VARCHAR(100) NOT NULL
- contenido TEXT NOT NULL — texto con variables {nombre}, {equipo}, etc.
- variables JSONB — ej: ["nombre","equipo"]
- meta_template_name VARCHAR(100) — nombre registrado en Meta para HSM
- estado_meta ENUM('PENDIENTE','APROBADA','RECHAZADA') DEFAULT 'PENDIENTE'
- created_by FK usuario
- created_at, updated_at
- Regla: fuera de ventana 24h de Meta, solo se pueden enviar plantillas con estado_meta=APROBADA

### TABLA: crm_bot
- bot_id SERIAL PK
- nombre VARCHAR(100) NOT NULL
- codigo VARCHAR(50) UNIQUE NOT NULL — COTIZACION_REPUESTO, SERVICIO_PROCESO, RECORDATORIO
- tipo ENUM('COTIZACION_REPUESTO','SERVICIO_PROCESO','RECORDATORIO') NOT NULL
- config JSONB NOT NULL — pasos, triggers, mensajes del flujo determinístico
- activo BOOLEAN DEFAULT true
- created_at, updated_at
- Regla: bots son flujos determinísticos (no IA). Coexisten con Nico pero son independientes.
- Regla: si operador de etapa = BOT, se selecciona el bot vinculado en crm_etapa.bot_id

### TABLA: crm_evento
- evento_id SERIAL PK
- tipo VARCHAR(50) NOT NULL — LEAD_CREADO, ETAPA_CAMBIADA, DERIVACION, MENSAJE_ENVIADO, ERROR_AGENTE, BOT_EJECUTADO
- origen ENUM('SISTEMA','NICO','VENDEDOR','BOT') NOT NULL
- lead_id FK
- conversacion_id FK
- datos JSONB — contexto del evento
- created_at
- Regla: eventos disparan notificaciones configurables

### TABLA: crm_mensaje_interno
- mensaje_interno_id SERIAL PK
- remitente_id FK usuario NOT NULL
- destinatario_id FK usuario NOT NULL
- contenido TEXT NOT NULL
- leido BOOLEAN DEFAULT false
- created_at
- Regla: completamente separado de WhatsApp. Chat entre empleados dentro del panel.

## Seed data inicial

### 15 etapas del pipeline

| orden | codigo | nombre | operador | objetivo |
|-------|--------|--------|----------|----------|
| 1 | PRIMER_CONTACTO | Primer contacto | IA | Saludar, identificar necesidad básica |
| 2 | IDENTIFICACION | Identificación | IA | Capturar nombre y documento del cliente |
| 3 | CAPTURA_EQUIPO | Captura de equipo | IA | Capturar categoría, marca, modelo del equipo |
| 4 | CAPTURA_FALLA | Captura de falla | IA | Capturar descripción detallada de la falla |
| 5 | CAPTURA_UBICACION | Captura de ubicación | IA | Capturar ubicación para asignar sucursal |
| 6 | COTIZACION_INFORMAL | Cotización informal | IA | Consultar stock/precios, dar cotización orientativa |
| 7 | DECISION_CLIENTE | Decisión del cliente | IA | Confirmar si el cliente quiere proceder con reparación |
| 8 | REGISTRO_CLIENTE | Registro de cliente | IA | Buscar/crear cliente en el sistema |
| 9 | REGISTRO_SERVICIO | Registro de servicio | IA | Crear orden de servicio con datos capturados (requiere confirmación del cliente) |
| 10 | DERIVACION_VENDEDOR | Derivación a vendedor | HUMANO | Vendedor toma control para casos complejos |
| 11 | SEGUIMIENTO_SERVICIO | Seguimiento de servicio | BOT | Cliente consulta estado de su servicio activo |
| 12 | COTIZACION_REPUESTO | Cotización de repuesto | BOT | Flujo guiado para cotizar repuesto específico |
| 13 | ESPERANDO_RESPUESTA | Esperando respuesta | BOT | Lead no responde, enviar recordatorios (max 3 intentos, 24h entre cada uno) |
| 14 | CONVERTIDO | Convertido | SISTEMA | Lead se convirtió en cliente con servicio activo |
| 15 | SIN_RESPUESTA | Sin respuesta | SISTEMA | Lead no respondió tras N intentos, archivado |

### Transiciones permitidas

PRIMER_CONTACTO → IDENTIFICACION, DERIVACION_VENDEDOR, COTIZACION_REPUESTO, SEGUIMIENTO_SERVICIO
IDENTIFICACION → CAPTURA_EQUIPO, DERIVACION_VENDEDOR
CAPTURA_EQUIPO → CAPTURA_FALLA, DERIVACION_VENDEDOR
CAPTURA_FALLA → CAPTURA_UBICACION, DERIVACION_VENDEDOR
CAPTURA_UBICACION → COTIZACION_INFORMAL, DERIVACION_VENDEDOR
COTIZACION_INFORMAL → DECISION_CLIENTE, DERIVACION_VENDEDOR
DECISION_CLIENTE → REGISTRO_CLIENTE, DERIVACION_VENDEDOR, ESPERANDO_RESPUESTA
REGISTRO_CLIENTE → REGISTRO_SERVICIO, DERIVACION_VENDEDOR
REGISTRO_SERVICIO → CONVERTIDO, DERIVACION_VENDEDOR
DERIVACION_VENDEDOR → cualquier etapa (el vendedor puede mover libremente)
SEGUIMIENTO_SERVICIO → PRIMER_CONTACTO, DERIVACION_VENDEDOR
COTIZACION_REPUESTO → PRIMER_CONTACTO, DERIVACION_VENDEDOR, DECISION_CLIENTE
ESPERANDO_RESPUESTA → PRIMER_CONTACTO, SIN_RESPUESTA
CONVERTIDO → PRIMER_CONTACTO (si vuelve a escribir)
SIN_RESPUESTA → PRIMER_CONTACTO (si vuelve a escribir)

### 19 etiquetas

IDENTIFICACION: NOMBRE_CAPTURADO, DOCUMENTO_CAPTURADO, CELULAR_CAPTURADO, UBICACION_CAPTURADA
RUTA_ACTIVA: RUTA_REPARACION, RUTA_COTIZACION, RUTA_CONSULTA_ESTADO, RUTA_INFORMACION
CAPTURA_DATOS: EQUIPO_IDENTIFICADO, FALLA_DESCRITA, MARCA_IDENTIFICADA, MODELO_IDENTIFICADO, COTIZACION_ENVIADA, PRESUPUESTO_ACEPTADO
ESTADO_OPERATIVO: CLIENTE_EXISTENTE, CLIENTE_NUEVO, SERVICIO_CREADO, DERIVADO_VENDEDOR, ARCHIVADO

### Agente inicial

Nico: canal WHATSAPP, modelo claude-haiku, activo, max_mensajes_contexto 20

### 3 bots iniciales

COTIZACION_REPUESTO: flujo guiado categoría → componente → buscar precio → mostrar resultado
SERVICIO_PROCESO: pide documento → busca servicios activos → muestra estado
RECORDATORIO: envía mensaje predefinido → espera respuesta → reintenta hasta max_intentos

## Relaciones clave

- wa_cuenta 1:N crm_conversacion
- wa_cuenta 1:N crm_lead
- crm_lead 1:1 crm_conversacion (un lead tiene una conversación activa)
- crm_lead N:N crm_etiqueta vía crm_lead_etiqueta
- crm_lead N:1 crm_etapa (un lead está en una etapa)
- crm_lead 1:N crm_nota
- crm_conversacion 1:N crm_mensaje
- crm_agente 1:N crm_accion_agente
- crm_etapa 1:N crm_etapa_transicion (como origen)
- crm_etapa N:1 crm_bot (opcional, si operador=BOT)
- crm_evento referencia lead y conversación opcionales

## Tools de Nico (8)

| Tool | Lee de | Escribe en | Descripción |
|------|--------|------------|-------------|
| guardarDato | — | crm_lead (campos nombre, equipo_descripcion, falla_descripcion, ubicacion) + crm_lead_etiqueta | Guarda dato capturado y asigna etiqueta correspondiente |
| moverEtapa | crm_etapa_transicion | crm_lead.etapa_id + crm_evento | Mueve lead a siguiente etapa validando transiciones permitidas |
| buscarCliente | cliente | — | Busca cliente por numero_doc o celular |
| crearCliente | — | cliente | Crea cliente nuevo con datos capturados (requiere datos mínimos) |
| crearServicio | — | orden_servicio (vía instancia) | Crea servicio con datos del lead. Requiere confirmación del cliente |
| derivarVendedor | usuario (vendedores) | crm_conversacion.modo, crm_evento | Cambia modo a VENDEDOR, genera evento de notificación |
| enviarLink | sucursal, orden_servicio | crm_mensaje | Envía link de ubicación sucursal o seguimiento de orden |
| consultarRepuesto | producto, lote | — | Consulta stock y precio de repuestos. Solo lectura, no modifica stock |

Regla: tools operan directo sobre schemas existentes vía SQL, NO vía endpoints HTTP internos.
Regla: Nico NO puede modificar stock, anular servicios ni cambiar precios.
