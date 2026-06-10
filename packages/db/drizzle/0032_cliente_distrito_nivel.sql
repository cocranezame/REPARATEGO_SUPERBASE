-- C033: añade distrito y nivel a la tabla cliente
ALTER TABLE cliente
  ADD COLUMN IF NOT EXISTS distrito VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nivel    VARCHAR(10) NOT NULL DEFAULT 'NORMAL';
