# Web — Inventario

> Pantallas de productos, stock, lotes y movimientos.
> Épicas: E4, E8

## Pantallas

### Productos (`/inventario/productos`)
- Tabla con: código, nombre, tipo, categoría, precio venta, stock actual, estado
- Filtros: tipo (PRODUCTO/SERVICIO), categoría, componente, búsqueda
- Indicador visual si stock < stock_minimo (rojo)

### Formulario de producto (`/inventario/productos/nuevo`, `/inventario/productos/:id`)
- Campos según tipo (PRODUCTO vs SERVICIO)
- Selector de categoría → componente (cascada)
- Selector de marca
- **Sección compatibilidades:** multiselect de modelos (agrupados por marca)
- Upload de imagen

### Tasas de precio (`/inventario/tasas-precio`)
- Tabla simple: nombre, porcentaje
- CRUD inline

### Métodos de pago (`/inventario/metodos-pago`)
- Tabla simple: nombre, activo
- CRUD inline

### Lotes (`/inventario/lotes`)
- Tabla con: SKU, producto, sucursal, cantidad actual, precio unitario, fecha ingreso
- Filtros: producto, sucursal
- Link a la OC de origen

### Movimientos (`/inventario/movimientos`)
- Tabla con: fecha, producto, tipo, cantidad, referencia, usuario
- Filtros: tipo, producto, sucursal, rango de fechas
- Tipos con badge de color (INGRESO=verde, VENTA=azul, MERMA=rojo, etc.)

### Alertas stock mínimo
- Panel/sidebar en dashboard con productos bajo stock mínimo
- También visible como badge en sidebar de navegación
