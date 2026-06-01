# Épica 11 — Ventas

> Referencia: C003 (2026-06-01)
> Estado: TODO
> Branch: epic/E11-ventas
> 22 tickets / 5 sub-épicas

## Sub-épica 11A: Backend base (T1-T6)

- E11.1 — Migración: actualizar tablas venta (campos anulado_por, nota_credito_monto), verificar caja, metodo_pago_catalogo, venta_item (campo sku), venta_pago, venta_envio, cotizacion_venta, cotizacion_venta_item existen con todos los campos de C003 — estado: TODO
- E11.2 — API Caja: POST apertura, POST cierre, GET activa, GET reporte imprimible. Regla: solo una abierta por usuario, sin caja abierta bloquea módulo completo — estado: TODO
- E11.3 — API Crear venta: POST /ventas con 4 tipos (LIBRE, SERVICIO, REVISION_DOMICILIO, REVISION_DEVOLUCION). Escaneo SKU obligatorio para productos, descuento stock de lotes, validaciones por tipo — estado: TODO
- E11.4 — API Listar y detalle: GET /ventas (filtros, paginación, vendedor solo sus ventas, admin todas), GET /ventas/:id (info completa con pagos, items, envío, servicio asociado, saldo pendiente) — estado: TODO
- E11.5 — API Pagos: POST /ventas/:id/pago (método obligatorio, refleja en caja, cambio automático a COMPLETADA cuando sum=total, notifica servicios si asociada) — estado: TODO
- E11.6 — API Anulación y envío: PATCH /ventas/:id/anular (requiere ADMIN/ASISTENTE, revierte stock, nota crédito si pagos parciales), PATCH /ventas/:id/envio, PATCH /ventas/:id/envio/despachar, GET /ventas/envios/calendario — estado: TODO

## Sub-épica 11B: Cotizaciones referenciales (T7-T8)

- E11.7 — API Cotizaciones: POST /ventas/cotizaciones, GET /ventas/cotizaciones, GET /ventas/cotizaciones/:id. Sin impacto inventario, sin vigencia — estado: TODO
- E11.8 — Web Pantalla cotizaciones: lista, detalle, crear, imprimir — estado: TODO

## Sub-épica 11C: POS - Punto de Venta (T9-T14)

- E11.9 — Web POS layout: dos paneles (catálogo + carrito). Verificación caja abierta al acceder. Soporte query param ?venta_id=X para precargar venta existente — estado: TODO
- E11.10 — Web POS panel catálogo: barra escaneo SKU (autofocus, identifica producto + lote), filtros jerarquía, buscador texto, grilla tarjetas con imagen/nombre/precio/stock — estado: TODO
- E11.11 — Web POS panel carrito: info cliente (editable si libre, bloqueado si servicio), toggle envío, items con SKU/nombre/precio, subtotales, saldo pendiente, historial abonos, botón pagar — estado: TODO
- E11.12 — Web POS modal pagos: resumen, selector método, campo monto, split múltiples métodos, validación pago completo (libre) o parcial (servicio), botones registrar abono / confirmar venta — estado: TODO
- E11.13 — Web POS sección envío: dropdown direcciones cliente, nueva dirección, método envío, fecha programada, costo envío como item ENVIO — estado: TODO
- E11.14 — Web POS integración servicios: precargar venta desde COTIZADO/APROBADO (adelanto), desde AVISADO (cobro final), desde DEVOLUCIÓN (revisión automática) — estado: TODO

## Sub-épica 11D: Lista, detalle y gestión (T15-T19)

- E11.15 — Web Lista de ventas: tabla con todos los campos, badges estado pago/despacho, filtros, paginación, permisos vendedor/admin — estado: TODO
- E11.16 — Web Detalle venta sección 1 y 2: información general + progreso cobro (barra visual, porcentaje, saldo, botón registrar pago) — estado: TODO
- E11.17 — Web Detalle venta sección 3: pagos registrados (tabla fecha/método/monto/usuario, nota crédito si anulada con parciales) — estado: TODO
- E11.18 — Web Detalle venta sección 4: envío (estado, dirección, calendario compartido con domicilios, marcar despachado) — estado: TODO
- E11.19 — Web Anulación de venta: modal confirmación con motivo, solo ADMIN/ASISTENTE, muestra nota crédito si pagos parciales — estado: TODO

## Sub-épica 11E: Caja y voucher (T20-T22)

- E11.20 — Web Apertura/cierre de caja: modal desde header, formulario apertura (monto inicial), formulario cierre (monto físico, esperado, diferencia con color) — estado: TODO
- E11.21 — Web Reporte cierre de caja: resumen imprimible con desglose por método, movimientos, diferencia — estado: TODO
- E11.22 — Web Voucher de impresión: contenido formateado (logo, datos, items, pagos, vendedor), botón imprimir desde lista de ventas — estado: TODO

## Dependencias

- Requiere completado: E1 (seguridad, roles ADMIN/ASISTENTE), E2 (catálogos), E3 (clientes + direcciones), E4 (inventario/productos/tasas), E8 (lotes/stock), E10 (servicios)
- Requiere parcial: E5 (proveedores, para trazabilidad), E12 (domicilios, calendario compartido)
- Alimenta: E10 (servicios — estado pago habilita ENTREGADO), E12 (domicilios — ventas con envío), E14 (dashboard — data ventas/caja)
