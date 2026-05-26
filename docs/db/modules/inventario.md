# DB — Inventario

> Tablas de productos, compatibilidades, tasas de precio, lotes y movimientos.
> Épicas: E4 (productos), E8 (lotes y movimientos)

## Tablas

### producto

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(30) | NO | | Autogenerado: PRD-XXXX o SRV-XXXX |
| tipo | VARCHAR(10) | NO | | PRODUCTO, SERVICIO |
| nombre | VARCHAR(200) | NO | | |
| descripcion | TEXT | SI | | |
| categoria_id | UUID | NO | | FK → categoria.id |
| componente_id | UUID | SI | | FK → componente.id |
| marca_id | UUID | SI | | FK → marca.id |
| unidad_medida | VARCHAR(10) | NO | 'UND' | UND, MTS, KG, etc. |
| precio_compra | DECIMAL(12,2) | SI | | Último precio de compra |
| precio_venta | DECIMAL(12,2) | NO | | Precio de venta al público |
| stock_minimo | INT | NO | 0 | Alerta cuando stock < esto |
| imagen_url | VARCHAR(500) | SI | | URL principal en S3 |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, codigo)` UNIQUE, `(tenant_id, categoria_id)`, `(tenant_id, nombre)` para búsqueda

### producto_compatibilidad

Relación N:M entre producto y modelo (qué productos son compatibles con qué modelos).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| producto_id | UUID | NO | | FK → producto.id |
| modelo_id | UUID | NO | | FK → modelo.id |
| created_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, producto_id, modelo_id)` UNIQUE

### tasa_precio

Tasas de ganancia para cálculo automático de precio_venta.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(50) | NO | | Ej: "Margen estándar", "Margen premium" |
| porcentaje | DECIMAL(5,2) | NO | | Ej: 30.00 = 30% |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### metodo_pago_catalogo

Catálogo de métodos de pago aceptados.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(50) | NO | | EFECTIVO, YAPE, PLIN, TRANSFERENCIA, TARJETA |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### lote

Lote de ingreso de productos (vinculado a una orden de compra).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| producto_id | UUID | NO | | FK → producto.id |
| sucursal_id | UUID | NO | | FK → sucursal.id |
| orden_compra_id | UUID | SI | | FK → orden_compra.id |
| sku | VARCHAR(50) | NO | | SKU generado |
| cantidad_inicial | INT | NO | | Cantidad al momento del ingreso |
| cantidad_actual | INT | NO | | Cantidad actual (disminuye con movimientos) |
| precio_unitario | DECIMAL(12,2) | NO | | Precio de compra unitario |
| fecha_ingreso | DATE | NO | | |
| fecha_vencimiento | DATE | SI | | Si aplica |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### movimiento_inventario

Registro de toda entrada/salida de stock.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| producto_id | UUID | NO | | FK → producto.id |
| lote_id | UUID | SI | | FK → lote.id |
| sucursal_id | UUID | NO | | FK → sucursal.id |
| tipo | VARCHAR(20) | NO | | INGRESO, VENTA, SERVICIO, MERMA, REAJUSTE, TRANSFERENCIA |
| cantidad | INT | NO | | Positivo=entrada, negativo=salida |
| referencia_tipo | VARCHAR(30) | SI | | ORDEN_COMPRA, VENTA, ORDEN_SERVICIO |
| referencia_id | UUID | SI | | ID del documento origen |
| notas | TEXT | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id (quién hizo el movimiento) |
| created_at | TIMESTAMPTZ | NO | now() | |

## Enums

```sql
CREATE TYPE tipo_producto AS ENUM ('PRODUCTO', 'SERVICIO');
CREATE TYPE tipo_movimiento AS ENUM ('INGRESO', 'VENTA', 'SERVICIO', 'MERMA', 'REAJUSTE', 'TRANSFERENCIA');
```

## Reglas de negocio

- Código de producto autogenerado: PRD-0001 (producto) o SRV-0001 (servicio)
- Stock se calcula como SUM(movimiento_inventario.cantidad) por producto+sucursal
- También se puede consultar por lote (cantidad_actual)
- Tasa de precio: precio_venta = precio_compra * (1 + porcentaje/100)
- Stock mínimo genera alerta visual en el dashboard
- Movimientos son inmutables (no se editan, se crean nuevos de tipo REAJUSTE)
