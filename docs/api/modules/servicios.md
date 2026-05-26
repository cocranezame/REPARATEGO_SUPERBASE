# API — Servicios (Órdenes de Servicio)

> Endpoints de órdenes de servicio, componentes, cotización y evidencias.
> Épica: E10

## Órdenes de servicio

### GET /api/v1/ordenes-servicio
- Query: `?estado=&tecnico_id=&sucursal_id=&cliente_id=&desde=&hasta=&search=&page=1&pageSize=20`
- search busca en codigo, problema_reportado, serie_equipo

### POST /api/v1/ordenes-servicio
- Body: `{ cliente_id, sucursal_id, categoria_id, marca_id?, modelo_id?, serie_equipo?, color_equipo?, problema_reportado, tipo_servicio, prioridad?, notas_internas? }`
- Estado inicial: RECEPCION

### GET /api/v1/ordenes-servicio/:id
- Incluye componentes, cotización, evidencias

### PUT /api/v1/ordenes-servicio/:id
- Actualiza datos generales (diagnóstico, solución, técnico)

### PUT /api/v1/ordenes-servicio/:id/estado
- Body: `{ estado, notas? }`
- Valida transiciones permitidas
- Registra timestamp del cambio

## Componentes afectados

### GET /api/v1/ordenes-servicio/:id/componentes
### POST /api/v1/ordenes-servicio/:id/componentes
- Body: `{ items: [{ componente_id, es_preliminar, estado_componente, notas? }] }`

## Cotización al cliente

### GET /api/v1/ordenes-servicio/:id/cotizacion
### POST /api/v1/ordenes-servicio/:id/cotizacion
- Body: `{ items: [{ producto_id?, descripcion, cantidad, precio_unitario, tipo }] }`
- Precio congelado al momento de crear

### PUT /api/v1/ordenes-servicio/:id/cotizacion/aprobar
- Body: `{ aprobado: boolean }`
- Si aprobado → OS pasa a APROBADO

## Evidencias

### GET /api/v1/ordenes-servicio/:id/evidencias
### POST /api/v1/ordenes-servicio/:id/evidencias
- Body: multipart/form-data con archivo + `{ momento, descripcion? }`
- Sube a S3, guarda URL

### DELETE /api/v1/ordenes-servicio/:osId/evidencias/:id
