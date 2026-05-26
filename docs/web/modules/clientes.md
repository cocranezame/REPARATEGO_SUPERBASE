# Web — Clientes

> Pantallas de gestión de clientes.
> Épica: E3

## Pantallas

### Listado de clientes (`/clientes`)
- Tabla con: documento, nombre/razón social, teléfono, email, estado
- Búsqueda por documento, nombre, teléfono
- Filtros: tipo_documento, tipo_persona, activo
- Botón crear nuevo

### Detalle de cliente (`/clientes/:id`)
- Datos generales (editable)
- **Tab Direcciones:** lista de direcciones con mapa (si tiene lat/lng), CRUD inline
- **Tab Historial:** órdenes de servicio, ventas, visitas del cliente (read-only, links)

### Crear/Editar cliente
- Formulario con campos condicionales según tipo_persona
- Si NATURAL: nombres, apellidos
- Si JURIDICA: razón social
