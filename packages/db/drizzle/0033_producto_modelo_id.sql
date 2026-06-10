-- C008: agregar modelo_id a producto (identifica el equipo concreto)
ALTER TABLE producto
  ADD COLUMN IF NOT EXISTS modelo_id UUID REFERENCES modelo(id);

CREATE INDEX IF NOT EXISTS idx_producto_modelo
  ON producto(modelo_id)
  WHERE modelo_id IS NOT NULL;

-- Limpiar instancias corruptas (producto_id apuntando a repuesto = componente_id IS NOT NULL)
DELETE FROM instancia
WHERE producto_id IN (
  SELECT id FROM producto WHERE componente_id IS NOT NULL
);
