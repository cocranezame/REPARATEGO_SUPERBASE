-- [C009-A] Backfill: inserta movimiento de RESERVA para cada SKU en estado ASIGNADO
-- que no tenga ya un movimiento de reserva asociado (datos legacy pre-C009).
-- Safe to run multiple times (NOT EXISTS guard).

DO $$
DECLARE
  sku_row RECORD;
BEGIN
  FOR sku_row IN
    SELECT
      s.id,
      s.tenant_id,
      s.orden_servicio_id,
      s.lote_id,
      s.producto_id,
      s.cantidad,
      s.created_by,
      o.sucursal_id
    FROM orden_servicio_sku_asignado s
    JOIN orden_servicio o ON o.id = s.orden_servicio_id
    WHERE s.estado = 'ASIGNADO'
      AND o.sucursal_id IS NOT NULL
      AND s.created_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM movimiento_inventario m
        WHERE m.lote_id = s.lote_id
          AND m.referencia_id = s.orden_servicio_id
          AND m.tipo = 'SERVICIO'
          AND m.cantidad < 0
          AND m.notas = 'RESERVA-OS-' || s.orden_servicio_id::text
      )
  LOOP
    INSERT INTO movimiento_inventario (
      id,
      tenant_id,
      producto_id,
      lote_id,
      sucursal_id,
      tipo,
      cantidad,
      referencia_tipo,
      referencia_id,
      notas,
      usuario_id,
      created_at
    ) VALUES (
      gen_random_uuid(),
      sku_row.tenant_id,
      sku_row.producto_id,
      sku_row.lote_id,
      sku_row.sucursal_id,
      'SERVICIO',
      -sku_row.cantidad,
      'orden_servicio',
      sku_row.orden_servicio_id,
      'RESERVA-OS-' || sku_row.orden_servicio_id::text,
      sku_row.created_by,
      NOW()
    );
  END LOOP;
END $$;
