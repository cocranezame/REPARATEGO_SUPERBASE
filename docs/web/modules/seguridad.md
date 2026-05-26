# Web — Seguridad

> Pantallas de login, layout principal, usuarios, sucursales y feature flags.
> Épica: E1

## Pantallas

### Login (`/login`)
- Campos: tipo_documento (select), numero_documento, password
- Redirige a dashboard tras login exitoso
- Sin sidebar, pantalla completa centrada

### Layout principal
- **Sidebar:** logo, navegación por módulos (iconos + texto), usuario actual, logout
- **Header:** breadcrumbs, nombre de sucursal actual, notificaciones
- **Guard de rutas:** redirige a /login si no hay sesión
- **Permisos:** oculta opciones de menú según rol

### CRUD Usuarios (`/admin/usuarios`)
- Tabla con: nombre, documento, rol, sucursal, estado, último login
- Filtros: búsqueda, rol, estado
- Modal/drawer para crear/editar
- Solo visible para ADMIN

### CRUD Sucursales (`/admin/sucursales`)
- Tabla con: nombre, dirección, distrito, teléfono, principal
- Modal para crear/editar
- Solo visible para ADMIN

### Feature Flags (`/admin/feature-flags`)
- Lista de flags con toggle on/off
- Solo visible para ADMIN
