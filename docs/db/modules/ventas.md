# Módulo: Ventas — Schema de Base de Datos

> Referencia: C003 (2026-06-01)

## Conceptos clave

- VENTA LIBRE: sin orden de servicio, cliente opcional, pago completo obligatorio
- VENTA SERVICIO: asociada a orden de servicio, cliente heredado no editable, admite pagos parciales desde COTIZADO
- COBRO DEVOLUCIÓN: venta automática por revisión al monto fijo por categoría
- COTIZACIÓN: documento referencial, sin impacto en inventario
- POS: interfaz principal, escaneo SKU obligatorio para productos
- Dos ejes de estado independientes: pago y despacho

## Estados

Eje pago: PAGO_PENDIENTE → COMPLETADA (automático cuando suma_pagos = total) | ANULADA (manual por admin/asistente)
Eje despacho: SIN_ENVIO | ENVIO_PENDIENTE → DESPACHADO
Ambos ejes transicionan por separado.

## Tablas

### TABLA: caja
- caja_id SERIAL PK
- usuario_id FK NOT NULL
- sucursal_id FK NOT NULL
- monto_inicial DECIMAL(10,2) NOT NULL
- monto_esperado DECIMAL(10,2) — calculado al cierre: monto_inicial + ingresos_efectivo - egresos_efectivo
- monto_fisico DECIMAL(10,2) — ingresado al cierre (monto contado físicamente)
- diferencia DECIMAL(10,2) — calculado al cierre: monto_fisico - monto_esperado (sobrante/faltante)
- estado ENUM('ABIERTA','CERRADA') DEFAULT 'ABIERTA'
- fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW()
- fecha_cierre TIMESTAMP
- created_at
- Regla: solo una caja ABIERTA por usuario a la vez. Sin caja abierta el módulo completo es inaccesible.

### TABLA: metodo_pago_catalogo
- metodo_pago_catalogo_id SERIAL PK
- nombre VARCHAR(50) UNIQUE NOT NULL — EFECTIVO, YAPE, PLIN, TRANSFERENCIA, TARJETA
- activo BOOLEAN DEFAULT true
- created_at

### TABLA: venta
- venta_id SERIAL PK
- tipo ENUM('LIBRE','SERVICIO','REVISION_DOMICILIO','REVISION_DEVOLUCION') NOT NULL
- cliente_id FK — nullable en venta libre (R11), heredado y no editable en venta servicio (R10)
- orden_servicio_id FK — nullable en venta libre
- visita_domicilio_id FK — si es cobro por revisión domicilio
- caja_id FK NOT NULL
- estado_pago ENUM('PAGO_PENDIENTE','COMPLETADA','ANULADA') DEFAULT 'PAGO_PENDIENTE'
- estado_despacho ENUM('SIN_ENVIO','ENVIO_PENDIENTE','DESPACHADO') DEFAULT 'SIN_ENVIO'
- total DECIMAL(12,2) NOT NULL
- motivo_anulacion TEXT
- anulado_por FK usuario — solo si ANULADA, debe ser ADMINISTRADOR o ASISTENTE
- nota_credito_monto DECIMAL(12,2) — monto de pagos parciales que quedan como saldo a favor al anular
- created_by FK usuario NOT NULL — vendedor que generó la venta, no editable (R2)
- created_at, updated_at
- Regla: venta LIBRE = pago completo obligatorio (R7). Venta SERVICIO = admite pagos parciales (R8).
- Regla: estado_pago cambia automáticamente a COMPLETADA cuando suma_pagos = total.

### TABLA: venta_item
- item_id SERIAL PK
- venta_id FK NOT NULL
- tipo_item ENUM('PRODUCTO','SERVICIO','ENVIO','MANUAL') NOT NULL
- producto_id FK — si PRODUCTO o SERVICIO del catálogo
- lote_id FK — si PRODUCTO, para trazabilidad de SKU (R3)
- sku VARCHAR(30) — SKU escaneado, formato cod_producto + DDMMAA
- numero_serie VARCHAR(100) — opcional, para garantía
- descripcion TEXT — nombre del producto/servicio o descripción manual
- cantidad INTEGER NOT NULL DEFAULT 1
- precio_unitario DECIMAL(10,2) NOT NULL
- subtotal DECIMAL(10,2) NOT NULL
- es_preventivo BOOLEAN DEFAULT false — heredado del presupuesto en venta servicio
- created_at
- Regla: escaneo de SKU obligatorio para tipo_item=PRODUCTO. Un SKU = una unidad física (R3).
- Regla: servicios no tienen SKU ni lote (R6).
- Regla: costo de envío se registra como item tipo ENVIO con trazabilidad completa (R13).

### TABLA: venta_pago
- pago_id SERIAL PK
- venta_id FK NOT NULL
- metodo_pago_catalogo_id FK NOT NULL — obligatorio seleccionar método (R12)
- monto DECIMAL(10,2) NOT NULL
- caja_id FK NOT NULL — caja donde se registró el pago (R17)
- created_by FK usuario NOT NULL — quién recibió el pago
- created_at
- Regla: todo pago se refleja en la caja del usuario que lo recibió (R17).
- Regla: un pago puede dividirse entre múltiples métodos (múltiples registros).

### TABLA: venta_envio
- envio_id SERIAL PK
- venta_id FK UNIQUE NOT NULL — 1 envío por venta
- direccion_id FK cliente_direccion — dirección seleccionada del cliente
- metodo_envio VARCHAR(100)
- fecha_programada DATE
- costo_envio DECIMAL(10,2) DEFAULT 0
- estado ENUM('PENDIENTE','DESPACHADO') DEFAULT 'PENDIENTE'
- created_at, updated_at
- Regla: comparte calendario con módulo domicilios para ver ocupación (R21).

### TABLA: cotizacion_venta
- cotizacion_venta_id SERIAL PK
- cliente_id FK — nullable
- caja_id FK NOT NULL — requiere caja abierta
- total_referencial DECIMAL(12,2)
- created_by FK usuario
- created_at
- Regla: es solo referencial, no afecta inventario ni reserva stock (R15). Sin vigencia, indefinida (P1).

### TABLA: cotizacion_venta_item
- item_id SERIAL PK
- cotizacion_venta_id FK NOT NULL
- producto_id FK
- descripcion TEXT
- cantidad INTEGER NOT NULL DEFAULT 1
- precio_unitario DECIMAL(10,2) NOT NULL
- subtotal DECIMAL(10,2) NOT NULL
- created_at

## Relaciones clave

- caja 1:N venta (una caja tiene muchas ventas)
- venta 1:N venta_item (una venta tiene muchos items)
- venta 1:N venta_pago (una venta tiene muchos pagos, posiblemente parciales)
- venta 1:1 venta_envio (una venta tiene 0 o 1 envío)
- venta N:1 orden_servicio (una venta puede estar asociada a un servicio)
- venta N:1 cliente (un cliente tiene muchas ventas)
- cotizacion_venta 1:N cotizacion_venta_item
- cliente 1:N cliente_direccion (un cliente tiene múltiples direcciones)

## Flujo de generación de venta desde servicios (integración C002 + C003)

1. COTIZADO → cliente aprueba → se genera venta asociada con items del presupuesto → cliente puede dejar adelanto (pago parcial)
2. APROBADO → cliente puede seguir abonando
3. AGREGAR_SKU → se precargan SKUs en la venta YA EXISTENTE (no se crea nueva)
4. AVISADO → "Cobrar" abre POS con la venta existente
5. Cuando suma_pagos = total → estado_pago = COMPLETADA → habilita ENTREGADO en servicios
6. DEVOLUCION → genera venta automática tipo REVISION_DEVOLUCION con item "Revisión [categoría]" al monto fijo → pagada → ENTREGADO

## Jerarquía de tasas de precio

El precio de venta de un producto se deriva de la tasa vigente con jerarquía:
POR_REPUESTO (tasa específica del producto) > POR_TIPO (tasa por tipo de registro) > POR_COMPONENTE (tasa por componente)
Se toma la más específica disponible.
