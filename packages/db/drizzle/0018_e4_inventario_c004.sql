-- ═══════════════════════════════════════════════════════════════════════════════
-- E4 — Inventario C004: lote.correlativo + refactor tasa_precio jerarquía
-- NOTA: stock_minimo en producto ya existe desde migración 0004 — sin acción.
-- Dev env: alter in-place (sin datos de producción)
-- Aplicar: psql -h localhost -p 5435 -U postgres -d reparatego_dev -f packages/db/drizzle/0018_e4_inventario_c004.sql
-- Refs: docs/db/modules/inventario.md, corrections-log.md#C004, corrections-log.md#C016
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- PASO 1: Agregar correlativo a lote (C004 — lógica dual de SKU)
-- Lotes existentes reciben correlativo=1 (valor por defecto correcto:
-- el primer lote de un producto en un día siempre es correlativo 1)
-- ─────────────────────────────────────────────────────────
ALTER TABLE lote
  ADD COLUMN IF NOT EXISTS correlativo INTEGER NOT NULL DEFAULT 1;

-- ─────────────────────────────────────────────────────────
-- PASO 2: ENUMs para la tasa_precio refactorizada
-- ─────────────────────────────────────────────────────────
CREATE TYPE "public"."nivel_tasa_precio"  AS ENUM('POR_REPUESTO', 'POR_TIPO', 'POR_COMPONENTE');
CREATE TYPE "public"."tipo_registro_tasa" AS ENUM('PRODUCTO', 'SERVICIO');
CREATE TYPE "public"."tasa_tipo"          AS ENUM('PORCENTAJE', 'FIJO');

-- ─────────────────────────────────────────────────────────
-- PASO 3: Refactorizar tasa_precio — jerarquía de precios (C003/C004)
-- Schema anterior: nombre, porcentaje, activo (lista genérica sin FK a producto)
-- Schema nuevo: nivel + producto_id|tipo_registro|componente_id (jerarquía)
-- Sin seed data ni referencias en API/Web → TRUNCATE seguro
-- ─────────────────────────────────────────────────────────

-- 3a. Limpiar datos con schema incompatible
TRUNCATE TABLE tasa_precio;

-- 3b. Eliminar columnas del schema anterior
ALTER TABLE tasa_precio
  DROP COLUMN IF EXISTS nombre,
  DROP COLUMN IF EXISTS porcentaje,
  DROP COLUMN IF EXISTS activo;

-- 3c. Agregar columnas del nuevo schema
--     La tabla está vacía tras TRUNCATE: NOT NULL sin DEFAULT es válido en PostgreSQL
ALTER TABLE tasa_precio
  ADD COLUMN IF NOT EXISTS nivel              nivel_tasa_precio  NOT NULL,
  ADD COLUMN IF NOT EXISTS producto_id        uuid,
  ADD COLUMN IF NOT EXISTS tipo_registro      tipo_registro_tasa,
  ADD COLUMN IF NOT EXISTS componente_id      uuid,
  ADD COLUMN IF NOT EXISTS tasa_tipo          tasa_tipo          NOT NULL,
  ADD COLUMN IF NOT EXISTS tasa_valor         numeric(10,2)      NOT NULL,
  ADD COLUMN IF NOT EXISTS ultimo_costo       numeric(10,2),
  ADD COLUMN IF NOT EXISTS promedio_historico numeric(10,2),
  ADD COLUMN IF NOT EXISTS precio_venta       numeric(10,2),
  ADD COLUMN IF NOT EXISTS created_by         uuid               NOT NULL;

-- 3d. Foreign keys explícitas (tenant_id ya tiene FK desde migración 0004)
ALTER TABLE tasa_precio
  ADD CONSTRAINT tasa_precio_producto_id_fk
    FOREIGN KEY (producto_id) REFERENCES producto(id),
  ADD CONSTRAINT tasa_precio_componente_id_fk
    FOREIGN KEY (componente_id) REFERENCES componente(id),
  ADD CONSTRAINT tasa_precio_created_by_fk
    FOREIGN KEY (created_by) REFERENCES usuario(id);

-- 3e. Índices únicos parciales (con tenant_id para aislamiento multi-tenant)
--     Un registro por nivel dentro del tenant — garantía de unicidad por jerarquía
CREATE UNIQUE INDEX uq_tasa_precio_repuesto
  ON tasa_precio (tenant_id, producto_id)
  WHERE nivel = 'POR_REPUESTO';

CREATE UNIQUE INDEX uq_tasa_precio_tipo
  ON tasa_precio (tenant_id, tipo_registro)
  WHERE nivel = 'POR_TIPO';

CREATE UNIQUE INDEX uq_tasa_precio_componente
  ON tasa_precio (tenant_id, componente_id)
  WHERE nivel = 'POR_COMPONENTE';

-- ─────────────────────────────────────────────────────────
-- PENDIENTE — C018: rol ASISTENTE (separado de C004, ver corrections-log.md#C018)
-- ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'ASISTENTE';
-- ─────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después de aplicar)
-- ─────────────────────────────────────────────────────────
-- Columnas tasa_precio:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'tasa_precio' ORDER BY ordinal_position;
--
-- Columna correlativo en lote:
--   SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'lote' AND column_name = 'correlativo';
--
-- ENUMs creados:
--   SELECT typname, enumlabel FROM pg_enum
--   JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
--   WHERE typname IN ('nivel_tasa_precio','tipo_registro_tasa','tasa_tipo')
--   ORDER BY typname, enumsortorder;
