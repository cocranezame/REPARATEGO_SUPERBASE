# Web — Proveedores

> Pantallas de gestión de proveedores.
> Épica: E5

## Pantallas

### Listado de proveedores (`/proveedores`)
- Tabla con: RUC, razón social, nombre comercial, teléfono, calificación (estrellas)
- Búsqueda por RUC, razón social
- Filtro: activo

### Detalle de proveedor (`/proveedores/:id`)
- Datos generales (editable)
- **Tab Contactos:** tabla de contactos con CRUD inline
- **Tab Métodos de pago:** tabla con tipo, banco, cuenta, CCI
- **Tab Líneas:** categorías/componentes que vende
- **Tab Historial:** órdenes de compra y cotizaciones (read-only)
