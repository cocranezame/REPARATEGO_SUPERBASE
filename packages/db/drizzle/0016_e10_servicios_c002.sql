-- ═══════════════════════════════════════════════════════════════════════════════
-- E10.1 — Servicios C002: Reemplaza módulo servicios completo
-- Dev env: drop+recreate (sin datos de producción)
-- Refs: docs/db/modules/servicios.md, corrections-log.md#C002
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- PASO 1: Eliminar FKs externas que apuntan a orden_servicio
-- ─────────────────────────────────────────────────────────
ALTER TABLE "venta"
  DROP CONSTRAINT IF EXISTS "venta_orden_servicio_id_orden_servicio_id_fk";
ALTER TABLE "visita_domicilio"
  DROP CONSTRAINT IF EXISTS "visita_domicilio_orden_servicio_id_orden_servicio_id_fk";

-- ─────────────────────────────────────────────────────────
-- PASO 2: Eliminar tablas de servicios existentes
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "orden_servicio_evidencia";
DROP TABLE IF EXISTS "orden_servicio_cotizacion";
DROP TABLE IF EXISTS "orden_servicio_componente";
DROP TABLE IF EXISTS "orden_servicio";

-- ─────────────────────────────────────────────────────────
-- PASO 3: Eliminar ENUMs obsoletos
-- ─────────────────────────────────────────────────────────
DROP TYPE IF EXISTS "estado_orden_servicio";
DROP TYPE IF EXISTS "tipo_servicio";
DROP TYPE IF EXISTS "momento_evidencia";

-- ─────────────────────────────────────────────────────────
-- PASO 4: Crear nuevos ENUMs
-- ─────────────────────────────────────────────────────────
CREATE TYPE "public"."estado_orden_servicio" AS ENUM(
  'VALIDACION','REVISION','DIAG_PRELIMINAR','DIAG_FINAL','COTIZADO',
  'APROBADO','AGREGAR_SKU','PRIORIDAD','REPARADO','AVISADO',
  'ENTREGADO','GARANTIA','DEVOLUCION'
);
CREATE TYPE "public"."tipo_servicio" AS ENUM('REPARACION','REVISION');
CREATE TYPE "public"."canal_servicio" AS ENUM('TIENDA','DOMICILIO');
CREATE TYPE "public"."tipo_afectacion" AS ENUM('PREVENTIVO','CORRECTIVO');
CREATE TYPE "public"."tipo_accion_componente" AS ENUM('REPARACION','CAMBIO');
CREATE TYPE "public"."etapa_componente" AS ENUM('PRELIMINAR','FINAL');
CREATE TYPE "public"."tipo_item_cotizacion" AS ENUM('REPUESTO','SERVICIO','MANUAL');
CREATE TYPE "public"."estado_sku_asignado" AS ENUM('ASIGNADO','CONSUMIDO');
CREATE TYPE "public"."estado_requerimiento" AS ENUM('PENDIENTE','EN_COMPRA','ATENDIDO','ANULADO');
CREATE TYPE "public"."tipo_aceptacion" AS ENUM('VALIDACION','PRESUPUESTO');
CREATE TYPE "public"."canal_aceptacion" AS ENUM('PORTAL_CLIENTE','MANUAL_TIENDA','MANUAL_WHATSAPP');
CREATE TYPE "public"."motivo_devolucion" AS ENUM('CLIENTE_CANCELO','SIN_SOLUCION');
CREATE TYPE "public"."metodo_aceptacion" AS ENUM('CLICK_BUTTON','FIRMA_DIGITAL','CHECKBOX');

-- ─────────────────────────────────────────────────────────
-- PASO 5: Catálogos de servicios (periferico, costo_revision)
-- ─────────────────────────────────────────────────────────
CREATE TABLE "periferico" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "categoria_id" uuid NOT NULL REFERENCES "categoria"("id"),
  "nombre"       varchar(100) NOT NULL,
  "activo"       boolean DEFAULT true NOT NULL,
  "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_periferico_tenant_categoria_nombre"
    UNIQUE("tenant_id","categoria_id","nombre")
);

CREATE TABLE "costo_revision" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "categoria_id" uuid NOT NULL REFERENCES "categoria"("id"),
  "monto"        numeric(10,2) NOT NULL,
  "activo"       boolean DEFAULT true NOT NULL,
  "created_by"   uuid REFERENCES "usuario"("id"),
  "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"   timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_costo_revision_tenant_categoria"
    UNIQUE("tenant_id","categoria_id")
);

-- ─────────────────────────────────────────────────────────
-- PASO 6: instancia e instancia_imagen
-- ─────────────────────────────────────────────────────────
CREATE TABLE "instancia" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "cliente_id"   uuid NOT NULL REFERENCES "cliente"("id"),
  "producto_id"  uuid NOT NULL REFERENCES "producto"("id"),
  "numero_serie" varchar(100),
  "activo"       boolean DEFAULT true NOT NULL,
  "created_by"   uuid REFERENCES "usuario"("id"),
  "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"   timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "instancia_imagen" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "instancia_id" uuid NOT NULL REFERENCES "instancia"("id"),
  "url"          text NOT NULL,
  "descripcion"  text,
  "orden"        integer DEFAULT 1 NOT NULL,
  "created_at"   timestamp with time zone DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- PASO 7: orden_servicio (nueva estructura C002)
-- ─────────────────────────────────────────────────────────
CREATE TABLE "orden_servicio" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"           uuid NOT NULL REFERENCES "tenant"("id"),
  "codigo"              varchar(20) NOT NULL,
  "instancia_id"        uuid NOT NULL REFERENCES "instancia"("id"),
  "sucursal_id"         uuid REFERENCES "sucursal"("id"),
  "canal"               "canal_servicio" DEFAULT 'TIENDA' NOT NULL,
  "tipo_servicio"       "tipo_servicio" DEFAULT 'REPARACION' NOT NULL,
  "falla_ingreso"       text NOT NULL,
  "diagnostico_tecnico" text,
  "solucion"            text,
  "costo_revision"      numeric(10,2) NOT NULL,
  "estado"              "estado_orden_servicio" DEFAULT 'VALIDACION' NOT NULL,
  "motivo_devolucion"   "motivo_devolucion",
  "tecnico_id"          uuid REFERENCES "usuario"("id"),
  "vendedor_id"         uuid REFERENCES "usuario"("id"),
  "preventivo_accepted" boolean,
  "venta_id"            uuid,
  "orden_padre_id"      uuid,
  "visita_domicilio_id" uuid,
  "lead_id"             uuid,
  "created_by"          uuid REFERENCES "usuario"("id"),
  "activo"              boolean DEFAULT true NOT NULL,
  "created_at"          timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"          timestamp with time zone DEFAULT now() NOT NULL
);

-- Auto-referencia garantía padre-hijo
ALTER TABLE "orden_servicio"
  ADD CONSTRAINT "orden_servicio_orden_padre_id_fk"
    FOREIGN KEY ("orden_padre_id") REFERENCES "orden_servicio"("id");

-- FK a venta (circular: venta.orden_servicio_id ↔ orden_servicio.venta_id)
ALTER TABLE "orden_servicio"
  ADD CONSTRAINT "orden_servicio_venta_id_fk"
    FOREIGN KEY ("venta_id") REFERENCES "venta"("id");

-- FK a visita_domicilio
ALTER TABLE "orden_servicio"
  ADD CONSTRAINT "orden_servicio_visita_domicilio_id_fk"
    FOREIGN KEY ("visita_domicilio_id") REFERENCES "visita_domicilio"("id");

-- Restaurar FKs externas
ALTER TABLE "venta"
  ADD CONSTRAINT "venta_orden_servicio_id_orden_servicio_id_fk"
    FOREIGN KEY ("orden_servicio_id") REFERENCES "orden_servicio"("id");

ALTER TABLE "visita_domicilio"
  ADD CONSTRAINT "visita_domicilio_orden_servicio_id_orden_servicio_id_fk"
    FOREIGN KEY ("orden_servicio_id") REFERENCES "orden_servicio"("id");

-- ─────────────────────────────────────────────────────────
-- PASO 8: Tablas hija de orden_servicio
-- ─────────────────────────────────────────────────────────
CREATE TABLE "orden_servicio_periferico" (
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "periferico_id"     uuid NOT NULL REFERENCES "periferico"("id"),
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pk_orden_servicio_periferico"
    PRIMARY KEY ("orden_servicio_id","periferico_id")
);

CREATE TABLE "orden_servicio_componente" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "componente_id"     uuid NOT NULL REFERENCES "componente"("id"),
  "tipo_afectacion"   "tipo_afectacion" NOT NULL,
  "tipo_accion"       "tipo_accion_componente" DEFAULT 'REPARACION' NOT NULL,
  "etapa"             "etapa_componente" NOT NULL,
  "created_by"        uuid REFERENCES "usuario"("id"),
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_cotizacion" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"          uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id"  uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "tipo_item"          "tipo_item_cotizacion" NOT NULL,
  "producto_id"        uuid REFERENCES "producto"("id"),
  "componente_id"      uuid REFERENCES "componente"("id"),
  "descripcion_manual" text,
  "cantidad"           integer DEFAULT 1 NOT NULL,
  "precio_unitario"    numeric(10,2) NOT NULL,
  "subtotal"           numeric(10,2) NOT NULL,
  "es_preventivo"      boolean DEFAULT false NOT NULL,
  "created_at"         timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_evidencia" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "url"               text NOT NULL,
  "etapa"             varchar(30),
  "descripcion"       text,
  "created_by"        uuid REFERENCES "usuario"("id"),
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_sku_asignado" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"          uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id"  uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "lote_id"            uuid NOT NULL REFERENCES "lote"("id"),
  "producto_id"        uuid NOT NULL REFERENCES "producto"("id"),
  "cantidad"           integer DEFAULT 1 NOT NULL,
  "precio_presupuesto" numeric(10,2) NOT NULL,
  "estado"             "estado_sku_asignado" DEFAULT 'ASIGNADO' NOT NULL,
  "created_by"         uuid REFERENCES "usuario"("id"),
  "created_at"         timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"         timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_requerimiento" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "producto_id"       uuid REFERENCES "producto"("id"),
  "imagen_url"        text,
  "descripcion"       text NOT NULL,
  "cantidad"          integer DEFAULT 1 NOT NULL,
  "observacion"       text,
  "estado"            "estado_requerimiento" DEFAULT 'PENDIENTE' NOT NULL,
  "created_by"        uuid REFERENCES "usuario"("id"),
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_aceptacion" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"           uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id"   uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "tipo"                "tipo_aceptacion" NOT NULL,
  "canal_aceptacion"    "canal_aceptacion" NOT NULL,
  "accepted_at"         timestamp with time zone NOT NULL,
  "ip_address"          varchar(45),
  "documento_version"   varchar(20),
  "texto_mostrado"      text,
  "metodo_aceptacion"   "metodo_aceptacion",
  "approved_by"         uuid REFERENCES "usuario"("id"),
  "manual_reason"       varchar(20),
  "evidence_image_url"  text,
  "preventivo_accepted" boolean,
  "created_at"          timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_historial" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "estado_anterior"   varchar(30) NOT NULL,
  "estado_nuevo"      varchar(30) NOT NULL,
  "usuario_id"        uuid NOT NULL REFERENCES "usuario"("id"),
  "observacion"       text,
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orden_servicio_observacion" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "orden_servicio_id" uuid NOT NULL REFERENCES "orden_servicio"("id"),
  "etapa"             varchar(30) NOT NULL,
  "texto"             text NOT NULL,
  "usuario_id"        uuid NOT NULL REFERENCES "usuario"("id"),
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- PASO 9: Índices
-- ─────────────────────────────────────────────────────────
CREATE INDEX "idx_periferico_tenant_categoria"  ON "periferico"
  USING btree ("tenant_id","categoria_id");
CREATE INDEX "idx_costo_revision_tenant"        ON "costo_revision"
  USING btree ("tenant_id");
CREATE INDEX "idx_instancia_tenant_cliente"     ON "instancia"
  USING btree ("tenant_id","cliente_id");
CREATE INDEX "idx_instancia_tenant_producto"    ON "instancia"
  USING btree ("tenant_id","producto_id");
CREATE INDEX "idx_instancia_imagen_instancia"   ON "instancia_imagen"
  USING btree ("instancia_id");
CREATE INDEX "idx_os_tenant_estado"             ON "orden_servicio"
  USING btree ("tenant_id","estado");
CREATE INDEX "idx_os_tenant_instancia"          ON "orden_servicio"
  USING btree ("tenant_id","instancia_id");
CREATE INDEX "idx_os_tenant_tecnico"            ON "orden_servicio"
  USING btree ("tenant_id","tecnico_id");
CREATE INDEX "idx_os_tenant_codigo"             ON "orden_servicio"
  USING btree ("tenant_id","codigo");
CREATE INDEX "idx_os_tenant_canal"              ON "orden_servicio"
  USING btree ("tenant_id","canal");
CREATE INDEX "idx_osc_orden_servicio"           ON "orden_servicio_componente"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_oscot_orden_servicio"         ON "orden_servicio_cotizacion"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_osev_orden_servicio"          ON "orden_servicio_evidencia"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_ossku_orden_servicio"         ON "orden_servicio_sku_asignado"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_osreq_orden_servicio"         ON "orden_servicio_requerimiento"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_osac_orden_servicio"          ON "orden_servicio_aceptacion"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_osh_orden_servicio"           ON "orden_servicio_historial"
  USING btree ("orden_servicio_id");
CREATE INDEX "idx_osob_orden_servicio"          ON "orden_servicio_observacion"
  USING btree ("orden_servicio_id");

-- ─────────────────────────────────────────────────────────
-- PASO 10: RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE "periferico"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "costo_revision"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instancia"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instancia_imagen"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_periferico"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_componente"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_cotizacion"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_evidencia"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_sku_asignado"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_requerimiento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_aceptacion"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_historial"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_servicio_observacion"   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "periferico_tenant_isolation" ON "periferico"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "costo_revision_tenant_isolation" ON "costo_revision"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "instancia_tenant_isolation" ON "instancia"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "instancia_imagen_tenant_isolation" ON "instancia_imagen"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_tenant_isolation" ON "orden_servicio"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_periferico_tenant_isolation" ON "orden_servicio_periferico"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_componente_tenant_isolation" ON "orden_servicio_componente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_cotizacion_tenant_isolation" ON "orden_servicio_cotizacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_evidencia_tenant_isolation" ON "orden_servicio_evidencia"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_sku_asignado_tenant_isolation" ON "orden_servicio_sku_asignado"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_requerimiento_tenant_isolation" ON "orden_servicio_requerimiento"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_aceptacion_tenant_isolation" ON "orden_servicio_aceptacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_historial_tenant_isolation" ON "orden_servicio_historial"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
CREATE POLICY "orden_servicio_observacion_tenant_isolation" ON "orden_servicio_observacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);
