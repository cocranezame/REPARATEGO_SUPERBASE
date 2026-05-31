# Módulo: Servicios — API Endpoints

> Referencia: C002 (2026-05-31)
> Base path: /servicios-v2
> Auth: JWT requerido en todos excepto portal del cliente

## Registro de orden

POST /servicios-v2/ordenes
  → recibe: { instancia_id (o datos para crear instancia nueva), canal (TIENDA|DOMICILIO), perifericos (array de periferico_id), falla_ingreso, imagenes (array, min 1 si instancia nueva) }
  → retorna: { orden_servicio_id, estado: VALIDACION, costo_revision }
  → permiso: [VENDEDOR, RECEPCIONISTA, ADMINISTRADOR]
  → regla: costo_revision se autocompleta según categoría del producto vía instancia

## Cambio de estado

PATCH /servicios-v2/ordenes/:id/estado
  → recibe: { estado_nuevo, observacion (opcional), motivo_devolucion (solo si DEVOLUCION) }
  → retorna: { success, estado_anterior, estado_nuevo }
  → permiso: según estado (TECNICO para diagnósticos, VENDEDOR para cotización/aprobación, ADMINISTRADOR todo)
  → regla: valida transiciones permitidas incluyendo retrocesos. Registra en orden_servicio_historial.

## Listado y detalle

GET /servicios-v2/ordenes
  → query params: { estado, cliente_id, fecha_desde, fecha_hasta, tipo_servicio, canal, sucursal_id, page, limit }
  → retorna: array paginado con datos de orden + instancia + cliente + estado_venta
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

GET /servicios-v2/ordenes/:id
  → retorna: detalle completo (orden + instancia + cliente + componentes + cotización + SKUs + historial + evidencias + aceptaciones + observaciones)
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

## Instancias

POST /servicios-v2/instancias
  → recibe: { cliente_id, producto_id, numero_serie (opcional), imagenes (array) }
  → retorna: { instancia_id }
  → permiso: [VENDEDOR, RECEPCIONISTA, ADMINISTRADOR]

GET /servicios-v2/instancias?cliente_id=
  → retorna: array de instancias del cliente con imágenes y servicio activo
  → permiso: [VENDEDOR, RECEPCIONISTA, ADMINISTRADOR]

POST /servicios-v2/instancias/:id/imagenes
  → recibe: { imagen (file), descripcion }
  → retorna: { imagen_id, url }
  → permiso: [VENDEDOR, RECEPCIONISTA, ADMINISTRADOR]
  → regla: max 3 imágenes por instancia. Upload a S3.

## Componentes afectados

PUT /servicios-v2/ordenes/:id/componentes
  → recibe: array de { componente_id, tipo_afectacion (PREVENTIVO|CORRECTIVO), tipo_accion (REPARACION|CAMBIO), etapa (PRELIMINAR|FINAL) }
  → retorna: { success, componentes_guardados }
  → permiso: [TECNICO, ADMINISTRADOR]
  → regla: solo en estados REVISION, DIAG_PRELIMINAR, DIAG_FINAL

GET /servicios-v2/ordenes/:id/componentes
  → retorna: array de componentes marcados con tipo_afectacion, tipo_accion, nombre, etapa
  → permiso: [TECNICO, VENDEDOR, ADMINISTRADOR]

## Cotización / Presupuesto

GET /servicios-v2/presupuesto/buscar
  → query params: { tipo (REPUESTO|SERVICIO), categoria_id, marca_id, modelo_id, componente_id, busqueda (texto libre), nivel (COMPAT|MARCA|CATEGORIA|GLOBAL), page, limit }
  → retorna: { items: array con nombre, componente asociado, stock (solo repuestos), precio_venta, nivel_alcance; counts: { compatibilidad, marca, categoria, global } }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: paginación 50 items por página. Repuestos con stock 0 se devuelven con flag stock_disponible=false.

POST /servicios-v2/ordenes/:id/cotizacion
  → recibe: array de { tipo_item (REPUESTO|SERVICIO|MANUAL), producto_id (nullable), componente_id (nullable), descripcion_manual (nullable), cantidad, precio_unitario, es_preventivo }
  → retorna: { success, cotizacion_id, total_correctivo, total_preventivo, total }
  → permiso: [VENDEDOR, ADMINISTRADOR]
  → regla: solo desde DIAG_FINAL. Precios se congelan. Si retrocede desde COTIZADO a DIAG_FINAL y técnico modifica componentes, la cotización anterior se invalida.

GET /servicios-v2/ordenes/:id/cotizacion
  → retorna: array de items con tipo, nombre, cantidad, precio, subtotal, es_preventivo, componente asociado + totales
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

## Evidencias

POST /servicios-v2/ordenes/:id/evidencias
  → recibe: { imagen (file), descripcion, etapa }
  → retorna: { evidencia_id, url }
  → permiso: [TECNICO, ADMINISTRADOR]
  → regla: max 5 por orden. Upload a S3.

GET /servicios-v2/ordenes/:id/evidencias
  → retorna: array de evidencias con url, descripcion, etapa, fecha
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

## SKUs asignados

POST /servicios-v2/ordenes/:id/skus
  → recibe: { lote_id, producto_id, cantidad }
  → retorna: { sku_asignado_id, estado: ASIGNADO }
  → permiso: [TECNICO, ALMACEN, ADMINISTRADOR]
  → regla: solo en estado AGREGAR_SKU. Valida stock disponible en lote.

DELETE /servicios-v2/ordenes/:id/skus/:sku_asignado_id
  → retorna: { success }
  → permiso: [TECNICO, ALMACEN, ADMINISTRADOR]
  → regla: solo si estado=ASIGNADO (no CONSUMIDO)

GET /servicios-v2/ordenes/:id/skus
  → retorna: array de SKUs asignados con lote, producto, cantidad, precio, estado
  → permiso: [TECNICO, VENDEDOR, ALMACEN, ADMINISTRADOR]

## Requerimientos

POST /servicios-v2/ordenes/:id/requerimientos
  → recibe: { producto_id (nullable), imagen (file), descripcion, cantidad, observacion }
  → retorna: { requerimiento_id, estado: PENDIENTE }
  → permiso: [TECNICO, ADMINISTRADOR]
  → regla: si producto_id tiene stock, marca como ATENDIDO directo. Si no, queda PENDIENTE para compras.

GET /servicios-v2/ordenes/:id/requerimientos
  → retorna: array de requerimientos con estado, producto, descripcion
  → permiso: [TECNICO, VENDEDOR, ALMACEN, ADMINISTRADOR]

PATCH /servicios-v2/requerimientos/:id/estado
  → recibe: { estado (EN_COMPRA|ATENDIDO|ANULADO) }
  → retorna: { success }
  → permiso: [ALMACEN, ADMINISTRADOR]

## Aceptaciones

POST /servicios-v2/ordenes/:id/aceptaciones
  → recibe: { tipo (VALIDACION|PRESUPUESTO), canal_aceptacion, metodo_aceptacion, evidence_image_url (si MANUAL_WHATSAPP), approved_by (si manual), password_vendedor (si manual), preventivo_accepted (si PRESUPUESTO) }
  → retorna: { aceptacion_id, estado_nuevo }
  → permiso: [VENDEDOR, ADMINISTRADOR] para manual, público para portal
  → regla: validar contraseña del vendedor en manual. Guardar IP, timestamp, versión T&C, texto_mostrado.

## Historial y observaciones

GET /servicios-v2/ordenes/:id/historial
  → retorna: array de cambios de estado con usuario, fecha, observacion
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

POST /servicios-v2/ordenes/:id/observaciones
  → recibe: { etapa, texto }
  → retorna: { observacion_id }
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

GET /servicios-v2/ordenes/:id/observaciones
  → retorna: array de observaciones con etapa, texto, usuario, fecha
  → permiso: [VENDEDOR, TECNICO, ADMINISTRADOR]

## Costo de revisión

GET /servicios-v2/costos-revision
  → retorna: array de costos por categoría
  → permiso: [VENDEDOR, ADMINISTRADOR]

POST /servicios-v2/costos-revision
  → recibe: { categoria_id, monto }
  → retorna: { costo_revision_id }
  → permiso: [ADMINISTRADOR]

PATCH /servicios-v2/costos-revision/:id
  → recibe: { monto }
  → retorna: { success }
  → permiso: [ADMINISTRADOR]

## Portal del cliente (auth separada)

POST /portal/auth/login
  → recibe: { numero_doc, celular }
  → retorna: { token_temporal, cliente_id }
  → permiso: público
  → regla: JWT temporal con expiración corta

GET /portal/mis-equipos
  → retorna: array de instancias del cliente con servicio activo y estado
  → permiso: token portal

GET /portal/servicios/:id
  → retorna: info del servicio según estado (ver reglas del portal: solo muestra lo que corresponde a cada estado)
  → permiso: token portal
  → regla: filtra info según estado. No muestra detalles internos (SKUs, prioridad, etc.)

POST /portal/servicios/:id/aceptar-validacion
  → recibe: { metodo_aceptacion }
  → retorna: { success, estado_nuevo: REVISION }
  → permiso: token portal
  → regla: guarda IP, timestamp, versión T&C, texto_mostrado

POST /portal/servicios/:id/aceptar-presupuesto
  → recibe: { preventivo_accepted }
  → retorna: { success, estado_nuevo: APROBADO }
  → permiso: token portal
  → regla: guarda misma trazabilidad legal + preventivo_accepted
