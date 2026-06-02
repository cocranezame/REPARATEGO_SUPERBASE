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
| imagen_url | VARCHAR(500) | SI | | URL principal en S3 |
| activo | BOOLEAN | NO | true | |
| stock_minimo | INT | NO | 0 | Alerta de reabastecimiento cuando stock < esto |
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

Tasas de ganancia con jerarquía de 3 niveles para cálculo automático de precio_venta.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| tasa_id | SERIAL | NO | | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nivel | ENUM | NO | | POR_REPUESTO, POR_TIPO, POR_COMPONENTE |
| producto_id | UUID | SI | | FK → producto.id — NOT NULL si nivel=POR_REPUESTO |
| tipo_registro | ENUM | SI | | PRODUCTO, SERVICIO — solo si nivel=POR_TIPO |
| componente_id | UUID | SI | | FK → componente.id — solo si nivel=POR_COMPONENTE |
| tasa_tipo | ENUM | NO | | PORCENTAJE, FIJO |
| tasa_valor | DECIMAL(10,2) | NO | | Valor de la tasa |
| ultimo_costo | DECIMAL(10,2) | SI | | Costo del último ingreso — solo POR_REPUESTO |
| promedio_historico | DECIMAL(10,2) | SI | | Promedio histórico de costos — solo POR_REPUESTO |
| precio_venta | DECIMAL(10,2) | SI | | Calculado: ultimo_costo + tasa — solo POR_REPUESTO |
| created_by | UUID | NO | | FK → usuario.id |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Jerarquía:** POR_REPUESTO > POR_TIPO > POR_COMPONENTE. Se toma la más específica disponible.

**Recálculo automático:** precio_venta se recalcula al cambiar tasa o al registrar nuevo ingreso.

**Índices únicos parciales:**
- `(producto_id)` WHERE nivel='POR_REPUESTO'
- `(tipo_registro)` WHERE nivel='POR_TIPO'
- `(componente_id)` WHERE nivel='POR_COMPONENTE'

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
| sku | VARCHAR(50) | NO | | SKU generado: código_producto + DDMMAA + correlativo |
| correlativo | INT | NO | 1 | Correlativo para SKUs del mismo producto + día + diferente proveedor |
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
- Tasa de precio: jerarquía POR_REPUESTO > POR_TIPO > POR_COMPONENTE; precio_venta = ultimo_costo + tasa aplicada
- Stock mínimo genera alerta visual en el dashboard
- Movimientos son inmutables (no se editan, se crean nuevos de tipo REAJUSTE)
- Merma y reajuste requieren rol ADMINISTRADOR o ALMACEN

## Lógica dual de lotes

### Ingreso manual (desde cotización)
- Mismo producto + mismo día + mismo proveedor = EDITAR lote existente sumando cantidad y actualizando stock_disponible
- Mismo producto + mismo día + diferente proveedor = crear NUEVO lote con correlativo incrementado en el SKU
- SKU formato: código_producto + DDMMAA + correlativo (ej: CEL00101062601, CEL00101062602)

### Ingreso automático por OC (Compras → Inventario)
- SIEMPRE crea lote nuevo, nunca edita existente
- SKU con correlativo si hay colisión de fecha
- Todo en una sola transacción SQL con rollback completo si falla cualquier paso
- Al completar: OC y solicitudes vinculadas cambian a INGRESADA, OC sale del kanban

### Consumo de lotes (salidas)
- FIFO por defecto: se consume primero el lote más antiguo con stock disponible
- Excepción: en servicio/POS cuando el técnico/vendedor escanea un SKU específico, se consume ese lote puntual
- Tipos de salida: VENTA, SERVICIO, MERMA, REAJUSTE

## Clasificación de proveedores en cotización

- SEGURO (verde): proveedor cuyas líneas coinciden en categoría + componente del producto cotizado
- POSIBLE: proveedor cuyas líneas coinciden solo en categoría del producto cotizado
- La clasificación es automática al consultar proveedores sugeridos
- No hay proveedor ganador; la decisión de compra se toma al momento del ingreso
- Se permiten múltiples ingresos desde la misma cotización con diferentes proveedores
