# Módulo: Ventas — Pantallas Web

> Referencia: C003 (2026-06-01)
> Ruta base: /ventas
> Estado: ✅ IMPLEMENTADO — E11.3 (2026-06-01, 12 commits)

## Archivos implementados

| Archivo | Descripción |
|---------|-------------|
| `types/ventas.ts` | DTOs C003: CajaDto, VentaDto, VentaDetalleDto, CotizacionVentaDto |
| `hooks/useVentas.ts` | 15 hooks TanStack Query con endpoints C003 correctos |
| `pages/CajaPage.tsx` | Apertura/cierre caja, reporte imprimible |
| `pages/PosPage.tsx` | POS completo: catálogo + carrito + pagos + envío + integración servicios |
| `pages/VentasListaPage.tsx` | Lista con filtros, badges estado, voucher por fila |
| `pages/VentaDetallePage.tsx` | Detalle 4 secciones + anulación + pago rápido + despachar |
| `pages/CotizacionesVentaPage.tsx` | Lista + crear + ver + imprimir cotizaciones |
| `components/VoucherPrint.tsx` | Utilidad compartida: imprimirVoucherDetalle + imprimirVoucherSimple |

## Rutas web

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/ventas/pos` | `PosPage` | POS principal (requiere caja abierta) |
| `/ventas` | `VentasListaPage` | Lista con filtros y paginación |
| `/ventas/:id` | `VentaDetallePage` | Detalle de venta |
| `/ventas/cotizaciones` | `CotizacionesVentaPage` | Cotizaciones referenciales |
| `/ventas/caja` | `CajaPage` | Estado y gestión de caja |
| `/ventas/envios` | `EnviosPage` | Lista de envíos (pre-existente) |

## Notas de implementación

- Escaneo SKU en POS: busca por código o nombre en productos activos (sin endpoint dedicado de lote por SKU — workaround hasta que se agregue)
- VentaDetallePage accede como ruta `/ventas/:id` — debe estar declarada DESPUÉS de rutas estáticas en App.tsx
- `imprimirVoucherDetalle` / `imprimirVoucherSimple` usan `window.open` + `window.print()` sin dependencias

## Vistas en el sidebar

### 1. Punto de Venta — POS (/ventas/pos)

Regla: si no hay caja abierta, bloquea acceso y muestra modal de apertura de caja.

Acepta query param opcional: ?venta_id=X para precargar venta existente (desde servicios AVISADO).

LAYOUT: dos paneles lado a lado.

PANEL IZQUIERDO — Catálogo:
- Barra de escaneo SKU (autofocus, al escanear identifica producto + lote, agrega al carrito)
- Filtros por jerarquía: categoría → componente → marca → modelo
- Buscador por texto libre
- Grilla de tarjetas con imagen, nombre, precio, stock disponible
- Click en tarjeta de servicio → agrega directo al carrito (no requiere SKU, R6)
- Productos requieren escaneo SKU obligatorio (R3), no se agregan por click

PANEL DERECHO — Carrito:
- Info cliente: nombre, DNI (editable en venta libre R11, bloqueado en venta servicio R10)
- Toggle "Requiere envío" → expande sección envío
- Items agregados: SKU, nombre producto/servicio, precio, cantidad, botón eliminar
- Separación visual: items correctivos vs preventivos (en venta servicio)
- Subtotal productos | Subtotal servicios | Costo envío | TOTAL
- Saldo pendiente (si hay abonos previos en venta servicio)
- Historial de abonos previos (si venta servicio con pagos parciales)
- Botón "PAGAR" → abre modal de pagos

MODAL DE PAGOS:
- Resumen: total, abonos previos, saldo a pagar
- Selector método de pago (obligatorio R12): EFECTIVO, YAPE, PLIN, TRANSFERENCIA, TARJETA
- Campo monto
- Botón "+ Agregar otro método" (permite split entre múltiples métodos)
- Lista de métodos agregados con monto cada uno
- Validación: si venta LIBRE, sum(montos) debe igualar total exacto (R7). Si venta SERVICIO, puede ser menor (adelanto R8)
- Botón "Registrar abono" (si parcial en venta servicio)
- Botón "Confirmar venta" (si pago completo)
- Al confirmar: descuenta stock de lotes (R4), refleja en caja (R17), cambia estado_pago si corresponde

SECCIÓN ENVÍO (dentro del carrito, visible si toggle activo):
- Dropdown direcciones del cliente (si tiene registradas R20)
- Botón "+ Nueva dirección" → campos: dirección (obligatorio), URL ubicación Google Maps (opcional), referencia (opcional)
- Método de envío (campo texto)
- Fecha programada (date picker)
- Costo de envío (se suma al total como item ENVIO R13)

### 2. Lista de Ventas (/ventas)

Tabla con columnas:
- VENTA_ID
- CLIENTE (nombre, DNI)
- FECHA
- ITEMS (cantidad)
- CANAL (tienda/domicilio)
- TOTAL
- SALDO PENDIENTE
- ESTADO PAGO (PAGO_PENDIENTE / COMPLETADA / ANULADA) — badge con color
- ESTADO DESPACHO (SIN_ENVIO / ENVIO_PENDIENTE / DESPACHADO) — badge con color
- ESTADO SERVICIO (solo visible si tiene servicio asociado)
- ACCIONES: icono ojo (ver detalle), icono impresora (imprimir voucher)

Filtros: fecha desde/hasta, estado pago, estado despacho, tipo, canal
Paginación
Vendedor ve solo sus ventas, Administrador ve todas (P4)

### 3. Detalle de Venta (modal/panel desde lista al click en ojo)

4 secciones:

SECCIÓN 1 — INFORMACIÓN:
- Cliente (nombre, DNI, celular)
- Estado pago (badge color): PAGO_PENDIENTE / COMPLETADA / ANULADA
- Estado despacho (badge color): SIN_ENVIO / ENVIO_PENDIENTE / DESPACHADO
- Canal (tienda/domicilio)
- Fecha de creación
- Vendedor que generó
- ID servicio asociado + estado del servicio (solo si tiene, clickeable para ir al servicio)
- Botón "Anular venta" (solo ADMINISTRADOR/ASISTENTE, pide motivo, confirma con modal P2)

SECCIÓN 2 — PROGRESO DEL COBRO:
- Barra de progreso visual: monto pagado vs total
- Porcentaje pagado
- Saldo pendiente
- Botón "Registrar pago" → abre modal de pagos (mismo del POS)

SECCIÓN 3 — PAGOS REGISTRADOS:
- Tabla: fecha/hora, método de pago, monto, usuario que recibió
- Si venta anulada con pagos parciales: muestra nota de crédito con monto saldo a favor

SECCIÓN 4 — ENVÍO:
- Estado del envío (PENDIENTE / DESPACHADO)
- Dirección seleccionada (dropdown para cambiar si tiene varias R20)
- Botón "+ Nueva dirección"
- Campos: dirección, URL ubicación, referencia
- Método de envío
- Fecha programada
- Costo de envío
- Calendario compartido con módulo domicilios para ver ocupación (R21)
- Botón "Marcar como despachado"

### 4. Cotizaciones (/ventas/cotizaciones)

Tabla con columnas:
- Número cotización
- Fecha
- Cliente (o "Sin cliente")
- Cantidad items
- Total referencial
- Usuario que la creó
- Acciones: ver detalle, imprimir

Detalle de cotización (modal):
- Info cliente (si tiene)
- Items con descripción, cantidad, precio, subtotal
- Total referencial
- Nota: "Documento referencial. No reserva stock ni genera movimiento de inventario."
- Botón "Imprimir"

Crear cotización (modal/formulario):
- Campo cliente (opcional)
- Agregar items: buscador de productos/servicios, cantidad, precio
- Total referencial calculado
- Botón "Guardar cotización"
- Requiere caja abierta

### 5. Apertura y Cierre de Caja (modal desde header o sidebar)

APERTURA:
- Campo monto inicial de efectivo
- Sucursal (preseleccionada del usuario)
- Botón "Abrir caja"
- Al abrir: habilita acceso al módulo completo

CIERRE:
- Resumen: monto inicial, ingresos efectivo, egresos efectivo, monto esperado
- Campo monto físico contado
- Diferencia calculada automáticamente (sobrante/faltante con color verde/rojo)
- Detalle de movimientos por método de pago
- Botón "Cerrar caja"
- Botón "Imprimir reporte" (P5)

REPORTE DE CIERRE (imprimible):
- Fecha/hora apertura y cierre
- Usuario y sucursal
- Monto inicial
- Desglose por método de pago
- Total ingresos
- Monto esperado vs monto físico
- Diferencia (sobrante/faltante)
- Cantidad de ventas realizadas

## Comportamientos especiales

### Acceso desde servicios

Cuando el módulo de servicios redirige al POS:
- COTIZADO/APROBADO → POST /ventas crea venta tipo SERVICIO, luego redirige a POS con ?venta_id=X. Cliente bloqueado, items precargados del presupuesto. Vendedor puede registrar adelanto.
- AVISADO → "Cobrar" redirige a POS con ?venta_id=X. Venta ya existe con items y abonos previos visibles. Vendedor completa el cobro.
- DEVOLUCIÓN → sistema genera automáticamente venta tipo REVISION_DEVOLUCION y redirige a POS con ?venta_id=X. Item único: revisión al monto fijo por categoría.

### Voucher de impresión

Contenido del voucher:
- Logo ReparaTego + datos sucursal
- Número de venta
- Fecha/hora
- Cliente (si tiene)
- Items con cantidad, precio, subtotal
- Total
- Método(s) de pago
- Vendedor
- Servicio asociado (si tiene)
- Mensaje de agradecimiento
