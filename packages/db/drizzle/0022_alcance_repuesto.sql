-- 0022: Add alcance_repuesto enum and alcance column to producto
CREATE TYPE alcance_repuesto AS ENUM ('GLOBAL', 'CATEGORIA', 'MARCA', 'COMPATIBILIDAD');
ALTER TABLE producto ADD COLUMN alcance alcance_repuesto DEFAULT 'GLOBAL';
