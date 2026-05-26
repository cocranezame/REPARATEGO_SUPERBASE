# Web — Domicilios

> Pantallas de visitas a domicilio.
> Épica: E12

## Pantallas

### Kanban de visitas (`/domicilios`)
- Columnas: POR_VALIDAR | VALIDADA | ASIGNADA | EN_CAMINO | EN_SITIO | TERMINADA
- Tarjetas: cliente, dirección, técnico, hora, tarifa
- Drag & drop para cambiar estado (con validaciones)

### Agendar visita (`/domicilios/nueva`)
- Formulario: cliente, dirección (del cliente o nueva), distrito, fecha, hora
- Tarifa se calcula automáticamente al seleccionar distrito
- Selección de técnico con vista de disponibilidad

### Calendario de técnicos (`/domicilios/calendario`)
- Vista semanal/diaria
- Filas: técnicos, columnas: horas
- Bloques de visitas programadas
- Click en slot vacío → agendar visita

### Tarifas por distrito (`/domicilios/tarifas`)
- Tabla simple: distrito, provincia, tarifa
- CRUD inline
