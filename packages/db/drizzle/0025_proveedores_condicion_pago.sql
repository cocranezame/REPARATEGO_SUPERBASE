-- 0025_proveedores_condicion_pago.sql
-- Nueva tabla condicion_pago + nuevos campos en proveedor y proveedor_metodo_pago

-- 1. Tabla condicion_pago (catálogo de plazos de pago por tenant)
CREATE TABLE condicion_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  nombre VARCHAR(100) NOT NULL,
  dias_credito INTEGER NOT NULL DEFAULT 0,
  es_default BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_condicion_pago_tenant_nombre ON condicion_pago(tenant_id, nombre);

ALTER TABLE condicion_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY condicion_pago_tenant_isolation ON condicion_pago
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- 2. Nuevos campos en proveedor
ALTER TABLE proveedor
  ADD COLUMN IF NOT EXISTS contacto_nombre VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telefono2 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(100),
  ADD COLUMN IF NOT EXISTS condicion_pago_id UUID REFERENCES condicion_pago(id),
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 3. Nuevo campo en proveedor_metodo_pago
ALTER TABLE proveedor_metodo_pago
  ADD COLUMN IF NOT EXISTS tipo_cuenta VARCHAR(20);
