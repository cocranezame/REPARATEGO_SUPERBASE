# Web — Compras

> Pantallas de cotizaciones, solicitudes, OC y pagos.
> Épicas: E6, E7, E9

## Pantallas

### Cotizaciones de compra (`/compras/cotizaciones`)
- Tabla con: código, proveedor, estado, fecha, total
- Crear: seleccionar proveedor + agregar productos con cantidad
- Detalle: ver items, registrar precios cotizados

### Comparador de precios (`/compras/cotizaciones/comparar`)
- Tabla cruzada: producto × proveedor con precios cotizados
- Highlight del mejor precio por producto

### Solicitudes de compra (`/compras/solicitudes`)
- Tabla con: producto, cantidad, prioridad, estado, solicitante
- **Panel lateral:** productos con stock bajo mínimo (quick-add a solicitud)
- Filtros: estado, prioridad

### Kanban de OC (`/compras/ordenes`)
- Columnas: GENERADA | ENVIADA | TERMINADA | INGRESADA | PENDIENTE_PAGO
- Tarjetas con: código, proveedor, total, fecha
- Click → detalle de OC

### Detalle de OC (`/compras/ordenes/:id`)
- Info general + tabla de items
- **Modal de confirmación:** por cada item: cantidad recibida, conforme, notas
- Botones de cambio de estado

### Pagos pendientes (`/compras/pagos`)
- Tabla de OC en estado PENDIENTE_PAGO
- **Modal de pago:** monto, método, referencia, upload comprobante, fecha
