# DB — Pagos a Proveedores

> Tabla de pagos a proveedores.
> Épica: E9

## Tablas

### pago_proveedor

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| orden_compra_id | UUID | NO | | FK → orden_compra.id |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| monto | DECIMAL(12,2) | NO | | |
| metodo_pago | VARCHAR(30) | NO | | TRANSFERENCIA, EFECTIVO, CHEQUE |
| referencia | VARCHAR(100) | SI | | Nro operación bancaria |
| comprobante_url | VARCHAR(500) | SI | | URL del comprobante en S3 |
| fecha_pago | DATE | NO | | |
| notas | TEXT | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id |
| created_at | TIMESTAMPTZ | NO | now() | |

## Reglas de negocio

- Un pago siempre está asociado a una orden de compra
- Al registrar el pago, la OC pasa de PENDIENTE_PAGO → TERMINADA
- El comprobante de pago (foto/PDF) se sube a S3
