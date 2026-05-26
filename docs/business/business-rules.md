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
