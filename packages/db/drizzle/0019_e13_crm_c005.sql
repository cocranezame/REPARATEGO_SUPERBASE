-- ═══════════════════════════════════════════════════════════════════════════════
-- E13.1 — CRM C005: Schema completo módulo CRM (15 tablas nuevas)
-- Tablas: wa_cuenta, crm_bot, crm_agente, crm_etapa, crm_etapa_transicion,
--         crm_etiqueta, crm_lead, crm_lead_etiqueta, crm_conversacion,
--         crm_mensaje, crm_nota, crm_accion_agente, crm_plantilla,
--         crm_evento, crm_mensaje_interno
-- Dev env: CREATE IF NOT EXISTS — sin datos existentes (tablas CRM nuevas)
-- Aplicar: psql -h localhost -p 5435 -U postgres -d reparatego_dev -f packages/db/drizzle/0019_e13_crm_c005.sql
-- Refs: docs/db/modules/crm.md, corrections-log.md#C005, corrections-log.md#C016
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- PASO 1: Enums CRM
-- ─────────────────────────────────────────────────────────
CREATE TYPE "public"."operador_etapa"        AS ENUM('IA','BOT','HUMANO','SISTEMA');
CREATE TYPE "public"."modo_conversacion"     AS ENUM('NICO','VENDEDOR');
CREATE TYPE "public"."estado_conversacion"   AS ENUM('ACTIVA','CERRADA');
CREATE TYPE "public"."direccion_mensaje"     AS ENUM('ENTRANTE','SALIENTE');
CREATE TYPE "public"."origen_mensaje"        AS ENUM('CLIENTE','AGENTE','VENDEDOR','BOT','SISTEMA');
CREATE TYPE "public"."tipo_mensaje"          AS ENUM('TEXTO','IMAGEN','PLANTILLA','LINK');
CREATE TYPE "public"."grupo_etiqueta"        AS ENUM('IDENTIFICACION','RUTA_ACTIVA','CAPTURA_DATOS','ESTADO_OPERATIVO');
CREATE TYPE "public"."tipo_bot"              AS ENUM('COTIZACION_REPUESTO','SERVICIO_PROCESO','RECORDATORIO');
CREATE TYPE "public"."estado_meta_plantilla" AS ENUM('PENDIENTE','APROBADA','RECHAZADA');
CREATE TYPE "public"."origen_nota"           AS ENUM('NICO','VENDEDOR');
CREATE TYPE "public"."origen_evento"         AS ENUM('SISTEMA','NICO','VENDEDOR','BOT');
CREATE TYPE "public"."asignado_por_etiqueta" AS ENUM('NICO','VENDEDOR','SISTEMA');

-- ─────────────────────────────────────────────────────────
-- PASO 2: wa_cuenta
-- Almacena credenciales WhatsApp Business API por negocio.
-- access_token_encrypted: BYTEA — la API encripta antes de guardar, nunca expuesto en GET.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wa_cuenta" (
  "id"                      uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"               uuid        NOT NULL REFERENCES "tenant"("id"),
  "negocio_nombre"          varchar(100) NOT NULL,
  "phone_number_id"         varchar(50)  NOT NULL,
  "waba_id"                 varchar(50)  NOT NULL,
  "access_token_encrypted"  bytea        NOT NULL,
  "webhook_verify_token"    varchar(100) NOT NULL,
  "nombre"                  varchar(100),
  "activo"                  boolean      NOT NULL DEFAULT true,
  "created_by"              uuid         REFERENCES "usuario"("id"),
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_wa_cuenta_phone_number_id" UNIQUE("phone_number_id")
);

-- ─────────────────────────────────────────────────────────
-- PASO 3: crm_bot
-- Flujos determinísticos (no IA). Se crean antes de crm_etapa
-- porque crm_etapa.bot_id referencia esta tabla.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_bot" (
  "id"         uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"  uuid         NOT NULL REFERENCES "tenant"("id"),
  "nombre"     varchar(100) NOT NULL,
  "codigo"     varchar(50)  NOT NULL,
  "tipo"       tipo_bot     NOT NULL,
  "config"     jsonb        NOT NULL,
  "activo"     boolean      NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_crm_bot_tenant_codigo" ON "crm_bot" ("tenant_id", "codigo");

-- ─────────────────────────────────────────────────────────
-- PASO 4: crm_agente
-- Entidad IA (Nico). canal = 'WHATSAPP' por defecto (único canal soportado).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_agente" (
  "id"                    uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"             uuid        NOT NULL REFERENCES "tenant"("id"),
  "nombre"                varchar(50)  NOT NULL,
  "canal"                 varchar(20)  NOT NULL DEFAULT 'WHATSAPP',
  "modelo_ia"             varchar(50)  NOT NULL,
  "tono"                  text,
  "prompt_base"           text,
  "max_mensajes_contexto" integer      NOT NULL DEFAULT 20,
  "activo"                boolean      NOT NULL DEFAULT true,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- PASO 5: crm_etapa
-- Pipeline configurable de 15 etapas. bot_id referencia crm_bot (nullable).
-- operador: IA=Nico responde, BOT=flujo determinístico, HUMANO=vendedor, SISTEMA=automático.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_etapa" (
  "id"                       uuid           PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"                uuid           NOT NULL REFERENCES "tenant"("id"),
  "nombre"                   varchar(100)   NOT NULL,
  "codigo"                   varchar(50)    NOT NULL,
  "orden"                    integer        NOT NULL,
  "objetivo"                 text,
  "operador"                 operador_etapa NOT NULL,
  "bot_id"                   uuid           REFERENCES "crm_bot"("id"),
  "tiempo_espera_horas"      integer        DEFAULT 24,
  "max_intentos_recordatorio" integer       DEFAULT 3,
  "color"                    varchar(7),
  "activo"                   boolean        NOT NULL DEFAULT true,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_crm_etapa_tenant_codigo" ON "crm_etapa" ("tenant_id", "codigo");
CREATE INDEX "idx_crm_etapa_tenant_orden" ON "crm_etapa" ("tenant_id", "orden");

-- ─────────────────────────────────────────────────────────
-- PASO 6: crm_etapa_transicion
-- Transiciones dirigidas. UNIQUE garantiza que no existan dos registros
-- para el mismo par origen→destino.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_etapa_transicion" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"        uuid NOT NULL REFERENCES "tenant"("id"),
  "etapa_origen_id"  uuid NOT NULL REFERENCES "crm_etapa"("id"),
  "etapa_destino_id" uuid NOT NULL REFERENCES "crm_etapa"("id"),
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_crm_etapa_transicion" UNIQUE ("etapa_origen_id", "etapa_destino_id")
);

-- ─────────────────────────────────────────────────────────
-- PASO 7: crm_etiqueta
-- Clasificadores de leads en 4 grupos. Editables desde admin.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_etiqueta" (
  "id"          uuid           PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"   uuid           NOT NULL REFERENCES "tenant"("id"),
  "nombre"      varchar(50)    NOT NULL,
  "codigo"      varchar(50)    NOT NULL,
  "grupo"       grupo_etiqueta NOT NULL,
  "descripcion" text,
  "activo"      boolean        NOT NULL DEFAULT true,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_crm_etiqueta_tenant_codigo" ON "crm_etiqueta" ("tenant_id", "codigo");

-- ─────────────────────────────────────────────────────────
-- PASO 8: crm_lead
-- Prospecto comercial. UTM de C001 incluidos.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_lead" (
  "id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"           uuid        NOT NULL REFERENCES "tenant"("id"),
  "wa_cuenta_id"        uuid        NOT NULL REFERENCES "wa_cuenta"("id"),
  "celular"             varchar(20) NOT NULL,
  "nombre"              varchar(150),
  "equipo_descripcion"  text,
  "falla_descripcion"   text,
  "ubicacion"           text,
  "etapa_id"            uuid        NOT NULL REFERENCES "crm_etapa"("id"),
  "vendedor_id"         uuid        REFERENCES "usuario"("id"),
  "cliente_id"          uuid        REFERENCES "cliente"("id"),
  "sucursal_id"         uuid        REFERENCES "sucursal"("id"),
  "utm_source"          varchar(50),
  "utm_campaign"        varchar(100),
  "utm_medium"          varchar(50),
  "activo"              boolean     NOT NULL DEFAULT true,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "idx_crm_lead_tenant_etapa"   ON "crm_lead" ("tenant_id", "etapa_id");
CREATE INDEX "idx_crm_lead_tenant_celular" ON "crm_lead" ("tenant_id", "celular");
CREATE INDEX "idx_crm_lead_tenant_created" ON "crm_lead" ("tenant_id", "created_at");

-- ─────────────────────────────────────────────────────────
-- PASO 9: crm_lead_etiqueta
-- Tabla de unión con PK compuesta (lead_id, etiqueta_id).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_lead_etiqueta" (
  "tenant_id"    uuid                   NOT NULL REFERENCES "tenant"("id"),
  "lead_id"      uuid                   NOT NULL REFERENCES "crm_lead"("id"),
  "etiqueta_id"  uuid                   NOT NULL REFERENCES "crm_etiqueta"("id"),
  "asignado_por" asignado_por_etiqueta  NOT NULL DEFAULT 'SISTEMA',
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("lead_id", "etiqueta_id")
);

-- ─────────────────────────────────────────────────────────
-- PASO 10: crm_conversacion
-- Hilo de mensajes. modo=NICO (Nico activo) o VENDEDOR (humano toma control).
-- mensajes_sin_leer: contador para badge de notificación en UI.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_conversacion" (
  "id"                 uuid                NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"          uuid                NOT NULL REFERENCES "tenant"("id"),
  "wa_cuenta_id"       uuid                NOT NULL REFERENCES "wa_cuenta"("id"),
  "lead_id"            uuid                NOT NULL REFERENCES "crm_lead"("id"),
  "celular"            varchar(20)         NOT NULL,
  "modo"               modo_conversacion   NOT NULL DEFAULT 'NICO',
  "estado"             estado_conversacion NOT NULL DEFAULT 'ACTIVA',
  "ultimo_mensaje_at"  timestamp with time zone,
  "mensajes_sin_leer"  integer             NOT NULL DEFAULT 0,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "idx_crm_conv_tenant_lead"   ON "crm_conversacion" ("tenant_id", "lead_id");
CREATE INDEX "idx_crm_conv_tenant_estado" ON "crm_conversacion" ("tenant_id", "estado");

-- ─────────────────────────────────────────────────────────
-- PASO 11: crm_mensaje
-- wa_message_id: UNIQUE parcial (solo cuando no es NULL) para idempotencia Meta.
-- El mensaje se guarda ANTES de procesarlo con el agente.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_mensaje" (
  "id"               uuid              PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"        uuid              NOT NULL REFERENCES "tenant"("id"),
  "conversacion_id"  uuid              NOT NULL REFERENCES "crm_conversacion"("id"),
  "wa_message_id"    varchar(100),
  "direccion"        direccion_mensaje NOT NULL,
  "origen"           origen_mensaje    NOT NULL,
  "tipo"             tipo_mensaje      NOT NULL DEFAULT 'TEXTO',
  "contenido"        text,
  "metadata"         jsonb,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_crm_mensaje_wa_id"
  ON "crm_mensaje" ("wa_message_id")
  WHERE "wa_message_id" IS NOT NULL;
CREATE INDEX "idx_crm_mensaje_conversacion" ON "crm_mensaje" ("conversacion_id");

-- ─────────────────────────────────────────────────────────
-- PASO 12: crm_nota
-- Notas internas del lead. created_by nullable: Nico no tiene usuario_id.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_nota" (
  "id"          uuid       PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"   uuid       NOT NULL REFERENCES "tenant"("id"),
  "lead_id"     uuid       NOT NULL REFERENCES "crm_lead"("id"),
  "contenido"   text       NOT NULL,
  "origen"      origen_nota NOT NULL,
  "created_by"  uuid       REFERENCES "usuario"("id"),
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- PASO 13: crm_accion_agente
-- Log de cada tool call de Nico. Nunca se omite — se registra éxito y fallo.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_accion_agente" (
  "id"               uuid    PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"        uuid    NOT NULL REFERENCES "tenant"("id"),
  "agente_id"        uuid    NOT NULL REFERENCES "crm_agente"("id"),
  "conversacion_id"  uuid    NOT NULL REFERENCES "crm_conversacion"("id"),
  "lead_id"          uuid    NOT NULL REFERENCES "crm_lead"("id"),
  "tool_name"        varchar(100) NOT NULL,
  "tool_input"       jsonb,
  "tool_output"      jsonb,
  "exitoso"          boolean NOT NULL,
  "duracion_ms"      integer,
  "error"            text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "idx_crm_accion_tenant_agente"  ON "crm_accion_agente" ("tenant_id", "agente_id");
CREATE INDEX "idx_crm_accion_tenant_created" ON "crm_accion_agente" ("tenant_id", "created_at");

-- ─────────────────────────────────────────────────────────
-- PASO 14: crm_plantilla
-- Plantillas HSM de Meta. estado_meta=APROBADA obligatorio fuera de ventana 24h.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_plantilla" (
  "id"                 uuid                  PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"          uuid                  NOT NULL REFERENCES "tenant"("id"),
  "nombre"             varchar(100)          NOT NULL,
  "contenido"          text                  NOT NULL,
  "variables"          jsonb,
  "meta_template_name" varchar(100),
  "estado_meta"        estado_meta_plantilla NOT NULL DEFAULT 'PENDIENTE',
  "created_by"         uuid                  REFERENCES "usuario"("id"),
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- PASO 15: crm_evento
-- Registro de eventos del sistema (LEAD_CREADO, ETAPA_CAMBIADA, etc.).
-- lead_id y conversacion_id opcionales según el tipo de evento.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_evento" (
  "id"               uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"        uuid         NOT NULL REFERENCES "tenant"("id"),
  "tipo"             varchar(50)  NOT NULL,
  "origen"           origen_evento NOT NULL,
  "lead_id"          uuid         REFERENCES "crm_lead"("id"),
  "conversacion_id"  uuid         REFERENCES "crm_conversacion"("id"),
  "datos"            jsonb,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "idx_crm_evento_tenant_lead"    ON "crm_evento" ("tenant_id", "lead_id");
CREATE INDEX "idx_crm_evento_tenant_created" ON "crm_evento" ("tenant_id", "created_at");

-- ─────────────────────────────────────────────────────────
-- PASO 16: crm_mensaje_interno
-- Chat interno entre empleados. Separado de WhatsApp.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_mensaje_interno" (
  "id"               uuid    PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"        uuid    NOT NULL REFERENCES "tenant"("id"),
  "remitente_id"     uuid    NOT NULL REFERENCES "usuario"("id"),
  "destinatario_id"  uuid    NOT NULL REFERENCES "usuario"("id"),
  "contenido"        text    NOT NULL,
  "leido"            boolean NOT NULL DEFAULT false,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "idx_crm_msg_interno_destinatario"
  ON "crm_mensaje_interno" ("destinatario_id", "leido");

-- ─────────────────────────────────────────────────────────
-- PASO 17: RLS — habilitar en todas las tablas CRM
-- Patrón: NULLIF(current_setting('app.tenant_id', true), '')::uuid (ver C007)
-- ─────────────────────────────────────────────────────────
ALTER TABLE "wa_cuenta"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_bot"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_agente"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_etapa"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_etapa_transicion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_etiqueta"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_lead"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_lead_etiqueta"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_conversacion"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_mensaje"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_nota"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_accion_agente"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_plantilla"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_evento"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_mensaje_interno" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_cuenta_isolation"           ON "wa_cuenta"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_bot_isolation"             ON "crm_bot"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_agente_isolation"          ON "crm_agente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_etapa_isolation"           ON "crm_etapa"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_etapa_transicion_isolation" ON "crm_etapa_transicion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_etiqueta_isolation"        ON "crm_etiqueta"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_lead_isolation"            ON "crm_lead"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_lead_etiqueta_isolation"   ON "crm_lead_etiqueta"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_conversacion_isolation"    ON "crm_conversacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_mensaje_isolation"         ON "crm_mensaje"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_nota_isolation"            ON "crm_nota"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_accion_agente_isolation"   ON "crm_accion_agente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_plantilla_isolation"       ON "crm_plantilla"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_evento_isolation"          ON "crm_evento"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "crm_mensaje_interno_isolation" ON "crm_mensaje_interno"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ─────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después de aplicar)
-- ─────────────────────────────────────────────────────────
-- Tablas creadas:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('wa_cuenta','crm_bot','crm_agente','crm_etapa',
--     'crm_etapa_transicion','crm_etiqueta','crm_lead','crm_lead_etiqueta',
--     'crm_conversacion','crm_mensaje','crm_nota','crm_accion_agente',
--     'crm_plantilla','crm_evento','crm_mensaje_interno')
--   ORDER BY table_name;
--
-- ENUMs:
--   SELECT typname FROM pg_type
--   WHERE typname IN ('operador_etapa','modo_conversacion','estado_conversacion',
--     'direccion_mensaje','origen_mensaje','tipo_mensaje','grupo_etiqueta',
--     'tipo_bot','estado_meta_plantilla','origen_nota','origen_evento',
--     'asignado_por_etiqueta')
--   ORDER BY typname;
--
-- RLS activo:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename LIKE 'crm%'
--   ORDER BY tablename;
