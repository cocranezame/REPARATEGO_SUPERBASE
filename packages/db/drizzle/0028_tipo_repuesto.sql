-- C033: tabla tipo_repuesto (jerarquía categoría → componente → tipo)
CREATE TABLE IF NOT EXISTS tipo_repuesto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenant(id),
  componente_id UUID NOT NULL REFERENCES componente(id),
  nombre      VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tipo_repuesto_tenant_comp_nombre
  ON tipo_repuesto(tenant_id, componente_id, nombre);
CREATE INDEX IF NOT EXISTS idx_tipo_repuesto_tenant_comp
  ON tipo_repuesto(tenant_id, componente_id);

ALTER TABLE producto ADD COLUMN IF NOT EXISTS tipo_repuesto_id UUID REFERENCES tipo_repuesto(id);
