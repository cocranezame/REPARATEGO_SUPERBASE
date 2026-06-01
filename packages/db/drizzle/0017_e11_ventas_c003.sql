-- ═══════════════════════════════════════════════════════════════════════════════
-- E11.1 — Ventas C003: Actualizar schema módulo ventas
-- Dev env: alter in-place (sin datos de producción)
-- Aplicar: psql -h localhost -p 5435 -U postgres -d reparatego_dev -f packages/db/drizzle/0017_e11_ventas_c003.sql
-- Refs: docs/db/modules/ventas.md, corrections-log.md#C003, corrections-log.md#C016
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- PASO 1: Drop columnas que usan ENUMs a eliminar (antes de DROP TYPE)
-- ─────────────────────────────────────────────────────────
ALTER TABLE venta
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS tipo_comprobante,
  DROP COLUMN IF EXISTS serie_comprobante,
  DROP COLUMN IF EXISTS numero_comprobante,
  DROP COLUMN IF EXISTS subtotal,
  DROP COLUMN IF EXISTS descuento,
  DROP COLUMN IF EXISTS igv,
  DROP COLUMN IF EXISTS notas,
  DROP COLUMN IF EXISTS activo;

ALTER TABLE cotizacion_venta
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS subtotal,
  DROP COLUMN IF EXISTS igv,
  DROP COLUMN IF EXISTS fecha_vencimiento,
  DROP COLUMN IF EXISTS notas,
  DROP COLUMN IF EXISTS activo;

-- ─────────────────────────────────────────────────────────
-- PASO 2: Drop ENUMs obsoletos
-- ─────────────────────────────────────────────────────────
DROP TYPE IF EXISTS estado_venta;
DROP TYPE IF EXISTS tipo_comprobante;
DROP TYPE IF EXISTS estado_cotizacion_venta;

-- ─────────────────────────────────────────────────────────
-- PASO 3: Crear nuevos ENUMs C003
-- ─────────────────────────────────────────────────────────
CREATE TYPE "public"."estado_caja"           AS ENUM('ABIERTA', 'CERRADA');
CREATE TYPE "public"."estado_pago_venta"     AS ENUM('PAGO_PENDIENTE', 'COMPLETADA', 'ANULADA');
CREATE TYPE "public"."estado_despacho_venta" AS ENUM('SIN_ENVIO', 'ENVIO_PENDIENTE', 'DESPACHADO');
CREATE TYPE "public"."tipo_item_venta"       AS ENUM('PRODUCTO', 'SERVICIO', 'ENVIO', 'MANUAL');
CREATE TYPE "public"."estado_envio_venta"    AS ENUM('PENDIENTE', 'DESPACHADO');

-- ─────────────────────────────────────────────────────────
-- PASO 4: tabla caja
-- ─────────────────────────────────────────────────────────
ALTER TABLE caja RENAME COLUMN monto_apertura TO monto_inicial;
ALTER TABLE caja
  DROP COLUMN IF EXISTS monto_cierre,
  DROP COLUMN IF EXISTS notas_cierre;
ALTER TABLE caja
  ADD COLUMN IF NOT EXISTS monto_esperado numeric(12,2),
  ADD COLUMN IF NOT EXISTS monto_fisico   numeric(12,2),
  ADD COLUMN IF NOT EXISTS diferencia     numeric(12,2);
-- estado: varchar(10) → estado_caja ENUM (valores 'ABIERTA'/'CERRADA' son compatibles)
ALTER TABLE caja
  ALTER COLUMN estado TYPE estado_caja USING estado::estado_caja,
  ALTER COLUMN estado SET DEFAULT 'ABIERTA'::estado_caja;

-- ─────────────────────────────────────────────────────────
-- PASO 5: tabla venta — agregar campos C003 y renombrar
-- ─────────────────────────────────────────────────────────
ALTER TABLE venta
  ADD COLUMN IF NOT EXISTS estado_pago        estado_pago_venta     NOT NULL DEFAULT 'PAGO_PENDIENTE',
  ADD COLUMN IF NOT EXISTS estado_despacho    estado_despacho_venta NOT NULL DEFAULT 'SIN_ENVIO',
  ADD COLUMN IF NOT EXISTS motivo_anulacion   text,
  ADD COLUMN IF NOT EXISTS anulado_por        uuid REFERENCES usuario(id),
  ADD COLUMN IF NOT EXISTS nota_credito_monto numeric(12,2);
-- usuario_id → created_by (vendedor que generó la venta, V2)
ALTER TABLE venta RENAME COLUMN usuario_id TO created_by;

-- ─────────────────────────────────────────────────────────
-- PASO 6: tabla venta_item — agregar campos C003
-- ─────────────────────────────────────────────────────────
ALTER TABLE venta_item DROP COLUMN IF EXISTS descuento;
ALTER TABLE venta_item
  ADD COLUMN IF NOT EXISTS tipo_item     tipo_item_venta NOT NULL DEFAULT 'PRODUCTO',
  ADD COLUMN IF NOT EXISTS lote_id       uuid REFERENCES lote(id),
  ADD COLUMN IF NOT EXISTS sku           varchar(30),
  ADD COLUMN IF NOT EXISTS numero_serie  varchar(100),
  ADD COLUMN IF NOT EXISTS es_preventivo boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────
-- PASO 7: tabla venta_pago — agregar campos C003
-- Nullable: NOT NULL se aplica a nivel de aplicación en E11.5
-- ─────────────────────────────────────────────────────────
ALTER TABLE venta_pago
  ADD COLUMN IF NOT EXISTS caja_id    uuid REFERENCES caja(id),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES usuario(id);

-- ─────────────────────────────────────────────────────────
-- PASO 8: tabla venta_envio
-- ─────────────────────────────────────────────────────────
ALTER TABLE venta_envio
  DROP COLUMN IF EXISTS fecha_envio,
  DROP COLUMN IF EXISTS fecha_entrega,
  DROP COLUMN IF EXISTS notas;
-- direccion_texto: era NOT NULL, ahora nullable (C003 usa direccion_id)
ALTER TABLE venta_envio ALTER COLUMN direccion_texto DROP NOT NULL;
ALTER TABLE venta_envio
  ADD COLUMN IF NOT EXISTS metodo_envio     varchar(100),
  ADD COLUMN IF NOT EXISTS fecha_programada date;
-- estado: varchar(15) → estado_envio_venta ENUM
-- Normalizar valores no estándar antes del cast (en caso de datos seed)
UPDATE venta_envio SET estado = 'PENDIENTE' WHERE estado NOT IN ('PENDIENTE', 'DESPACHADO');
ALTER TABLE venta_envio
  ALTER COLUMN estado TYPE estado_envio_venta USING estado::estado_envio_venta,
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE'::estado_envio_venta;
-- 1 envío por venta (C003)
ALTER TABLE venta_envio
  ADD CONSTRAINT uq_venta_envio_venta_id UNIQUE (venta_id);

-- ─────────────────────────────────────────────────────────
-- PASO 9: tabla cotizacion_venta — simplificar a referencial puro (C003)
-- ─────────────────────────────────────────────────────────
ALTER TABLE cotizacion_venta RENAME COLUMN total      TO total_referencial;
ALTER TABLE cotizacion_venta RENAME COLUMN usuario_id TO created_by;
ALTER TABLE cotizacion_venta
  ADD COLUMN IF NOT EXISTS caja_id uuid REFERENCES caja(id);

-- ─────────────────────────────────────────────────────────
-- PASO 10: Índices
-- ─────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_venta_tenant_estado;
DROP INDEX IF EXISTS idx_cotizacion_venta_tenant_estado;

CREATE INDEX IF NOT EXISTS idx_venta_tenant_estado_pago
  ON venta USING btree (tenant_id, estado_pago);
CREATE INDEX IF NOT EXISTS idx_venta_tenant_estado_despacho
  ON venta USING btree (tenant_id, estado_despacho);
CREATE INDEX IF NOT EXISTS idx_venta_item_sku
  ON venta_item USING btree (tenant_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venta_item_tipo
  ON venta_item USING btree (venta_id, tipo_item);
