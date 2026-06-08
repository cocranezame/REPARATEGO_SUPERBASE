-- C029: Simplificar cotizacion_compra
-- Cotización = proveedor × repuesto × precio_unitario (sin estado, sin detalle, sin fechas)

-- 1. Truncar datos existentes (dev: incompatibles con nuevo diseño)
TRUNCATE TABLE cotizacion_compra_detalle;
TRUNCATE TABLE cotizacion_compra;

-- 2. Drop tabla detalle (ahora el producto vive en el header)
DROP TABLE IF EXISTS cotizacion_compra_detalle;

-- 3. Eliminar columnas del header que ya no aplican
ALTER TABLE cotizacion_compra
  DROP COLUMN IF EXISTS codigo,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS fecha_solicitud,
  DROP COLUMN IF EXISTS fecha_respuesta,
  DROP COLUMN IF EXISTS fecha_vencimiento,
  DROP COLUMN IF EXISTS usuario_id,
  DROP COLUMN IF EXISTS activo;

-- 4. Agregar producto_id y precio_unitario al header
ALTER TABLE cotizacion_compra
  ADD COLUMN producto_id UUID NOT NULL REFERENCES producto(id),
  ADD COLUMN precio_unitario DECIMAL(12, 2);

-- 5. Índices de búsqueda
DROP INDEX IF EXISTS idx_cotizacion_compra_tenant_estado;

CREATE INDEX idx_cotizacion_compra_producto ON cotizacion_compra(tenant_id, producto_id);

-- 6. Unicidad: un precio por proveedor × repuesto × tenant
CREATE UNIQUE INDEX uq_cotizacion_proveedor_producto
  ON cotizacion_compra(tenant_id, proveedor_id, producto_id);

-- 7. Eliminar enum que ya no se usa
DROP TYPE IF EXISTS estado_cotizacion_compra;
