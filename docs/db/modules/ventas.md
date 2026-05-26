# DB — Ventas

> Tablas de caja, ventas, pagos, envíos y cotizaciones de venta.
> Épica: E11

## Tablas

### caja

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| sucursal_id | UUID | NO | | FK → sucursal.id |
| usuario_id | UUID | NO | | FK → usuario.id (cajero) |
| monto_apertura | DECIMAL(12,2) | NO | | |
| monto_cierre | DECIMAL(12,2) | SI | | Se llena al cerrar |
| fecha_apertura | TIMESTAMPTZ | NO | now() | |
| fecha_cierre | TIMESTAMPTZ | SI | | |
| estado | VARCHAR(10) | NO | 'ABIERTA' | ABIERTA, CERRADA |
| notas_cierre | TEXT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### venta

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: V-XXXX |
| caja_id | UUID | NO | | FK → caja.id |
| sucursal_id | UUID | NO | | FK → sucursal.id |
| cliente_id | UUID | SI | | FK → cliente.id (puede ser venta sin cliente) |
| tipo_venta | VARCHAR(25) | NO | 'LIBRE' | LIBRE, SERVICIO, REVISION_DOMICILIO, REVISION_DEVOLUCION |
| orden_servicio_id | UUID | SI | | FK → orden_servicio.id (si tipo=SERVICIO) |
| visita_domicilio_id | UUID | SI | | FK → visita_domicilio.id (si tipo=REVISION_DOMICILIO) |
| subtotal | DECIMAL(12,2) | NO | 0 | |
| descuento | DECIMAL(12,2) | NO | 0 | |
| igv | DECIMAL(12,2) | NO | 0 | |
| total | DECIMAL(12,2) | NO | 0 | |
| estado | VARCHAR(15) | NO | 'PENDIENTE' | PENDIENTE, PAGADA, PARCIAL, ANULADA |
| tipo_comprobante | VARCHAR(10) | SI | | BOLETA, FACTURA, NOTA_VENTA |
| serie_comprobante | VARCHAR(10) | SI | | |
| numero_comprobante | VARCHAR(15) | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id (vendedor/cajero) |
| notas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### venta_item

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| venta_id | UUID | NO | | FK → venta.id |
| producto_id | UUID | SI | | FK → producto.id |
| descripcion | VARCHAR(200) | NO | | |
| cantidad | INT | NO | | |
| precio_unitario | DECIMAL(12,2) | NO | | |
| descuento | DECIMAL(12,2) | NO | 0 | |
| subtotal | DECIMAL(12,2) | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |

### venta_pago

Pagos de una venta (soporta multi-método y pago parcial).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| venta_id | UUID | NO | | FK → venta.id |
| metodo_pago_id | UUID | NO | | FK → metodo_pago_catalogo.id |
| monto | DECIMAL(12,2) | NO | | |
| referencia | VARCHAR(100) | SI | | Nro operación, voucher, etc. |
| fecha_pago | TIMESTAMPTZ | NO | now() | |
| created_at | TIMESTAMPTZ | NO | now() | |

### venta_envio

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| venta_id | UUID | NO | | FK → venta.id |
| direccion_id | UUID | SI | | FK → cliente_direccion.id |
| direccion_texto | VARCHAR(255) | NO | | |
| estado | VARCHAR(15) | NO | 'PENDIENTE' | PENDIENTE, EN_CAMINO, ENTREGADO |
| fecha_envio | TIMESTAMPTZ | SI | | |
| fecha_entrega | TIMESTAMPTZ | SI | | |
| costo_envio | DECIMAL(12,2) | NO | 0 | |
| notas | TEXT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### cotizacion_venta

Cotización referencial para un cliente.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: COT-V-XXXX |
| cliente_id | UUID | SI | | FK → cliente.id |
| subtotal | DECIMAL(12,2) | NO | 0 | |
| igv | DECIMAL(12,2) | NO | 0 | |
| total | DECIMAL(12,2) | NO | 0 | |
| estado | VARCHAR(15) | NO | 'BORRADOR' | BORRADOR, ENVIADA, APROBADA, RECHAZADA, VENCIDA |
| fecha_vencimiento | DATE | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id |
| notas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### cotizacion_venta_item

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| cotizacion_venta_id | UUID | NO | | FK → cotizacion_venta.id |
| producto_id | UUID | SI | | FK → producto.id |
| descripcion | VARCHAR(200) | NO | | |
| cantidad | INT | NO | | |
| precio_unitario | DECIMAL(12,2) | NO | | |
| subtotal | DECIMAL(12,2) | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |

## Enums

```sql
CREATE TYPE tipo_venta AS ENUM ('LIBRE', 'SERVICIO', 'REVISION_DOMICILIO', 'REVISION_DEVOLUCION');
CREATE TYPE estado_venta AS ENUM ('PENDIENTE', 'PAGADA', 'PARCIAL', 'ANULADA');
CREATE TYPE tipo_comprobante AS ENUM ('BOLETA', 'FACTURA', 'NOTA_VENTA');
CREATE TYPE estado_cotizacion_venta AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');
```

## Reglas de negocio

- Venta siempre asociada a una caja abierta
- Tipos de venta: LIBRE (productos sueltos), SERVICIO (cobro de OS), REVISION_DOMICILIO (cobro de visita cancelada), REVISION_DEVOLUCION
- Soporta pago multi-método (ej: parte Yape, parte efectivo)
- Anulación revierte movimientos de stock
- IGV 18% (configurable por tenant)
