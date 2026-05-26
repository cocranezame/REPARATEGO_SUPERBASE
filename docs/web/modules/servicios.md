# Web — Servicios (Órdenes de Servicio)

> Pantallas de gestión de reparaciones.
> Épica: E10

## Pantallas

### Listado de OS (`/servicios`)
- Tabla con: código, cliente, equipo, técnico, estado, fecha recepción, prioridad
- Filtros: estado, técnico, sucursal, rango de fechas, búsqueda
- Badges de color por estado

### Formulario de recepción (`/servicios/nuevo`)
- Paso 1: Seleccionar/crear cliente
- Paso 2: Datos del equipo (categoría, marca, modelo, serie, color)
- Paso 3: Problema reportado + componentes preliminares (checklist)
- Paso 4: Fotos obligatorias del equipo (upload)
- Paso 5: Confirmar → crea OS en estado RECEPCION

### Detalle de OS (`/servicios/:id`)
- Header: código, estado actual, timeline de estados
- **Tab Info:** datos generales, equipo, diagnóstico, solución
- **Tab Componentes:** tabla de componentes (preliminar + final), editable
- **Tab Cotización:** items de cotización con precio congelado, botón aprobar/rechazar
- **Tab Evidencias:** galería de fotos/videos por momento (RECEPCION, DIAGNOSTICO, etc.)
- **Acciones:** cambiar estado (botones contextuales según estado actual), asignar técnico

### Cotización al cliente
- Formulario para agregar items (repuestos + mano de obra)
- Preview para enviar al cliente (WhatsApp o imprimir)
- Totales: subtotal, IGV, total
