-- C028: precio_venta deja de ser requerido en creación de repuesto
-- El precio de venta lo gestiona el módulo de Tasas %, no el formulario del repuesto
ALTER TABLE producto ALTER COLUMN precio_venta SET DEFAULT 0;
