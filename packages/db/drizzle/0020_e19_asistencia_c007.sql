-- ═══════════════════════════════════════════════════════════════════════════════
-- E19.1 — Asistencia y Planilla: 7 tablas nuevas + 9 enums
-- Tablas: turno_trabajo, punto_control_wifi, trabajador_config, evento_asistencia,
--         permiso_asistencia, planilla_mensual, planilla_detalle
-- Dev env: CREATE IF NOT EXISTS — tablas nuevas, sin datos existentes
-- Aplicar: psql -h localhost -p 5435 -U postgres -d reparatego_dev -f packages/db/drizzle/0020_e19_asistencia_c007.sql
-- Refs: docs/db/modules/asistencia.md, corrections-log.md#C007, corrections-log.md#C016
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Enums
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE "public"."tipo_evento_asistencia"   AS ENUM('ENTRADA','SALIDA','BREAK_INICIO','BREAK_FIN');
CREATE TYPE "public"."estado_evento_asistencia" AS ENUM('VALIDO','TARDANZA','FUERA_DE_ZONA','WIFI_NO_AUTORIZADO','MANUAL','ANULADO');
CREATE TYPE "public"."tipo_contrato"            AS ENUM('PLANILLA','HONORARIOS','PRACTICANTE');
CREATE TYPE "public"."modalidad_pago"           AS ENUM('MENSUAL','QUINCENAL','SEMANAL');
CREATE TYPE "public"."descuento_tardanza"       AS ENUM('POR_MINUTO','POR_RANGO','SIN_DESCUENTO');
CREATE TYPE "public"."tipo_permiso"             AS ENUM('MEDICO','PERSONAL','VACACIONES','CAPACITACION','LICENCIA','OTRO');
CREATE TYPE "public"."estado_permiso"           AS ENUM('PENDIENTE','APROBADO','RECHAZADO');
CREATE TYPE "public"."estado_planilla"          AS ENUM('BORRADOR','CALCULADO','APROBADO','PAGADO');
CREATE TYPE "public"."estado_dia"               AS ENUM('PRESENTE','FALTA','TARDANZA','PERMISO','VACACIONES','FERIADO','DESCANSO');

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: turno_trabajo
-- Horario de turno del taller. dias_laborales: ['LUN','MAR','MIE','JUE','VIE']
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "turno_trabajo" (
  "id"                 uuid          PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"          uuid          NOT NULL REFERENCES "tenant"("id"),
  "nombre"             varchar(100)  NOT NULL,
  "hora_inicio"        time          NOT NULL,
  "hora_fin"           time          NOT NULL,
  "tolerancia_minutos" integer       NOT NULL DEFAULT 15,
  "dias_laborales"     text[]        NOT NULL,
  "activo"             boolean       NOT NULL DEFAULT true,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_turno_trabajo_tenant_nombre" UNIQUE("tenant_id", "nombre")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: punto_control_wifi
-- SSID+BSSID del router del local + coordenadas GPS del centro + radio permitido.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "punto_control_wifi" (
  "id"           uuid          PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid          NOT NULL REFERENCES "tenant"("id"),
  "sucursal_id"  uuid          NOT NULL REFERENCES "sucursal"("id"),
  "nombre"       varchar(100)  NOT NULL,
  "ssid"         varchar(100)  NOT NULL,
  "bssid"        varchar(17)   NOT NULL,
  "latitud"      decimal(10,8) NOT NULL,
  "longitud"     decimal(11,8) NOT NULL,
  "radio_metros" integer       NOT NULL DEFAULT 50,
  "activo"       boolean       NOT NULL DEFAULT true,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: trabajador_config
-- Configuración laboral del empleado: turno, contrato, sueldo, descuentos.
-- UNIQUE(usuario_id): un usuario = una config activa.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "trabajador_config" (
  "id"                   uuid               PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"            uuid               NOT NULL REFERENCES "tenant"("id"),
  "usuario_id"           uuid               NOT NULL REFERENCES "usuario"("id"),
  "turno_id"             uuid               NOT NULL REFERENCES "turno_trabajo"("id"),
  "sucursal_id"          uuid               NOT NULL REFERENCES "sucursal"("id"),
  "tipo_contrato"        tipo_contrato      NOT NULL,
  "sueldo_base"          decimal(10,2)      NOT NULL,
  "modalidad_pago"       modalidad_pago     NOT NULL,
  "moneda"               char(3)            NOT NULL DEFAULT 'PEN',
  "fecha_ingreso"        date               NOT NULL,
  "fecha_cese"           date,
  "factor_hora_extra"    decimal(4,2)       NOT NULL DEFAULT 1.25,
  "descuento_x_tardanza" descuento_tardanza NOT NULL,
  "monto_descuento_min"  decimal(6,2)       NOT NULL DEFAULT 0,
  "activo"               boolean            NOT NULL DEFAULT true,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_trabajador_config_usuario_id" UNIQUE("usuario_id")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: evento_asistencia
-- Tabla central. Cada marcado (ENTRADA/SALIDA/BREAK) es un registro.
-- validacion_aprobada = validacion_wifi AND validacion_gps.
-- registrado_por NULL = auto (trabajador), uuid = admin manual.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "evento_asistencia" (
  "id"                  uuid                     PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"           uuid                     NOT NULL REFERENCES "tenant"("id"),
  "usuario_id"          uuid                     NOT NULL REFERENCES "usuario"("id"),
  "turno_id"            uuid                     NOT NULL REFERENCES "turno_trabajo"("id"),
  "tipo_evento"         tipo_evento_asistencia   NOT NULL,
  "fecha_hora"          timestamp with time zone NOT NULL,
  "fecha"               date                     NOT NULL,
  "ssid_detectado"      varchar(100),
  "bssid_detectado"     varchar(17),
  "latitud_marcado"     decimal(10,8),
  "longitud_marcado"    decimal(11,8),
  "distancia_metros"    integer,
  "punto_control_id"    uuid                     REFERENCES "punto_control_wifi"("id"),
  "validacion_wifi"     boolean                  NOT NULL DEFAULT false,
  "validacion_gps"      boolean                  NOT NULL DEFAULT false,
  "validacion_aprobada" boolean                  NOT NULL DEFAULT false,
  "estado"              estado_evento_asistencia NOT NULL,
  "minutos_tardanza"    integer                  NOT NULL DEFAULT 0,
  "es_hora_extra"       boolean                  NOT NULL DEFAULT false,
  "minutos_extra"       integer                  NOT NULL DEFAULT 0,
  "dispositivo_info"    jsonb,
  "registrado_por"      uuid                     REFERENCES "usuario"("id"),
  "observacion"         text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_evento_asistencia_usuario_fecha" ON "evento_asistencia" ("tenant_id", "usuario_id", "fecha");
CREATE INDEX "idx_evento_asistencia_fecha"         ON "evento_asistencia" ("tenant_id", "fecha");
CREATE INDEX "idx_evento_asistencia_estado"        ON "evento_asistencia" ("tenant_id", "estado");

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: permiso_asistencia
-- Justificaciones y permisos del trabajador. archivo_url = S3 (comprobante médico, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "permiso_asistencia" (
  "id"           uuid           PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid           NOT NULL REFERENCES "tenant"("id"),
  "usuario_id"   uuid           NOT NULL REFERENCES "usuario"("id"),
  "fecha_inicio" date           NOT NULL,
  "fecha_fin"    date           NOT NULL,
  "tipo_permiso" tipo_permiso   NOT NULL,
  "motivo"       text           NOT NULL,
  "archivo_url"  text,
  "estado"       estado_permiso NOT NULL DEFAULT 'PENDIENTE',
  "aprobado_por" uuid           REFERENCES "usuario"("id"),
  "afecta_pago"  boolean        NOT NULL DEFAULT false,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 7: planilla_mensual
-- Cierre mensual por trabajador. Campos calculados al ejecutar "calcular planilla".
-- UNIQUE(tenant_id, usuario_id, periodo): un solo registro por mes por trabajador.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "planilla_mensual" (
  "id"                     uuid            PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"              uuid            NOT NULL REFERENCES "tenant"("id"),
  "usuario_id"             uuid            NOT NULL REFERENCES "usuario"("id"),
  "periodo"                char(7)         NOT NULL,
  "dias_laborables"        integer         NOT NULL,
  "dias_asistidos"         integer         NOT NULL DEFAULT 0,
  "dias_falta"             integer         NOT NULL DEFAULT 0,
  "dias_falta_justificada" integer         NOT NULL DEFAULT 0,
  "dias_vacaciones"        integer         NOT NULL DEFAULT 0,
  "minutos_tardanza_total" integer         NOT NULL DEFAULT 0,
  "minutos_extra_total"    integer         NOT NULL DEFAULT 0,
  "horas_extra_total"      decimal(6,2)    NOT NULL DEFAULT 0,
  "sueldo_base"            decimal(10,2)   NOT NULL,
  "valor_dia"              decimal(10,2)   NOT NULL,
  "valor_hora"             decimal(10,2)   NOT NULL,
  "descuento_tardanzas"    decimal(10,2)   NOT NULL DEFAULT 0,
  "descuento_faltas"       decimal(10,2)   NOT NULL DEFAULT 0,
  "monto_horas_extra"      decimal(10,2)   NOT NULL DEFAULT 0,
  "bonificaciones"         decimal(10,2)   NOT NULL DEFAULT 0,
  "otros_descuentos"       decimal(10,2)   NOT NULL DEFAULT 0,
  "total_bruto"            decimal(10,2)   NOT NULL DEFAULT 0,
  "total_neto"             decimal(10,2)   NOT NULL DEFAULT 0,
  "estado"                 estado_planilla NOT NULL DEFAULT 'BORRADOR',
  "aprobado_por"           uuid            REFERENCES "usuario"("id"),
  "fecha_aprobacion"       timestamp with time zone,
  "fecha_pago"             date,
  "observaciones"          text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_planilla_mensual_tenant_usuario_periodo" UNIQUE("tenant_id", "usuario_id", "periodo")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 8: planilla_detalle
-- Un registro por día laborable por planilla. UNIQUE(planilla_id, fecha).
-- hora_entrada/salida_prog: copiadas del turno al calcular (snapshot inmutable).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "planilla_detalle" (
  "id"                uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid         NOT NULL REFERENCES "tenant"("id"),
  "planilla_id"       uuid         NOT NULL REFERENCES "planilla_mensual"("id"),
  "usuario_id"        uuid         NOT NULL REFERENCES "usuario"("id"),
  "fecha"             date         NOT NULL,
  "estado_dia"        estado_dia   NOT NULL,
  "hora_entrada_real" timestamp with time zone,
  "hora_salida_real"  timestamp with time zone,
  "hora_entrada_prog" time         NOT NULL,
  "hora_salida_prog"  time         NOT NULL,
  "minutos_tardanza"  integer      NOT NULL DEFAULT 0,
  "minutos_extra"     integer      NOT NULL DEFAULT 0,
  "descuento_dia"     decimal(8,2) NOT NULL DEFAULT 0,
  "observacion"       text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_planilla_detalle_planilla_fecha" UNIQUE("planilla_id", "fecha")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 9: RLS — patrón C007 (NULLIF protege contra RESET que deja string vacío)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "turno_trabajo"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "punto_control_wifi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trabajador_config"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evento_asistencia"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permiso_asistencia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planilla_mensual"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planilla_detalle"   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turno_trabajo_isolation"      ON "turno_trabajo"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "punto_control_wifi_isolation" ON "punto_control_wifi"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "trabajador_config_isolation"  ON "trabajador_config"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "evento_asistencia_isolation"  ON "evento_asistencia"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "permiso_asistencia_isolation" ON "permiso_asistencia"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "planilla_mensual_isolation"   ON "planilla_mensual"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY "planilla_detalle_isolation"   ON "planilla_detalle"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('turno_trabajo','punto_control_wifi','trabajador_config',
--                   'evento_asistencia','permiso_asistencia',
--                   'planilla_mensual','planilla_detalle');
-- ─────────────────────────────────────────────────────────────────────────────
