# Business Rules — ReparaTego

> Reglas de negocio por módulo. Se actualiza conforme se implementa cada épica.

## Generales

- Todo dato pertenece a un tenant (multi-empresa)
- Soft delete en todas las entidades (campo `activo`)
- Auditoría de cambios en entidades críticas
- Moneda: PEN (Soles peruanos)
- Zona horaria: America/Lima (UTC-5)
- IGV: 18% (configurable por tenant)

## Seguridad

- Roles: ADMIN, TECNICO, VENDEDOR, CAJERO
- ADMIN puede ver/hacer todo
- TECNICO puede gestionar órdenes de servicio y diagnósticos
- VENDEDOR puede gestionar cotizaciones y ventas
- CAJERO puede registrar pagos y cobros
- Un usuario puede estar asociado a una o más sucursales
- Feature flags permiten habilitar/deshabilitar funcionalidades por tenant

## Catálogos

- Categorías son jerárquicas (padre/hijo opcional)
- Componentes se asocian a categorías
- Modelos se asocian a marcas
- Todos los catálogos son por tenant (cada negocio tiene sus propios)

## Inventario

- Stock se maneja por sucursal
- Precio de compra y precio de venta por producto
- Movimientos de stock: ENTRADA, SALIDA, AJUSTE, TRANSFERENCIA
- Stock mínimo configurable por producto (alerta)

## Servicios (Órdenes de Servicio)

- Estados: RECIBIDO → EN_DIAGNOSTICO → DIAGNOSTICADO → EN_REPARACION → REPARADO → ENTREGADO → CERRADO
- Cada estado tiene fecha y usuario que lo cambió
- Diagnóstico incluye: problema reportado, problema encontrado, solución propuesta, costo estimado
- Evidencias: fotos obligatorias al recibir equipo

## Compras / Ventas

- Cotización puede convertirse en orden/venta
- Estados cotización: BORRADOR → ENVIADA → APROBADA → RECHAZADA → VENCIDA
- IGV se calcula automáticamente
- Descuentos opcionales por línea o por total
