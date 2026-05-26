# Mapa de Entidades — ReparaTego

> Relaciones entre entidades principales y flujos de negocio.

## Diagrama de relaciones clave

```
TENANT (aísla todo)
├── USUARIO (roles: ADMIN, TECNICO, VENDEDOR, CAJERO)
├── SUCURSAL (locales físicos)
│
├── CATÁLOGOS
│   ├── CATEGORIA (jerárquica) ← COMPONENTE
│   └── MARCA ← MODELO (+ categoria)
│
├── CLIENTE ← DIRECCION (con lat/lng)
│
├── PRODUCTO (PRD/SRV)
│   ├── ← COMPATIBILIDAD → MODELO
│   ├── ← LOTE (stock por lote)
│   └── ← MOVIMIENTO (stock por SUM)
│
├── PROVEEDOR
│   ├── ← CONTACTO
│   ├── ← METODO_PAGO (cuentas bancarias)
│   └── ← LINEA (categorías/componentes que vende)
│
├── FLUJO DE COMPRA
│   ├── COTIZACION_COMPRA ← DETALLE → PRODUCTO
│   ├── SOLICITUD_COMPRA → PRODUCTO (pedido interno)
│   ├── ORDEN_COMPRA → PROVEEDOR, agrupa SOLICITUDES
│   │   ├── ← CONFIRMACION (qué llegó realmente)
│   │   ├── → LOTE (al confirmar, genera ingreso)
│   │   └── ← PAGO_PROVEEDOR
│   └── Flujo: Solicitud → OC → Confirmar → Lote+Movimiento → Pagar
│
├── FLUJO DE SERVICIO
│   ├── ORDEN_SERVICIO → CLIENTE, TECNICO, EQUIPO
│   │   ├── ← COMPONENTE_OS (preliminar + final)
│   │   ├── ← COTIZACION_OS (precio congelado)
│   │   ├── ← EVIDENCIA (fotos S3)
│   │   └── → VENTA (tipo SERVICIO)
│   └── Flujo: Recepción → Diagnóstico → Cotización → Aprobación → Reparación → Entrega
│
├── FLUJO DE VENTA
│   ├── CAJA → USUARIO (sesión de caja)
│   ├── VENTA → CAJA, CLIENTE?
│   │   ├── ← ITEM → PRODUCTO
│   │   ├── ← PAGO → METODO_PAGO
│   │   ├── ← ENVIO → DIRECCION?
│   │   └── → MOVIMIENTO (tipo VENTA, resta stock)
│   └── COTIZACION_VENTA ← ITEM (presupuesto)
│
├── FLUJO DE DOMICILIO
│   ├── TARIFA_DISTRITO (precio por zona)
│   ├── VISITA → CLIENTE, TECNICO, DIRECCION
│   │   ├── → ORDEN_SERVICIO (si necesita reparación)
│   │   └── → VENTA (tipo REVISION_DOMICILIO, si cancela)
│   └── Flujo: Agendar → Validar → Asignar → Visitar → Resultado
│
└── CRM
    ├── WA_CUENTA (WhatsApp Business, token cifrado)
    ├── PIPELINE: ETAPA ← TRANSICION
    ├── LEAD → ETAPA, CLIENTE?, ETIQUETAS
    ├── CONVERSACION → LEAD, WA_CUENTA
    │   └── ← MENSAJE (entrante/saliente, multi-tipo)
    ├── PLANTILLA_WA (templates Meta)
    ├── BOT (respuestas automáticas)
    ├── AGENTE_CONFIG (Nico, con tools)
    │   └── ← AGENTE_EVENTO (log de acciones)
    └── MENSAJE_INTERNO (entre usuarios)
```

## Flujos transversales

1. **Stock bajo → Solicitud → OC → Ingreso:** alerta de stock mínimo → usuario crea solicitud → se agrupa en OC → proveedor entrega → se confirman items → se crean lotes+movimientos
2. **WhatsApp → Lead → OS → Venta:** cliente escribe por WA → Nico lo atiende → se crea lead → se agenda servicio → se crea OS → se repara → se cobra
3. **Domicilio → OS → Venta:** cliente pide visita → técnico va → diagnostica → se crea OS → se repara en taller → se cobra servicio + envío
4. **OS → Cotización → Aprobación → Reparación → Venta:** el flujo completo de reparación con aprobación del cliente
