# Reglas de Negocio — ReparaTego

> Reglas de negocio por módulo. Referencia para validaciones en API y UI.

## Generales

- Multitenancy: todos los datos aislados por tenant_id
- Soft delete: registros se desactivan (activo=false), nunca se borran
- Auditoría: created_at, updated_at en todas las tablas
- Moneda: PEN (soles peruanos)
- IGV: 18% (configurable por tenant para futuro)
- Zona horaria: America/Lima (UTC-5)

## Seguridad

- Login por numero_documento + password (no por email)
- Password hasheado con bcrypt
- JWT con claims: tenant_id, user_id, rol, sucursal_id
- Roles: ADMIN (todo), TECNICO (servicios+domicilios), VENDEDOR (ventas+clientes), CAJERO (caja+ventas)
- Feature flags habilitan/deshabilitan módulos opcionales (CRM, Domicilios)
- Solo una sucursal es_principal por tenant

## Catálogos

- Categorías jerárquicas (ej: Celulares > Smartphones > Android)
- Componentes se asocian a una categoría (ej: "Pantalla" → "Celulares")
- Modelos pertenecen a marca + categoría (ej: "Galaxy S24" → Samsung + Celulares)
- Catálogos son por tenant (cada negocio maneja sus propios)

## Clientes

- tipo_persona determina campos requeridos: NATURAL=nombres+apellidos, JURIDICA=razon_social
- Un cliente puede tener múltiples direcciones (con lat/lng para domicilios)
- Solo una dirección es_principal por cliente
- Búsqueda por DNI/RUC exacto + búsqueda libre

## Inventario

- Código autogenerado: PRD-XXXX (producto) o SRV-XXXX (servicio), secuencial por tenant
- Un producto puede ser compatible con múltiples modelos (N:M)
- Stock = SUM(movimiento_inventario.cantidad) por producto + sucursal
- Stock mínimo: alerta visual cuando stock_actual < stock_minimo
- Tasa de precio: precio_venta = precio_compra × (1 + porcentaje/100)
- Movimientos son inmutables (no se editan, se crean REAJUSTE para correcciones)
- Tipos de movimiento: INGRESO (compra), VENTA, SERVICIO (repuesto usado), MERMA, REAJUSTE, TRANSFERENCIA

## Proveedores

- Identificados por RUC (único por tenant)
- Múltiples contactos, métodos de pago (cuentas bancarias) y líneas de producto
- Calificación manual 1-5 estrellas

## Compras (Cotizaciones + Solicitudes + OC)

- **Cotización de compra:** solicitar precios a proveedor → proveedor responde con precios → COTIZADA
- **Solicitud de compra:** pedido interno de un producto, puede nacer de alerta stock mínimo
- **Orden de compra:** agrupa solicitudes por proveedor
- **Flujo OC:** GENERADA → ENVIADA → TERMINADA → confirmar items → INGRESADA → PENDIENTE_PAGO
- Al confirmar items: se crean lotes + movimientos INGRESO (transaccional)
- Al pagar: OC pasa a TERMINADA (ciclo completo)

## Servicios (Órdenes de Servicio)

- **11 estados:** RECEPCION → EN_DIAGNOSTICO → DIAGNOSTICADO → COTIZADO → APROBADO → EN_REPARACION → REPARADO → LISTO_ENTREGA → ENTREGADO | DEVOLUCION. Cualquiera → CANCELADO
- Fotos obligatorias en RECEPCION
- Componentes: se registran al recibir (preliminar) y tras diagnóstico (final)
- Cotización al cliente con precios congelados (no cambian si el catálogo se actualiza después)
- El cliente debe aprobar la cotización antes de iniciar reparación
- Tipos: CORRECTIVO (reparación) y PREVENTIVO (mantenimiento)
- Puede originarse de una visita a domicilio

## Ventas

- Venta siempre asociada a una caja abierta
- **4 tipos:** LIBRE (productos sueltos), SERVICIO (cobro de OS), REVISION_DOMICILIO (cobro por visita cancelada), REVISION_DEVOLUCION
- Soporte multi-método de pago (ej: parte Yape + parte efectivo)
- Estados: PENDIENTE → PAGADA (si pago completo) | PARCIAL (si pago parcial) | ANULADA
- Anulación revierte movimientos de stock automáticamente
- Caja: apertura con monto inicial, cierre con conteo y diferencia

## Domicilios

- Tarifa calculada por distrito (catálogo configurable)
- **7 estados:** POR_VALIDAR → VALIDADA → ASIGNADA → EN_CAMINO → EN_SITIO → TERMINADA | CANCELADA
- Disponibilidad de técnicos: no se pueden programar dos visitas solapadas
- Si la visita resulta en reparación → se crea orden_servicio vinculada
- Si el cliente cancela → puede generar venta tipo REVISION_DOMICILIO (cobro de la tarifa)

## CRM

- Token de WhatsApp cifrado con pgcrypto (nunca texto plano en DB)
- Pipeline de leads con etapas configurables y transiciones válidas
- Agente Nico: LLM con tools habilitados por tenant
- Tools de Nico: consultar_stock, agendar_visita, crear_cotizacion, buscar_estado_orden, transferir_a_humano
- Bots: respuestas automáticas por keyword, horario o primera vez
- Eventos del agente se logean para métricas
- Integración con EventBridge para eventos CRM (nuevo lead, mensaje, etc.)

## Servicios — Reglas de Negocio (C002)

### Registro y validación
R1  — No puede salir de VALIDACIÓN sin al menos 1 imagen en la instancia.
R2  — No puede pasar a REVISIÓN sin aceptación del cliente (portal o manual).
R3  — El costo de revisión se autocompleta según la categoría del producto.
R20 — Las imágenes del equipo pertenecen a la INSTANCIA, no a la orden. Si el equipo regresa, las imágenes ya están.
R21 — Una instancia = producto_id + serie + imágenes. El mismo producto puede pertenecer a distintos clientes con instancias diferentes.
R22 — El canal (TIENDA/DOMICILIO) se selecciona al registrar y define el color de la tarjeta en el kanban (verde/amarillo).

### Componentes y diagnóstico
R4  — Componentes usan doble clasificación: click izquierdo cicla afectación (preventivo → correctivo → desmarcado), click derecho alterna acción (reparación ↔ cambio). Default es REPARACIÓN.
R5  — Colores: verde = preventivo, amarillo = correctivo + reparación, rojo = correctivo + cambio.
R6  — Click derecho solo funciona sobre componentes ya marcados. En mobile se reemplaza por long press.
R7  — CAMBIO dirige a "Buscar repuesto", REPARACIÓN dirige a "Buscar servicio". Relación fija, no modificable por la vendedora.

### Cotización y presupuesto
R8  — El presupuesto base es solo CORRECTIVO. El preventivo es opcional y se suma si el cliente lo acepta.
R9  — Los precios se CONGELAN al registrar la cotización. Cambios posteriores en catálogo no afectan cotizaciones existentes.
R10 — Items de cotización heredan preventivo/correctivo del componente origen. Items manuales deben ser clasificados por la vendedora.
R23 — Tab de búsqueda activo por default es el más específico con al menos 1 resultado.
R24 — Repuestos con stock 0 se muestran pero con botón [+] deshabilitado.
R25 — Servicios no manejan stock y siempre están disponibles.

### SKUs, ventas y entrega
R11 — Al pasar de AGREGAR SKU a REPARADO/PRIORIDAD se genera AUTOMÁTICAMENTE una VENTA con SKUs y precios del presupuesto.
R12 — NO se puede pasar a ENTREGADO si la venta tiene saldo pendiente.
R13 — En DEVOLUCIÓN se genera venta por costo de revisión según categoría.
R26 — Si un repuesto cotizado no tiene stock al asignar SKU, se genera requerimiento de compra automático.

### Garantía
R14 — Al generar nueva OT desde GARANTÍA queda referencia a la orden original (relación padre-hijo).
R19 — ENTREGADO sale del kanban. Solo visible desde lista de servicios. Puede reactivarse a GARANTÍA.

### Aprobaciones y trazabilidad legal
R15 — Toda aprobación manual requiere CONTRASEÑA del vendedor.
R16 — Aprobación manual por WhatsApp requiere CAPTURA adjunta obligatoria.
R17 — Las aceptaciones guardan IP, timestamp, versión de T&C y texto_mostrado para respaldo legal (INDECOPI).

### Requerimientos
R18 — Los requerimientos se consultan contra inventario y proveedores antes de generar solicitud de compra.

### Pendientes resueltos (C002)
PR1 — Vendedora SÍ puede reclasificar preventivo/correctivo antes de registrar cotización. Inmutable después.
PR2 — Si técnico modifica componentes en DIAG_FINAL tras retroceso desde COTIZADO, la cotización anterior se invalida y debe armarse nueva.
PR3 — Búsqueda con paginación (50 items por página).
PR4 — Item MANUAL se clasifica manualmente como preventivo/correctivo por la vendedora.
PR5 — Sin log de auditoría para tipo_accion por ahora, basta con registro final.

## Ventas — Reglas de Negocio (C003)

### Caja
V1  — Sin caja abierta no se accede a ventas ni cotizaciones. Solo una caja abierta por usuario a la vez.
V17 — Todo movimiento de pago se refleja en la caja abierta del usuario que lo recibió.

### Registro de venta
V2  — Toda venta registra automáticamente el usuario que la generó. No es editable.
V3  — Escaneo de SKU obligatorio para agregar productos al carrito. Un SKU = una unidad física. Múltiples unidades = múltiples escaneos.
V4  — Stock global = suma de lotes activos por producto. Nunca se edita manualmente.
V5  — Se valida stock disponible antes de confirmar. Sin stock = no se permite confirmar.
V6  — Servicios nunca tienen stock, SKU ni lotes. Solo nombre y precio en catálogo.

### Tipos de venta y pagos
V7  — Venta libre = pago completo obligatorio. No admite pagos parciales sin excepción.
V8  — Venta asociada a servicio = admite pagos parciales (adelantos) desde COTIZADO/APROBADO.
V9  — Un servicio solo pasa a ENTREGADO cuando su venta asociada está pagada al 100%.
V10 — Si la venta está asociada a un servicio, el cliente se hereda vía instancia y no es editable.
V11 — En venta libre el cliente es opcional.
V12 — Al registrar cualquier pago se debe seleccionar obligatoriamente el método de pago.

### Envío
V13 — El costo de envío se registra como item tipo ENVIO con trazabilidad completa.
V20 — Un cliente puede tener múltiples direcciones. Al marcar envío se elige cuál usar o se agrega nueva.
V21 — Los envíos (delivery) y domicilios comparten el mismo calendario para visualizar ocupación.

### Cotización y precios
V14 — El servicio de revisión tiene precio fijo configurado por categoría de equipo.
V15 — La cotización es solo referencial. No afecta inventario ni reserva stock. Sin vigencia, indefinida.
V16 — El estado de la venta se determina por el cruce de dos ejes independientes: pago y despacho.

### Devolución y anulación
V18 — DEVOLUCIÓN genera automáticamente una venta por revisión al monto fijo. Pagada → ENTREGADO.
V19 — Trazabilidad completa: servicio → venta → items (SKU + lote) → pagos → caja.
V22 — Al anular una venta se revierte el descuento de stock (SKUs reingresan a sus lotes originales). Requiere validación de ADMINISTRADOR o ASISTENTE.

### Flujo integrado servicios → ventas (C002 + C003)
V23 — En COTIZADO/APROBADO se genera venta tipo SERVICIO con items del presupuesto para recibir adelantos.
V24 — En AGREGAR_SKU se precargan los SKUs escaneados en la venta ya existente, no se crea nueva.
V25 — En AVISADO "Cobrar" abre el POS con la venta existente y abonos previos visibles.
V26 — En DEVOLUCIÓN se genera automáticamente venta tipo REVISION_DEVOLUCION con item revisión al monto fijo por categoría.

### Permisos
V27 — Vendedor ve solo sus ventas. Administrador ve todas.
V28 — Anulación requiere rol ADMINISTRADOR o ASISTENTE. Si hay pagos parciales, se registra nota de crédito como saldo a favor del cliente.

### Pendientes resueltos (C003)
PV1 — Cotización indefinida, sin vigencia.
PV2 — Se puede anular venta con pagos parciales. Requiere ADMINISTRADOR o ASISTENTE. Montos pagados quedan como saldo a favor (nota de crédito).
PV3 — Voucher NO incluye QR/código de barras. Los códigos de barras son exclusivos de productos inventariados (SKUs) para escaneo en POS.
PV4 — Vendedor ve solo sus ventas, Administrador ve todas.
PV5 — Reporte de cierre de caja imprimible.
PV6 — Descuentos/promociones diferido a post-producción.

## Inventario — Reglas de Negocio (C004)

### Productos y servicios
I1  — No pueden existir productos duplicados por combinación categoría + componente + marca + modelo aunque el nombre sea diferente.
I2  — No pueden existir servicios duplicados por combinación categoría + componente + marca + modelo + nombre aunque la descripción sea diferente.
I3  — Servicios no llevan control de stock. No tienen SKU ni lotes.
I4  — Código autogenerado: 3 primeras letras de la categoría en mayúsculas + ID del registro, sin guion ni separador.
I5  — Descripción de servicio es opcional.

### Proveedores y cotización
I6  — Un proveedor no puede tener combinaciones repetidas de categoría + componente en sus líneas de abastecimiento.
I7  — Proveedores se clasifican automáticamente: SEGURO (coinciden categoría + componente) y POSIBLE (solo categoría).
I8  — La cotización no tiene proveedor ganador. La decisión de compra se toma al momento del ingreso.
I9  — Se permiten múltiples ingresos desde la misma cotización con diferentes proveedores.
I10 — Mensaje WhatsApp generado como URL (wa.me/{numero}?text={mensaje}) sin necesidad de API de WhatsApp Business.

### Lotes y SKU
I11 — SKU formato: código producto + DDMMAA sin separador + correlativo si hay más de un proveedor mismo producto mismo día.
I12 — Ingreso manual: mismo producto + mismo día + mismo proveedor = editar lote existente sumando cantidad. Diferente proveedor mismo día = nuevo lote con correlativo.
I13 — Ingreso por OC: SIEMPRE crea lote nuevo, nunca edita existente. Transacción atómica con rollback completo.
I14 — Al completar ingreso por OC: OC y solicitudes vinculadas cambian a INGRESADA, OC sale del kanban.

### Stock y movimientos
I15 — Stock global = suma de lotes activos por producto. Nunca se edita manualmente.
I16 — Campo stock_minimo por producto para alertas de reabastecimiento (default 0).
I17 — Consumo de lotes: FIFO por defecto (se consume primero el lote más antiguo con stock disponible). Excepción: cuando se escanea SKU específico en POS/servicio, se consume ese lote puntual.
I18 — Tipos de salida: VENTA, SERVICIO, MERMA, REAJUSTE.
I19 — Merma y reajuste requieren rol ADMINISTRADOR o ALMACEN.

### Tasas y precios
I20 — Jerarquía de tasas: POR_REPUESTO > POR_TIPO > POR_COMPONENTE. Se toma la más específica disponible.
I21 — Tasa editable en cualquier momento con recálculo instantáneo del precio de venta.
I22 — Último costo se obtiene de la cotización usada en el último movimiento de ingreso del producto.
I23 — Precio de venta se recalcula automáticamente al cambiar tasa o al registrar nuevo ingreso.

### Permisos
I24 — ADMINISTRADOR: acceso total al módulo inventario.
I25 — ALMACEN: stock, lotes, movimientos (lectura y escritura), merma y reajuste.
I26 — VENDEDOR: solo lectura de stock disponible y precios de venta.

### Auditoría
I27 — Todo registro almacena usuario que lo creó y fecha de creación/actualización.
I28 — Soft delete (campo activo) en productos, servicios y proveedores. Nunca eliminación física.
