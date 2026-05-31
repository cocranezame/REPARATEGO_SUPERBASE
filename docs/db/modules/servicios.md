# Módulo: Servicios — Schema de Base de Datos

> Referencia: C002 (2026-05-31)

## Conceptos clave

- PRODUCTO = categoría + marca + modelo (genérico, compartido entre clientes)
- INSTANCIA = producto_id + serie + imágenes (equipo físico único de un cliente)
- SERVICIO = orden de trabajo sobre una instancia
- El cliente se obtiene siempre vía instancia, nunca directo desde servicio

## Estados (12 + 1 lateral)

VALIDACION → REVISION → DIAG_PRELIMINAR ↔ DIAG_FINAL → COTIZADO → APROBADO → AGREGAR_SKU → PRIORIDAD → REPARADO → AVISADO → ENTREGADO
ENTREGADO → GARANTIA → REPARADO o nueva OT
DIAG_FINAL → DEVOLUCION → (pagar revisión) → ENTREGADO

## Retrocesos permitidos

- DIAG_FINAL → DIAG_PRELIMINAR
- COTIZADO → DIAG_FINAL
- APROBADO → COTIZADO
- AGREGAR_SKU → APROBADO
- PRIORIDAD → AGREGAR_SKU
- AVISADO → REPARADO

## Tablas

### TABLA: periferico (catálogo)
- periferico_id SERIAL PK
- categoria_id FK NOT NULL — periféricos filtrados por categoría
- nombre VARCHAR(100) NOT NULL
- activo BOOLEAN DEFAULT true
- UNIQUE(categoria_id, nombre)
- created_at

### TABLA: costo_revision
- costo_revision_id SERIAL PK
- categoria_id FK UNIQUE NOT NULL — un costo por categoría
- monto DECIMAL(10,2) NOT NULL
- activo BOOLEAN DEFAULT true
- created_by FK usuario
- created_at, updated_at

### TABLA: instancia
- instancia_id SERIAL PK
- cliente_id FK NOT NULL
- producto_id FK NOT NULL — categoría + marca + modelo
- numero_serie VARCHAR(100) — opcional
- activo BOOLEAN DEFAULT true
- created_by FK usuario
- created_at, updated_at

### TABLA: instancia_imagen
- imagen_id SERIAL PK
- instancia_id FK NOT NULL
- url TEXT NOT NULL — S3
- descripcion TEXT
- orden INTEGER DEFAULT 1
- created_at
- Nota: las imágenes pertenecen a la instancia, no a la orden. Min 1 obligatoria antes de salir de VALIDACION. Max 3.

### TABLA: orden_servicio
- orden_servicio_id SERIAL PK
- instancia_id FK NOT NULL — el cliente se obtiene vía instancia
- sucursal_id FK
- canal ENUM('TIENDA','DOMICILIO') NOT NULL DEFAULT 'TIENDA'
- tipo_servicio ENUM('REPARACION','REVISION') DEFAULT 'REPARACION'
- falla_ingreso TEXT NOT NULL
- diagnostico_tecnico TEXT
- solucion TEXT
- costo_revision DECIMAL(10,2) NOT NULL — copiado de costo_revision al crear
- estado ENUM('VALIDACION','REVISION','DIAG_PRELIMINAR','DIAG_FINAL','COTIZADO','APROBADO','AGREGAR_SKU','PRIORIDAD','REPARADO','AVISADO','ENTREGADO','GARANTIA','DEVOLUCION') NOT NULL DEFAULT 'VALIDACION'
- motivo_devolucion ENUM('CLIENTE_CANCELO','SIN_SOLUCION') — solo si DEVOLUCION
- tecnico_id FK usuario
- vendedor_id FK usuario
- preventivo_accepted BOOLEAN — si cliente aceptó preventivo
- venta_id FK — venta asociada (se genera automáticamente en AGREGAR_SKU → REPARADO/PRIORIDAD)
- orden_padre_id FK orden_servicio — si viene de GARANTIA (relación padre-hijo)
- visita_domicilio_id FK — si viene de domicilio
- lead_id FK — si viene del CRM
- created_by FK usuario
- created_at, updated_at

### TABLA: orden_servicio_periferico
- orden_servicio_id FK NOT NULL
- periferico_id FK NOT NULL
- PK(orden_servicio_id, periferico_id)
- created_at

### TABLA: orden_servicio_componente
- id SERIAL PK
- orden_servicio_id FK NOT NULL
- componente_id FK NOT NULL
- tipo_afectacion ENUM('PREVENTIVO','CORRECTIVO') NOT NULL
- tipo_accion ENUM('REPARACION','CAMBIO') NOT NULL DEFAULT 'REPARACION'
- etapa ENUM('PRELIMINAR','FINAL') NOT NULL
- created_by FK usuario
- created_at

### TABLA: orden_servicio_cotizacion
- cotizacion_item_id SERIAL PK
- orden_servicio_id FK NOT NULL
- tipo_item ENUM('REPUESTO','SERVICIO','MANUAL') NOT NULL
- producto_id FK — nullable si MANUAL
- componente_id FK — nullable, componente que originó este item
- descripcion_manual TEXT — solo si MANUAL
- cantidad INTEGER NOT NULL DEFAULT 1
- precio_unitario DECIMAL(10,2) NOT NULL — precio congelado al momento
- subtotal DECIMAL(10,2) NOT NULL
- es_preventivo BOOLEAN NOT NULL DEFAULT false
- created_at

### TABLA: orden_servicio_evidencia
- evidencia_id SERIAL PK
- orden_servicio_id FK NOT NULL
- url TEXT NOT NULL — S3
- etapa ENUM('VALIDACION','REVISION','DIAG_PRELIMINAR','DIAG_FINAL','REPARACION','ENTREGA')
- descripcion TEXT
- created_by FK usuario
- created_at
- Nota: máximo 5 evidencias por orden

### TABLA: orden_servicio_sku_asignado
- sku_asignado_id SERIAL PK
- orden_servicio_id FK NOT NULL
- lote_id FK NOT NULL — referencia al lote de inventario
- producto_id FK NOT NULL
- cantidad INTEGER NOT NULL DEFAULT 1
- precio_presupuesto DECIMAL(10,2) NOT NULL — precio del presupuesto aprobado
- estado ENUM('ASIGNADO','CONSUMIDO') DEFAULT 'ASIGNADO'
- created_by FK usuario
- created_at, updated_at
- Nota: al pasar de AGREGAR_SKU a REPARADO/PRIORIDAD, estado cambia a CONSUMIDO y se genera movimiento_inventario tipo SERVICIO

### TABLA: orden_servicio_requerimiento
- requerimiento_id SERIAL PK
- orden_servicio_id FK NOT NULL
- producto_id FK — nullable si es repuesto nuevo no catalogado
- imagen_url TEXT — S3
- descripcion TEXT NOT NULL
- cantidad INTEGER NOT NULL DEFAULT 1
- observacion TEXT
- estado ENUM('PENDIENTE','EN_COMPRA','ATENDIDO','ANULADO') DEFAULT 'PENDIENTE'
- created_by FK usuario
- created_at, updated_at
- Nota: si hay stock se asigna directo. Si no, se busca proveedor y genera solicitud_compra → módulo Compras

### TABLA: orden_servicio_aceptacion
- aceptacion_id SERIAL PK
- orden_servicio_id FK NOT NULL
- tipo ENUM('VALIDACION','PRESUPUESTO') NOT NULL
- canal_aceptacion ENUM('PORTAL_CLIENTE','MANUAL_TIENDA','MANUAL_WHATSAPP') NOT NULL
- accepted_at TIMESTAMP NOT NULL
- ip_address VARCHAR(45) — solo portal
- documento_version VARCHAR(20) — versión de T&C
- texto_mostrado TEXT — texto exacto mostrado (respaldo legal INDECOPI)
- metodo_aceptacion ENUM('CLICK_BUTTON','FIRMA_DIGITAL','CHECKBOX')
- approved_by FK usuario — solo manual
- manual_reason ENUM('TIENDA','WHATSAPP') — solo manual
- evidence_image_url TEXT — captura WhatsApp, obligatorio si MANUAL_WHATSAPP
- preventivo_accepted BOOLEAN — solo si tipo=PRESUPUESTO
- created_at

### TABLA: orden_servicio_historial
- historial_id SERIAL PK
- orden_servicio_id FK NOT NULL
- estado_anterior VARCHAR(30) NOT NULL
- estado_nuevo VARCHAR(30) NOT NULL
- usuario_id FK NOT NULL
- observacion TEXT
- created_at

### TABLA: orden_servicio_observacion
- observacion_id SERIAL PK
- orden_servicio_id FK NOT NULL
- etapa VARCHAR(30) NOT NULL
- texto TEXT NOT NULL
- usuario_id FK NOT NULL
- created_at

## Relaciones clave

- cliente 1:N instancia (un cliente tiene muchos equipos)
- instancia 1:N orden_servicio (un equipo puede regresar)
- producto 1:N instancia (mismo modelo, distintos clientes)
- orden_servicio 1:N orden_servicio_componente
- orden_servicio 1:N orden_servicio_cotizacion
- orden_servicio 1:N orden_servicio_evidencia (max 5)
- orden_servicio 1:N orden_servicio_sku_asignado
- orden_servicio 1:N orden_servicio_requerimiento
- orden_servicio 1:N orden_servicio_aceptacion (max 2: validación + presupuesto)
- orden_servicio 1:N orden_servicio_historial
- orden_servicio 1:N orden_servicio_observacion
- orden_servicio N:N periferico vía orden_servicio_periferico
- orden_servicio 1:1 venta (opcional, se genera automáticamente)
- orden_servicio 1:1 orden_padre (opcional, solo GARANTIA)
