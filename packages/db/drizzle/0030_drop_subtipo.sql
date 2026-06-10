ALTER TABLE producto DROP COLUMN IF EXISTS subtipo_id;
DROP INDEX IF EXISTS uq_subtipo_repuesto_tenant_comp_nombre;
DROP INDEX IF EXISTS idx_subtipo_repuesto_tenant_comp;
DROP TABLE IF EXISTS subtipo_repuesto;
