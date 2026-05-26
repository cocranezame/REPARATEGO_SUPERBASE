# DB — Compras

> Tablas de cotizaciones de compra, solicitudes, órdenes de compra.
> Épicas: E6 (cotizaciones), E7 (solicitudes + OC)

## Tablas

### cotizacion_compra

Solicitud de precios enviada a un proveedor.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: COT-C-XXXX |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| estado | VARCHAR(20) | NO | 'PENDIENTE' | PENDIENTE, COTIZADA, VENCIDA |
| fecha_solicitud | DATE | NO | | |
| fecha_respuesta | DATE | SI | | Cuando el proveedor responde |
| fecha_vencimiento | DATE | SI | | |
| notas | TEXT | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### cotizacion_compra_detalle

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| cotizacion_compra_id | UUID | NO | | FK → cotizacion_compra.id |
| producto_id | UUID | NO | | FK → producto.id |
| cantidad | INT | NO | | |
| precio_unitario | DECIMAL(12,2) | SI | | Se llena cuando el proveedor cotiza |
| subtotal | DECIMAL(12,2) | SI | | |
| notas | TEXT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |

### solicitud_compra

Solicitud interna para comprar un producto (puede nacer de alerta stock mínimo).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| producto_id | UUID | NO | | FK → producto.id |
| cantidad_solicitada | INT | NO | | |
| prioridad | VARCHAR(10) | NO | 'NORMAL' | BAJA, NORMAL, ALTA, URGENTE |
| estado | VARCHAR(20) | NO | 'PENDIENTE' | PENDIENTE, EN_OC, COMPLETADA |
| orden_compra_id | UUID | SI | | FK → orden_compra.id (cuando se asigna) |
| usuario_id | UUID | NO | | FK → usuario.id (quién solicita) |
| notas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### orden_compra

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: OC-XXXX |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| estado | VARCHAR(20) | NO | 'GENERADA' | GENERADA, ENVIADA, TERMINADA, INGRESADA, PENDIENTE_PAGO |
| fecha_emision | DATE | NO | | |
| fecha_entrega_estimada | DATE | SI | | |
| subtotal | DECIMAL(12,2) | NO | 0 | |
| igv | DECIMAL(12,2) | NO | 0 | |
| total | DECIMAL(12,2) | NO | 0 | |
| notas | TEXT | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### orden_compra_confirmacion

Detalle de confirmación item por item (qué llegó realmente).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| orden_compra_id | UUID | NO | | FK → orden_compra.id |
| producto_id | UUID | NO | | FK → producto.id |
| cantidad_ordenada | INT | NO | | |
| cantidad_recibida | INT | NO | 0 | |
| precio_unitario | DECIMAL(12,2) | NO | | |
| conforme | BOOLEAN | SI | | |
| notas | TEXT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Enums

```sql
CREATE TYPE estado_cotizacion_compra AS ENUM ('PENDIENTE', 'COTIZADA', 'VENCIDA');
CREATE TYPE prioridad_solicitud AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');
CREATE TYPE estado_solicitud_compra AS ENUM ('PENDIENTE', 'EN_OC', 'COMPLETADA');
CREATE TYPE estado_orden_compra AS ENUM ('GENERADA', 'ENVIADA', 'TERMINADA', 'INGRESADA', 'PENDIENTE_PAGO');
```

## Flujos

1. **Cotización:** Crear cotización → Enviar a proveedor → Proveedor cotiza precios → COTIZADA
2. **Solicitud → OC:** Solicitudes PENDIENTE → Agrupar por proveedor → Generar OC → GENERADA
3. **OC:** GENERADA → ENVIADA → TERMINADA (proveedor entrega) → Confirmar items → INGRESADA (genera lotes) → PENDIENTE_PAGO
