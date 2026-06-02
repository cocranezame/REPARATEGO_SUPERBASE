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

## Pantallas nuevas C004

### Dashboard Inventario (/inventario)
- Tarjetas de indicadores: total productos, total servicios, valor total inventario
- Tarjeta alertas: productos con stock bajo mínimo (lista con nombre, stock actual vs mínimo, badge rojo)
- Tarjeta cotizaciones pendientes (count + link a lista)
- Accesos rápidos a productos, stock, movimientos

### Clasificación de proveedores en cotización (actualización pantalla existente)
- En detalle de cotización, los proveedores se muestran clasificados:
  - SEGUROS: fondo verde claro, badge "Seguro", coinciden en categoría + componente
  - POSIBLES: fondo neutro, badge "Posible", coinciden solo en categoría
- Por cada proveedor: selector de contacto telefónico, botón "WhatsApp" (abre URL wa.me con mensaje predefinido), campo precio costo
- No hay botón "seleccionar ganador" — la decisión se toma al momento del ingreso

### Alertas stock mínimo (actualización pantalla stock)
- En pantalla de stock, agregar tab o sección "Alertas"
- Tabla: producto, código, stock actual, stock mínimo, diferencia
- Badge rojo si stock_actual < stock_minimo
- Filtro para mostrar solo productos en alerta

### Campo stock_minimo en producto (actualización formulario)
- En formulario de producto, agregar campo "Stock mínimo" (numérico, default 0)
- Tooltip: "Cantidad mínima antes de generar alerta de reabastecimiento"

### Tasa con jerarquía (actualización pantalla tasas)
- En pantalla Tasa%, agregar columna "Nivel" (POR_REPUESTO, POR_TIPO, POR_COMPONENTE)
- Permitir crear tasas a nivel de tipo (PRODUCTO/SERVICIO) y a nivel de componente
- Indicador visual de qué nivel aplica a cada producto
- Al editar tasa POR_REPUESTO: recálculo instantáneo del precio de venta
- Si producto no tiene tasa propia, mostrar la tasa heredada (POR_TIPO o POR_COMPONENTE) en gris con texto "heredada"

### Modal ingreso manual (actualización)
- Al ingresar cantidad, mostrar aviso si existe lote del mismo día y proveedor: "Se sumará al lote existente [SKU]"
- Si diferente proveedor mismo día: mostrar aviso "Se creará nuevo lote con correlativo"

### Modal merma/reajuste (actualización)
- Solo habilitado para ADMINISTRADOR y ALMACEN
- Si usuario no tiene permiso, botón deshabilitado con tooltip "Requiere rol Administrador o Almacén"
