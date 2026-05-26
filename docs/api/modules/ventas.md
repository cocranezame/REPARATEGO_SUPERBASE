# API — Ventas

> Endpoints de caja, ventas, pagos, envíos y cotizaciones de venta.
> Épica: E11

## Caja

### GET /api/v1/cajas
- Query: `?sucursal_id=&estado=&page=1&pageSize=20`

### GET /api/v1/cajas/actual
- Devuelve la caja abierta del usuario actual (si existe)

### POST /api/v1/cajas/abrir
- Body: `{ sucursal_id, monto_apertura }`

### POST /api/v1/cajas/:id/cerrar
- Body: `{ monto_cierre, notas_cierre? }`
- Valida que no hay ventas PENDIENTE en esta caja

### GET /api/v1/cajas/:id/resumen
- Totales por método de pago, cantidad de ventas, diferencia

## Ventas

### GET /api/v1/ventas
- Query: `?tipo_venta=&estado=&caja_id=&cliente_id=&desde=&hasta=&search=&page=1&pageSize=20`

### POST /api/v1/ventas
- Body: `{ caja_id, cliente_id?, tipo_venta, orden_servicio_id?, visita_domicilio_id?, items: [{ producto_id?, descripcion, cantidad, precio_unitario, descuento? }], notas? }`
- Código autogenerado: V-XXXX
- Calcula subtotal, IGV (18%), total

### GET /api/v1/ventas/:id

### POST /api/v1/ventas/:id/anular
- Body: `{ motivo }`
- Revierte movimientos de stock

## Pagos de venta

### GET /api/v1/ventas/:id/pagos
### POST /api/v1/ventas/:id/pagos
- Body: `{ metodo_pago_id, monto, referencia? }`
- Si SUM(pagos) >= total → venta pasa a PAGADA
- Si SUM(pagos) > 0 pero < total → PARCIAL

## Envíos

### GET /api/v1/ventas/:id/envio
### POST /api/v1/ventas/:id/envio
- Body: `{ direccion_id?, direccion_texto, costo_envio?, notas? }`

### PUT /api/v1/ventas/:ventaId/envio/estado
- Body: `{ estado }` (PENDIENTE → EN_CAMINO → ENTREGADO)

## Cotizaciones de venta

### GET /api/v1/cotizaciones-venta
- Query: `?cliente_id=&estado=&page=1&pageSize=20`

### POST /api/v1/cotizaciones-venta
- Body: `{ cliente_id?, items: [{ producto_id?, descripcion, cantidad, precio_unitario }], fecha_vencimiento?, notas? }`

### GET /api/v1/cotizaciones-venta/:id
### PUT /api/v1/cotizaciones-venta/:id/estado
- Body: `{ estado }` (BORRADOR → ENVIADA → APROBADA/RECHAZADA)
