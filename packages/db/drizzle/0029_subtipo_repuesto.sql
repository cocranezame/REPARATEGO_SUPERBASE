CREATE TABLE IF NOT EXISTS subtipo_repuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  componente_id UUID NOT NULL REFERENCES componente(id),
  nombre VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subtipo_repuesto_tenant_comp_nombre
  ON subtipo_repuesto(tenant_id, componente_id, nombre);
CREATE INDEX IF NOT EXISTS idx_subtipo_repuesto_tenant_comp
  ON subtipo_repuesto(tenant_id, componente_id);
ALTER TABLE producto DROP COLUMN IF EXISTS subtipo;
ALTER TABLE producto ADD COLUMN IF NOT EXISTS subtipo_id UUID REFERENCES subtipo_repuesto(id);
