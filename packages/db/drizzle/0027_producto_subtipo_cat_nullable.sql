-- C032: subtipo field + nullable categoria_id para productos GLOBAL
ALTER TABLE producto ADD COLUMN IF NOT EXISTS subtipo VARCHAR(50);
ALTER TABLE producto ALTER COLUMN categoria_id DROP NOT NULL;
