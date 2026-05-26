# Web — Ventas

> Pantallas de caja, punto de venta, historial y envíos.
> Épica: E11

## Pantallas

### Caja (`/ventas/caja`)
- Si no hay caja abierta → formulario de apertura (sucursal, monto)
- Si hay caja abierta → resumen: ventas del día, totales por método, monto actual
- Botón cerrar caja (con conteo de cierre)

### Punto de venta (`/ventas/nueva`)
- Layout dividido: izquierda=buscador de productos+items, derecha=resumen+cobro
- Buscador de productos con autocompletado
- Tabla de items: producto, cantidad, precio, descuento, subtotal
- Seleccionar cliente (opcional)
- Tipo de venta: LIBRE (default), SERVICIO (seleccionar OS), etc.
- **Panel de cobro:** total, IGV, métodos de pago (multi-método), referencia, cambio
- Botón cobrar → crea venta + pagos + movimientos de stock

### Historial de ventas (`/ventas/historial`)
- Tabla con: código, fecha, cliente, tipo, total, estado
- Filtros: tipo, estado, caja, rango fechas
- Detalle: items, pagos, envío

### Envíos (`/ventas/envios`)
- Tabla con: venta, cliente, dirección, estado, fecha envío
- Cambio de estado: PENDIENTE → EN_CAMINO → ENTREGADO

### Cotizaciones de venta (`/ventas/cotizaciones`)
- Tabla con: código, cliente, total, estado, vencimiento
- Crear: similar al POS pero sin cobro, genera PDF
