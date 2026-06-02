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

## Endpoints nuevos C004

### Proveedores sugeridos para cotización
GET /inventario/cotizaciones/proveedores-sugeridos/:productoId
  → retorna: { seguros: [proveedores con categoría + componente coincidente], posibles: [proveedores con solo categoría coincidente] }
  → permiso: [ADMINISTRADOR, ALMACEN]
  → regla: seguros se muestran en verde en el frontend

### Mensaje WhatsApp para proveedor
GET /inventario/cotizaciones/:id/mensaje-whatsapp/:detalleId
  → retorna: { url: "https://wa.me/{numero}?text={mensaje_codificado}" }
  → permiso: [ADMINISTRADOR, ALMACEN]
  → regla: mensaje = "Estimado [nombre_proveedor], quería consultar sobre el costo de [nombre_producto]."

### Dashboard inventario
GET /inventario/dashboard
  → retorna: { total_productos, total_servicios, productos_stock_bajo_minimo: [{ producto_id, nombre, stock_actual, stock_minimo }], cotizaciones_pendientes, valor_total_inventario }
  → permiso: [ADMINISTRADOR, ALMACEN]

### Tasa con jerarquía
GET /inventario/tasas
  → actualizar respuesta: incluir campo nivel (POR_REPUESTO, POR_TIPO, POR_COMPONENTE) y resolver precio_venta según jerarquía
  → regla: si producto tiene tasa POR_REPUESTO, usar esa. Si no, buscar POR_TIPO. Si no, buscar POR_COMPONENTE.

POST /inventario/tasas
  → actualizar: recibe { nivel, producto_id (si POR_REPUESTO), tipo_registro (si POR_TIPO), componente_id (si POR_COMPONENTE), tasa_tipo, tasa_valor }

### Ingreso manual con lógica dual
POST /inventario/movimientos/ingreso
  → actualizar lógica:
    - Verificar si existe lote del mismo producto + mismo día (CURRENT_DATE) + mismo proveedor
    - Si existe: editar lote sumando cantidad + actualizar stock_disponible
    - Si no existe: crear nuevo lote. Si hay otro lote del mismo producto en el mismo día con diferente proveedor, incrementar correlativo en SKU
    - Registrar movimiento INGRESO
    - Actualizar ultimo_costo y promedio_historico en tasa_precio del producto
    - Recalcular precio_venta

### Ingreso automático por OC
POST /inventario/ingreso-oc/:ordenCompraId
  → sin cambios en la interfaz, actualizar lógica interna:
    - SIEMPRE crear lote nuevo (nunca editar existente)
    - Correlativo en SKU si colisión de fecha
    - Transacción atómica completa

### Alertas stock mínimo
GET /inventario/stock/alertas
  → retorna: { productos: [{ producto_id, nombre, codigo, stock_actual, stock_minimo, diferencia }] }
  → permiso: [ADMINISTRADOR, ALMACEN]
  → regla: retorna productos donde stock_actual < stock_minimo

## Actualización de permisos C004

- ADMINISTRADOR: acceso total a todo el módulo
- ALMACEN: stock, lotes, movimientos (lectura y escritura), merma y reajuste
- VENDEDOR: solo lectura de stock y precios de venta
- Merma y reajuste requieren rol ADMINISTRADOR o ALMACEN
