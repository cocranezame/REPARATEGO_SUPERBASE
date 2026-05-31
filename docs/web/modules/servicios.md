# Módulo: Servicios — Pantallas Web

> Referencia: C002 (2026-05-31)
> Ruta base: /servicios

## 3 vistas en el sidebar

### 1. Lista de servicios (/servicios/lista)

Tabla con columnas:
- Número de servicio (#NNN)
- Cliente (nombre, DNI, celular) — obtenido vía instancia
- Equipo (categoría, marca, modelo) — obtenido vía instancia → producto
- Estado del servicio (12 estados)
- Estado de la venta (sin generar / pendiente / adelanto / pagado)
- Tipo: REPARACIÓN o REVISIÓN
- Canal: TIENDA o DOMICILIO
- Icono ojo → abre detalle completo

Filtros: estado, cliente, fecha, tipo, canal, sucursal
Paginación
Desde aquí se puede cambiar ENTREGADO → GARANTÍA

### 2. Kanban servicio (/servicios/kanban)

11 columnas visibles (ENTREGADO no aparece en kanban)
VALIDACION | REVISION | DIAG_PRELIMINAR | DIAG_FINAL | COTIZADO | APROBADO | AGREGAR_SKU | PRIORIDAD | REPARADO | AVISADO | DEVOLUCION

Tarjeta uniforme en todas las columnas:
- Número de servicio (#NNN)
- Cliente (nombre, DNI, celular)
- Producto (categoría, marca, modelo)
- Falla de ingreso
- Fecha de registro
- Imagen del producto (thumbnail de instancia)
- COLOR: VERDE = canal tienda, AMARILLO = canal domicilio

Click en tarjeta abre modal según estado.

### 3. Kanban requerimiento (/servicios/requerimientos)

Vista kanban de requerimientos de repuestos generados desde REVISIÓN.
Columnas: PENDIENTE | EN_COMPRA | ATENDIDO | ANULADO
Cada tarjeta: producto, descripción, imagen, orden vinculada, estado
Alimenta el módulo de Compras.

## Modales por estado

### Modal VALIDACIÓN (2 pestañas)

Pestaña 1 — Aprobación cliente:
- Botón enviar WhatsApp con datos del servicio + URL portal (reparatego.com/mis-equipos)
- Al aprobar cliente desde portal → pasa automáticamente a REVISIÓN

Pestaña 2 — Aprobación manual:
- Selector: "En tienda" o "Por WhatsApp"
- Si WhatsApp → campo adjuntar captura (OBLIGATORIO)
- Si tienda → no pide nada adicional
- Campo CONTRASEÑA del vendedor para confirmar
- Al confirmar → pasa a REVISIÓN

### Modal REVISIÓN

Cabecera: datos cliente + producto + falla + costo revisión + observaciones

Dos botones de acción: "Diagnóstico Preliminar" y "Diagnóstico Final"
Al click en cualquiera se expande sección con:

a) Diagnóstico técnico / Solución aplicada — campos de texto

b) Componentes a cambiar — grilla 3 columnas:
- Click izquierdo: cicla PREVENTIVO+REP (verde) → CORRECTIVO+REP (amarillo) → desmarcado
- Click derecho (solo marcados): alterna REPARACION ↔ CAMBIO. Mobile: long press
- 3 colores: VERDE=preventivo, AMARILLO=correctivo+reparación, ROJO=correctivo+cambio
- Badge "rep" o "cambio" en esquina del componente
- Leyenda de colores debajo

c) Evidencias — max 5, imagen + descripción, upload S3

d) Solicitud de repuestos para descarte (requerimientos):
- Imagen + descripción del componente necesario
- Observación adicional opcional
- Consulta inventario → si hay stock asigna directo, si no genera solicitud compra

### Modal DIAG. PRELIMINAR

Misma info que REVISIÓN pero con datos ya llenados y editables.
Dos acciones: "Guardar cambios" (se queda) | "Pasar a Diagnóstico Final"

### Modal DIAG. FINAL

Modo LECTURA con datos del producto y diagnóstico completo.
Permite modificar y guardar cambios si es necesario.
Tres botones:
1. ARMAR COTIZACIÓN → abre modal de cotización
2. DEVOLUCIÓN → selector motivo (cliente canceló / sin solución) → columna DEVOLUCION
3. REGRESAR A DIAG. PRELIMINAR

### Modal ARMAR COTIZACIÓN (se abre desde DIAG. FINAL)

Cabecera: datos cliente + componentes afectados con colores y badges
Diagnóstico solo lectura

Lista de componentes afectados (vertical):
- Colores heredados del marcado del técnico
- Botón contextual por componente: CAMBIO → "Buscar repuesto" / REPARACION → "Buscar servicio"
- Relación FIJA, no modificable por vendedora

Tabla items del presupuesto:
- Columnas: Tipo | Item | Cant | P. venta | Subtotal | Eliminar
- Vendedora puede reclasificar preventivo/correctivo antes de registrar

3 formas de agregar items:
a) Desde componente (botón contextual) → abre modal búsqueda con filtros precargados + componente
b) Botones generales: "Buscar repuesto" / "Buscar servicio" → sin componente asociado
c) Botón "+ Manual" → descripción libre + precio, vendedora clasifica preventivo/correctivo

Footer: Correctivo S/ XXX | Preventivo S/ XXX | Total S/ XXX

Observación de etapa (opcional)

Tres botones: Regresar a Diag. Final | Cancelar | Registrar Cotización → COTIZADO

### Modal búsqueda repuesto/servicio (COMPONENTE REUTILIZABLE)

Header: componente origen + tipo de acción (si aplica)

Filtros como chips removibles: categoría, marca, modelo (precargados desde orden)
- X individual por filtro
- Botón "Ver global" quita todos
- Botón "Restaurar filtros" los repone

Barra búsqueda texto libre

Tabs 4 niveles con counts:
- Compatibilidad (categoría + marca + modelo)
- Marca (categoría + marca)
- Categoría (solo categoría)
- Global (todo el sistema)

Tab activo por default: el más específico con al menos 1 resultado
Paginación 50 items por página

Tabla resultados:
- Repuestos: muestran columna Stock. Stock 0 → botón [+] deshabilitado
- Servicios: sin stock, siempre disponibles
- Columna "Nivel" solo visible en modo global
- Botón [+] por fila → agrega al presupuesto, hereda preventivo/correctivo del componente
- Modal se cierra automáticamente al seleccionar

### Modal COTIZADO (2 pestañas)

Pestaña 1 — Enviar por WhatsApp:
- Mensaje prearmado con datos cliente + equipo + presupuesto correctivo
- Botón "Abrir WhatsApp" con URL portal + voucher
- Estado cambia a APROBADO cuando cliente confirma desde portal
- Botón "Regresar a Diagnóstico Final"

Pestaña 2 — Aprobar manualmente:
- Selector: "En tienda" o "Por WhatsApp"
- Si WhatsApp → captura obligatoria
- Contraseña vendedor
- Registra aceptación con tipo=PRESUPUESTO + preventivo_accepted
- Al aprobar → APROBADO

### Modal APROBADO

Datos equipo solo lectura.
Dos botones: "Agregar SKU" → AGREGAR_SKU | "Retroceder a Cotizado"

### Modal AGREGAR SKU

Cabecera: cliente, equipo, número servicio, presupuesto total

Sección "Presupuesto aprobado — repuestos a asignar": lista items aprobados con precios

Sección "SKUs asignados": repuestos vinculados con cantidad + botón "CONSUMO"

Dos pestañas:
- Repuesto (SKU): escanear o escribir SKU + Enter
- Servicio: buscar servicio por nombre

Sección "Continuar con..." — 3 botones:
- PRIORIDAD → estado PRIORIDAD
- REPARADO → estado REPARADO
- APROBADO → retrocede
- Cancelar

REGLA CRÍTICA: al pasar a REPARADO o PRIORIDAD se genera AUTOMÁTICAMENTE una VENTA con SKUs y precios del presupuesto.

### Modal PRIORIDAD

Datos equipo solo lectura.
Dos botones: "Pasar a Reparado" → REPARADO | "Regresar a Agregar SKU"

### Modal REPARADO

Datos cliente y producto solo lectura.
Botón "AVISAR" → abre segundo modal:
- Historial de observaciones
- Indicador: "Se enviará mensaje de WhatsApp al [celular]"
- Mensaje editable prearmado (nombre, equipo, listo para recoger)
- Botón "Abrir WhatsApp y enviar mensaje"
- Observación de etapa (autocompleta con "Cliente avisado al [celular]")
- Cancelar / Confirmar → AVISADO

### Modal AVISADO

Tres botones:
1. COBRAR → abre ventana ventas con items del SKU
2. PASAR A ENTREGADO → valida pago completado. Si pendiente → BLOQUEADO
3. REGRESAR A REPARADO

### Modal DEVOLUCIÓN

Muestra motivo (cliente canceló / sin solución).
Botón "PAGAR REVISIÓN" → genera venta por costo revisión según categoría.
Una vez pagado → botón ENTREGADO habilitado.

### Flujo GARANTÍA (desde lista, no kanban)

Desde orden ENTREGADO en lista → botón "Garantía" → tarjeta vuelve al kanban.
Modal con 2 opciones:
1. REPARADO → regresa a ENTREGADO (sale del kanban)
2. GENERAR NUEVA OT → crea orden nueva vinculada (padre-hijo)

## Detalle de servicio (/servicios/:id)

Vista completa accesible desde icono ojo en lista.
Secciones: info general, instancia, cliente, historial de estados, diagnósticos, componentes, evidencias, presupuesto, SKUs asignados, requerimientos, datos de venta, estado de pagos, aceptaciones, observaciones.

## Portal del cliente (reparatego.com/mis-equipos)

Auth: DNI + celular → JWT temporal

Vista "Mis Equipos": lista de instancias con servicio activo.

Info mostrada por estado:
- VALIDACION: datos personales, producto, fotos, falla, costo revisión, T&C → botón aceptar
- REVISION/DIAG_PRELIMINAR/DIAG_FINAL: todo anterior + "Su equipo está siendo revisado" (sin detalles técnicos)
- COTIZADO: todo anterior + diagnóstico + solución + evidencias + presupuesto correctivo (obligatorio) + preventivo (opcional con checkbox) → botón aprobar
- APROBADO/AGREGAR_SKU/PRIORIDAD: todo anterior + "Su equipo está siendo reparado"
- REPARADO/AVISADO: todo anterior + "Listo para recoger" + dirección sucursal
- ENTREGADO: resumen completo + fecha entrega + info garantía
- DEVOLUCION: motivo + estado pago revisión
