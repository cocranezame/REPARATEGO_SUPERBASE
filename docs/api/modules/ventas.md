# Módulo: Ventas — API Endpoints

> Referencia: C003 (2026-06-01)
> Base path: /ventas
> Auth: JWT requerido en todos
> Regla global: sin caja abierta todos los endpoints (excepto caja/apertura y caja/activa) retornan 403

## Caja

POST /ventas/caja/apertura
  → recibe: { sucursal_id, monto_inicial }
  → retorna: { caja_id, estado: ABIERTA, fecha_apertura }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: solo una caja ABIERTA por usuario. Si ya tiene una abierta, retorna error.

POST /ventas/caja/cierre
  → recibe: { caja_id, monto_fisico }
  → retorna: { monto_esperado, monto_fisico, diferencia, estado: CERRADA }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: monto_esperado = monto_inicial + sum(pagos_efectivo recibidos en esta caja). diferencia = monto_fisico - monto_esperado.

GET /ventas/caja/activa
  → retorna: { caja_id, monto_inicial, fecha_apertura, sucursal } o null si no tiene caja abierta
  → permiso: [VENDEDOR, ADMINISTRADOR]

GET /ventas/caja/:id/reporte
  → retorna: { resumen de caja: apertura, cierre, movimientos, totales por método de pago, diferencia }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: imprimible (P5)

## Ventas

POST /ventas
  → recibe: { tipo (LIBRE|SERVICIO|REVISION_DOMICILIO|REVISION_DEVOLUCION), cliente_id (nullable si LIBRE), orden_servicio_id (nullable si LIBRE), visita_domicilio_id (nullable), items: [{ tipo_item, producto_id, lote_id, sku, numero_serie, descripcion, cantidad, precio_unitario, es_preventivo }], requiere_envio (boolean), datos_envio: { direccion_id, metodo_envio, fecha_programada, costo_envio } (nullable), pagos: [{ metodo_pago_catalogo_id, monto }] }
  → retorna: { venta_id, estado_pago, estado_despacho, total }
  → permiso: [VENDEDOR]
  → reglas:
    - Si tipo=LIBRE: pago completo obligatorio, sum(pagos) debe igualar total (R7). Cliente opcional (R11).
    - Si tipo=SERVICIO: pagos pueden ser parciales (R8). Cliente heredado de orden_servicio vía instancia, no editable (R10).
    - Si tipo=REVISION_DEVOLUCION: se genera automáticamente desde servicios con item revisión al monto fijo por categoría (R18).
    - Escaneo SKU obligatorio para items tipo PRODUCTO (R3). Validar stock antes de confirmar (R5).
    - Si requiere_envio=true: costo_envio se agrega como item tipo ENVIO (R13). estado_despacho = ENVIO_PENDIENTE.
    - Registra created_by automáticamente (R2).
    - Descuenta stock de lotes correspondientes al confirmar (R4).

GET /ventas
  → query params: { fecha_desde, fecha_hasta, estado_pago, estado_despacho, tipo, canal, page, limit }
  → retorna: { ventas: [{ venta_id, cliente, fecha, items_count, canal, total, saldo_pendiente, estado_pago, estado_despacho, servicio_asociado (id + estado si tiene) }], total_registros }
  → permiso: [VENDEDOR (solo sus ventas P4), ADMINISTRADOR (todas)]

GET /ventas/:id
  → retorna: { venta completa: info, items (con SKU y lote), pagos (con método, monto, fecha, usuario), envio, servicio_asociado (id + estado), saldo_pendiente, porcentaje_pagado }
  → permiso: [VENDEDOR (solo sus ventas), ADMINISTRADOR]

POST /ventas/:id/pago
  → recibe: { metodo_pago_catalogo_id, monto }
  → retorna: { pago_id, total_pagado, saldo_pendiente, estado_pago }
  → permiso: [VENDEDOR]
  → reglas:
    - Método de pago obligatorio (R12).
    - Si venta tipo LIBRE y no es el pago inicial: rechazar (R7, no admite parciales).
    - Se refleja en la caja del usuario que recibe el pago (R17).
    - Si sum(pagos) = total → estado_pago cambia automáticamente a COMPLETADA.
    - Si venta asociada a servicio y COMPLETADA → habilita transición a ENTREGADO en servicios (R9).

PATCH /ventas/:id/anular
  → recibe: { motivo }
  → retorna: { estado_pago: ANULADA, stock_revertido: true, nota_credito_monto (si había pagos parciales) }
  → permiso: [ADMINISTRADOR, ASISTENTE]
  → reglas:
    - Revierte stock: SKUs reingresan a sus lotes originales (R22).
    - Si tenía pagos parciales: registra nota_credito_monto como saldo a favor del cliente (P2).
    - Registra anulado_por con el usuario que ejecutó la acción.

## Envío

PATCH /ventas/:id/envio
  → recibe: { direccion_id, metodo_envio, fecha_programada, costo_envio }
  → retorna: { envio actualizado }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: si no existía envío, lo crea. Si ya existía, actualiza. Costo de envío actualiza el item ENVIO en la venta.

PATCH /ventas/:id/envio/despachar
  → recibe: {}
  → retorna: { estado: DESPACHADO }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: cambia estado_despacho de la venta a DESPACHADO.

GET /ventas/envios/calendario
  → query params: { fecha_desde, fecha_hasta, sucursal_id }
  → retorna: { envios por fecha con datos de venta + cliente + dirección }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: comparte datos con módulo domicilios para ver ocupación conjunta (R21).

## Cotizaciones referenciales

POST /ventas/cotizaciones
  → recibe: { cliente_id (nullable), items: [{ producto_id, descripcion, cantidad, precio_unitario }] }
  → retorna: { cotizacion_venta_id, total_referencial }
  → permiso: [VENDEDOR]
  → regla: requiere caja abierta. No afecta inventario ni reserva stock (R15). Sin vigencia (P1).

GET /ventas/cotizaciones
  → query params: { fecha_desde, fecha_hasta, cliente_id, page, limit }
  → retorna: { cotizaciones[] }
  → permiso: [VENDEDOR, ADMINISTRADOR]

GET /ventas/cotizaciones/:id
  → retorna: { detalle cotización con items }
  → permiso: [VENDEDOR, ADMINISTRADOR]

## Direcciones del cliente (usadas desde ventas para envío)

GET /clientes/:id/direcciones
  → retorna: { direcciones[] }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → nota: este endpoint puede ya existir en módulo clientes (E3). Si existe, no duplicar.

POST /clientes/:id/direcciones
  → recibe: { direccion (obligatorio), ubicacion_url (opcional), referencia (opcional) }
  → retorna: { direccion_id }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → nota: idem anterior, verificar si ya existe en E3.

## Integración con servicios (C002 + C003)

Estos NO son endpoints nuevos, son comportamientos que se activan desde el módulo de servicios:

1. Cuando cliente aprueba presupuesto en COTIZADO → servicios llama POST /ventas con tipo=SERVICIO, items del presupuesto precargados
2. En AGREGAR_SKU → servicios actualiza los items de la venta existente con los SKUs escaneados
3. En AVISADO → "Cobrar" redirige al POS (/ventas/pos?venta_id=X) con la venta precargada
4. En DEVOLUCIÓN → servicios llama POST /ventas con tipo=REVISION_DEVOLUCION, item revisión al monto fijo
5. POST /ventas/:id/pago verifica si la venta está asociada a servicio y si COMPLETADA, notifica al módulo servicios
