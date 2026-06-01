# Épica 10 — Servicios / Órdenes de Servicio

> Referencia: C002 (2026-05-31)
> Estado: DB+API+Web DONE (Portal cliente pendiente)
> Branch: main (mergeado)
> 28 tickets / 6 sub-épicas

## Sub-épica 10A: Backend base (T1-T5)

- E10.1 — Migración: tablas periferico, costo_revision, instancia, instancia_imagen, orden_servicio, orden_servicio_periferico, orden_servicio_componente, orden_servicio_cotizacion, orden_servicio_evidencia, orden_servicio_sku_asignado, orden_servicio_requerimiento, orden_servicio_aceptacion, orden_servicio_historial, orden_servicio_observacion (14 tablas) — estado: DONE
- E10.2 — API CRUD costo_revision por categoría (GET/POST/PATCH) — estado: DONE
- E10.3 — API registro de orden POST /servicios-v2/ordenes (cliente, instancia, periféricos, falla, imágenes, canal → estado VALIDACION) — estado: DONE
- E10.4 — API cambio de estado PATCH /servicios-v2/ordenes/:id/estado (motor de transiciones con validación de reglas + retrocesos + registro en historial) — estado: DONE
- E10.5 — API listar servicios GET /servicios-v2/ordenes (filtros: estado, cliente, fecha, tipo, canal + paginación + estado de venta) — estado: DONE

## Sub-épica 10B: Portal del cliente (T6-T9)

- E10.6 — Auth portal cliente: login DNI + celular, JWT temporal, ruta /mis-equipos — estado: TODO
- E10.7 — Vista validación portal: datos servicio, producto, fotos, falla, costo revisión, T&C, botón aceptar con trazabilidad legal (IP, timestamp, versión T&C, texto_mostrado) — estado: TODO
- E10.8 — Vista presupuesto portal: diagnóstico, solución, evidencias, presupuesto correctivo/preventivo, selector preventivo, botón aprobar — estado: TODO
- E10.9 — Vistas informativas portal: en revisión, en reparación, listo para recoger, entregado, devuelto — estado: TODO

## Sub-épica 10C: Kanban estados 1-4 + Cotización (T10-T16)

- E10.10 — Kanban base + tarjeta uniforme (11 columnas, color por canal azul=tienda/verde=domicilio) — estado: DONE
- E10.11 — Modal VALIDACIÓN (2 pestañas: WhatsApp + manual con contraseña) — estado: DONE
- E10.12 — Modal REVISIÓN (diagnóstico, componentes doble clasificación 3 colores, evidencias, requerimientos) — estado: DONE
- E10.13 — Modal DIAG. PRELIMINAR (editable, guardar o avanzar a final) — estado: DONE
- E10.14 — Modal DIAG. FINAL (lectura, 3 botones: armar cotización, devolución, regresar) — estado: DONE
- E10.15 — Modal Armar Cotización (componentes con botón contextual, tabla items, totales separados correctivo/preventivo, registrar → COTIZADO) — estado: DONE
- E10.16 — Modal búsqueda repuesto/servicio (componente reutilizable, filtros removibles, tabs 4 niveles con counts, paginación 50 items, stock) — estado: DONE

## Sub-épica 10D: Kanban estados 5-10 (T17-T23)

- E10.17 — Modal COTIZADO (2 pestañas: WhatsApp presupuesto + manual con contraseña) — estado: DONE
- E10.18 — Modal APROBADO (lectura, agregar SKU o retroceder) — estado: DONE
- E10.19 — Modal AGREGAR SKU (asignar lote+producto+precio, tabla SKUs asignados, PRIORIDAD/REPARADO) — estado: DONE
- E10.20 — Modal PRIORIDAD (observación, pasar a reparado o regresar) — estado: DONE
- E10.21 — Modal REPARADO (resumen cotización, link WA notificación, → AVISADO) — estado: DONE
- E10.22 — Modal AVISADO (badge estado venta, bloqueo si pendiente, → ENTREGADO o regresar) — estado: DONE
- E10.23 — Modal DEVOLUCIÓN (motivo + observación, nota mini-venta costo_revision) — estado: DONE

## Sub-épica 10E: Garantía + Lista (T24-T26)

- E10.24 — Flujo GARANTÍA (ModalGarantia con observación desde lista ENTREGADO → GARANTIA) — estado: DONE (parcial: sin generar nueva OT padre-hijo)
- E10.25 — Lista de servicios (tabla completa, 13 estados con colores, canal badge, filtros) — estado: DONE
- E10.26 — Detalle de servicio (5 tabs: info, cotización, componentes, evidencias, historial + observaciones) — estado: DONE

## Sub-épica 10F: Requerimiento + Integración (T27-T28)

- E10.27 — Kanban Requerimiento (4 columnas PENDIENTE/EN_COMPRA/ATENDIDO/ANULADO, cards por orden activa) — estado: DONE
- E10.28 — Integración Ventas (generar venta automática al confirmar SKUs, validar pago antes de ENTREGADO, generar venta revisión en DEVOLUCIÓN) — estado: DONE (backend)

## Dependencias

- Requiere completado: E1 (seguridad), E2 (catálogos), E3 (clientes), E4 (inventario/productos)
- Requiere parcial: E5 (proveedores, para requerimientos), E8 (lotes, para SKUs)
- Alimenta: E11 (ventas), E7 (compras vía requerimientos), E12 (domicilios vía canal), E13 (CRM vía lead_id)
