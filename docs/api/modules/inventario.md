# API — Inventario

> Endpoints de productos, compatibilidades, tasas, stock, lotes y movimientos.
> Épicas: E4 (productos), E8 (lotes/movimientos)

## Productos

### GET /api/v1/productos
- Query: `?tipo=&categoria_id=&componente_id=&marca_id=&search=&activo=true&page=1&pageSize=20`

### POST /api/v1/productos
- Body: `{ tipo, nombre, descripcion?, categoria_id, componente_id?, marca_id?, unidad_medida?, precio_compra?, precio_venta, stock_minimo?, imagen_url? }`
- Código autogenerado: PRD-XXXX o SRV-XXXX según tipo

### GET /api/v1/productos/:id
- Incluye compatibilidades (modelos)

### PUT /api/v1/productos/:id
### DELETE /api/v1/productos/:id

## Compatibilidades

### GET /api/v1/productos/:id/compatibilidades
- Lista modelos compatibles

### POST /api/v1/productos/:id/compatibilidades
- Body: `{ modelo_ids: UUID[] }`
- Reemplaza todas las compatibilidades (sync)

## Tasas de precio

### GET /api/v1/tasas-precio
### POST /api/v1/tasas-precio
- Body: `{ nombre, porcentaje }`
### PUT /api/v1/tasas-precio/:id
### DELETE /api/v1/tasas-precio/:id

## Métodos de pago catálogo

### GET /api/v1/metodos-pago
### POST /api/v1/metodos-pago
- Body: `{ nombre }`
### PUT /api/v1/metodos-pago/:id
### DELETE /api/v1/metodos-pago/:id

## Stock

### GET /api/v1/stock
- Query: `?producto_id=&sucursal_id=&alerta_minimo=true`
- Response: `{ producto_id, nombre, stock_actual, stock_minimo, en_alerta }`
- Calcula SUM(movimiento_inventario.cantidad) agrupado por producto+sucursal

### GET /api/v1/stock/:productoId/detalle
- Detalle por lote: `{ lote_id, sku, cantidad_actual, precio_unitario, fecha_ingreso }`

## Lotes

### GET /api/v1/lotes
- Query: `?producto_id=&sucursal_id=&page=1&pageSize=20`

## Movimientos

### GET /api/v1/movimientos
- Query: `?producto_id=&tipo=&sucursal_id=&desde=&hasta=&page=1&pageSize=20`

### POST /api/v1/movimientos
- Body: `{ producto_id, lote_id?, sucursal_id, tipo, cantidad, referencia_tipo?, referencia_id?, notas? }`
- Solo para MERMA, REAJUSTE, TRANSFERENCIA (los demás se crean automáticamente)
