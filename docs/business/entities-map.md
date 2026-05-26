# Entities Map — ReparaTego

> Mapa de entidades del negocio y sus relaciones.
> Basado en el documento de integración técnica definido en planificación.

## Entidades principales

### Tenant (Multi-empresa)
- Un tenant = una empresa/negocio
- Todas las tablas se filtran por tenant_id (RLS)

### Seguridad
- **Usuario** → pertenece a un tenant, tiene rol (ADMIN, TECNICO, VENDEDOR, CAJERO)
- **Sucursal** → pertenece a un tenant, tiene dirección y datos de contacto

### Catálogos
- **Categoría** → tipo de dispositivo (celular, laptop, TV, electrodoméstico)
- **Componente** → pieza/repuesto (pantalla, batería, placa, etc.)
- **Marca** → marca del dispositivo (Samsung, Apple, LG, etc.)
- **Modelo** → modelo específico, pertenece a una marca

### Clientes
- **Cliente** → persona natural o jurídica, con tipo_doc (DNI/RUC/CE)
- **ClienteDirección** → dirección del cliente (puede tener varias)

### Inventario
- **Producto** → repuesto o producto para venta, tiene categoría + marca
- **Stock** → cantidad por producto por sucursal
- **MovimientoStock** → registro de entradas/salidas de stock

### Proveedores
- **Proveedor** → empresa o persona que vende repuestos
- **ProveedorContacto** → contacto del proveedor

### Compras
- **CotizaciónCompra** → solicitud de precio a proveedor
- **OrdenCompra** → compra confirmada, puede venir de una cotización

### Servicios
- **OrdenServicio** → reparación de un equipo de un cliente
- **Diagnóstico** → resultado de la evaluación técnica
- **Evidencia** → fotos/videos del equipo (antes/durante/después)

### Ventas
- **CotizaciónVenta** → presupuesto para un cliente
- **Venta** → venta de productos o servicios

### Domicilios
- **Domicilio** → servicio técnico a domicilio
- **DomicilioSeguimiento** → tracking del técnico

### Pagos
- **PagoProveedor** → pago a proveedor por compras

### CRM
- **InteracciónCliente** → registro de contactos con clientes
- **Seguimiento** → follow-up de interacciones

## Flujos principales

1. **Reparación:** Cliente → OrdenServicio → Diagnóstico → (Compra repuestos si necesario) → Reparación → Entrega → Cobro
2. **Venta directa:** Cliente → CotizaciónVenta → Venta → Entrega
3. **Compra repuestos:** CotizaciónCompra → OrdenCompra → Recepción stock → PagoProveedor
4. **Servicio a domicilio:** Cliente → Domicilio → Diagnóstico → OrdenServicio → Seguimiento
