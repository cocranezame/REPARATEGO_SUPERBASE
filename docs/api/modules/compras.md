# API — Compras

> Endpoints de cotizaciones de compra, solicitudes, órdenes de compra y pagos a proveedores.
> Épicas: E6 (cotizaciones), E7 (solicitudes + OC), E9 (pagos)

## Cotizaciones de compra

### GET /api/v1/cotizaciones-compra
- Query: `?proveedor_id=&estado=&page=1&pageSize=20`

### POST /api/v1/cotizaciones-compra
- Body: `{ proveedor_id, items: [{ producto_id, cantidad }], fecha_vencimiento?, notas? }`

### GET /api/v1/cotizaciones-compra/:id
### PUT /api/v1/cotizaciones-compra/:id/cotizar
- Body: `{ items: [{ detalle_id, precio_unitario }] }`
- Cambia estado PENDIENTE → COTIZADA

## Solicitudes de compra

### GET /api/v1/solicitudes-compra
- Query: `?estado=&prioridad=&page=1&pageSize=20`

### POST /api/v1/solicitudes-compra
- Body: `{ producto_id, cantidad_solicitada, prioridad?, notas? }`

### PUT /api/v1/solicitudes-compra/:id
### DELETE /api/v1/solicitudes-compra/:id

## Órdenes de compra

### GET /api/v1/ordenes-compra
- Query: `?estado=&proveedor_id=&desde=&hasta=&page=1&pageSize=20`

### POST /api/v1/ordenes-compra/generar
- Body: `{ proveedor_id, solicitud_ids: UUID[], items: [{ producto_id, cantidad, precio_unitario }], fecha_entrega_estimada?, notas? }`
- Agrupa solicitudes → genera OC → solicitudes pasan a EN_OC

### GET /api/v1/ordenes-compra/:id

### PUT /api/v1/ordenes-compra/:id/estado
- Body: `{ estado }` (transiciones válidas)

### POST /api/v1/ordenes-compra/:id/confirmar
- Body: `{ items: [{ producto_id, cantidad_recibida, precio_unitario, conforme, notas? }] }`
- OC pasa a TERMINADA → al confirmar todos: INGRESADA (genera lotes + movimientos INGRESO)

## Pagos a proveedores

### GET /api/v1/pagos-proveedor
- Query: `?proveedor_id=&desde=&hasta=&page=1&pageSize=20`

### POST /api/v1/pagos-proveedor
- Body: `{ orden_compra_id, monto, metodo_pago, referencia?, comprobante_url?, fecha_pago }`
- OC pasa de PENDIENTE_PAGO → TERMINADA
