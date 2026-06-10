-- C030: tabla N:M para alcance CATEGORIA
-- Un repuesto puede estar asociado a múltiples pares (categoria, componente)

CREATE TABLE IF NOT EXISTS producto_categoria_componente (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant(id),
  producto_id   UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  categoria_id  UUID NOT NULL REFERENCES categoria(id),
  componente_id UUID REFERENCES componente(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prod_cat_comp
  ON producto_categoria_componente (tenant_id, producto_id, categoria_id, COALESCE(componente_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- RLS
ALTER TABLE producto_categoria_componente ENABLE ROW LEVEL SECURITY;

CREATE POLICY pcc_tenant_isolation ON producto_categoria_componente
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
