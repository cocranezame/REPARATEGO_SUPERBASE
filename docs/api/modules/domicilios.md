# API — Domicilios

> Endpoints de visitas a domicilio y tarifas.
> Épica: E12

## Tarifas por distrito

### GET /api/v1/tarifas-distrito
- Query: `?search=&activo=true`

### POST /api/v1/tarifas-distrito
- Body: `{ distrito, provincia?, tarifa }`

### PUT /api/v1/tarifas-distrito/:id
### DELETE /api/v1/tarifas-distrito/:id

## Visitas a domicilio

### GET /api/v1/visitas-domicilio
- Query: `?estado=&tecnico_id=&desde=&hasta=&page=1&pageSize=20`

### POST /api/v1/visitas-domicilio
- Body: `{ cliente_id, direccion_id?, direccion_texto, distrito, tecnico_id?, fecha_programada, hora_inicio?, hora_fin?, motivo_visita?, notas? }`
- Tarifa se calcula automáticamente por distrito
- Estado inicial: POR_VALIDAR

### GET /api/v1/visitas-domicilio/:id

### PUT /api/v1/visitas-domicilio/:id/estado
- Body: `{ estado, diagnostico_campo?, motivo_cancelacion? }`
- Si TERMINADA + genera OS → crear orden_servicio vinculada
- Si CANCELADA + con cobro → crear venta tipo REVISION_DOMICILIO

### POST /api/v1/visitas-domicilio/:id/generar-os
- Body: `{ problema_reportado, tipo_servicio, prioridad? }`
- Crea orden_servicio con visita_domicilio_id

## Disponibilidad de técnicos

### GET /api/v1/tecnicos/disponibilidad
- Query: `?fecha=&tecnico_id=`
- Response: lista de técnicos con sus visitas del día (horarios ocupados)
