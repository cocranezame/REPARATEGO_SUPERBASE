# Glosario — ReparaTego

> Términos y acrónimos del dominio de negocio.

| Término | Definición |
|---------|-----------|
| **Tenant** | Empresa/negocio que usa el sistema. Todos los datos se aíslan por tenant. |
| **Sucursal** | Local físico del tenant. Un tenant puede tener varias sucursales. |
| **OS** | Orden de Servicio. Documento que registra una reparación desde recepción hasta entrega. |
| **OC** | Orden de Compra. Documento de compra a un proveedor. |
| **Cotización de compra** | Solicitud de precios a un proveedor (el tenant pide). |
| **Cotización de venta** | Presupuesto referencial para un cliente (el tenant ofrece). |
| **Cotización de servicio** | Presupuesto de reparación dentro de una OS (repuestos + mano de obra). |
| **Solicitud de compra** | Pedido interno para comprar un producto. Puede nacer de alerta de stock. |
| **Lote** | Grupo de unidades de un producto que ingresaron juntas (misma OC, mismo precio). |
| **SKU** | Stock Keeping Unit. Identificador único de un lote. |
| **Movimiento** | Registro de entrada/salida de stock. Inmutable. |
| **Componente** | Pieza/repuesto genérico de un equipo (pantalla, batería, placa madre). |
| **Modelo** | Modelo específico de un equipo (Galaxy S24, iPhone 15). |
| **Compatibilidad** | Relación entre un producto y los modelos de equipo con los que es compatible. |
| **Tasa de precio** | Porcentaje de margen de ganancia para calcular precio de venta. |
| **Caja** | Sesión de caja de un cajero. Se abre al iniciar y se cierra al finalizar el turno. |
| **Venta libre** | Venta de productos sin estar asociada a una OS. |
| **Visita domiciliaria** | Servicio a domicilio donde un técnico va al lugar del cliente. |
| **Lead** | Prospecto/oportunidad de negocio en el CRM. |
| **Pipeline** | Embudo de ventas con etapas configurables. |
| **Nico** | Agente de IA que atiende conversaciones de WhatsApp con tools. |
| **Tool (agente)** | Función que el agente IA puede invocar (consultar stock, agendar visita, etc.). |
| **Bot** | Respuesta automática por trigger (keyword, horario, primera vez). |
| **RLS** | Row Level Security. Política de Postgres que filtra datos por tenant automáticamente. |
| **IGV** | Impuesto General a las Ventas (18% en Perú). |
| **SUNAT** | Superintendencia Nacional de Aduanas y de Administración Tributaria. |
| **OSE** | Operador de Servicios Electrónicos (para facturación electrónica). |
| **PSE** | Proveedor de Servicios Electrónicos. |
| **DNI** | Documento Nacional de Identidad (8 dígitos, persona natural). |
| **RUC** | Registro Único de Contribuyente (11 dígitos, empresa o independiente). |
| **CE** | Carné de Extranjería. |
