# Web — CRM + Agente IA (Nico)

> Pantallas del CRM, conversaciones, y configuración del agente.
> Épica: E13

## Pantallas

### Pipeline de leads (`/crm/pipeline`)
- Kanban: columnas = etapas del pipeline
- Tarjetas: nombre, teléfono, valor estimado, etiquetas (badges de color)
- Drag & drop entre etapas (valida transiciones)
- Quick filters: asignado a, origen, etiquetas

### Detalle de lead (`/crm/leads/:id`)
- Datos del lead (editable)
- Etiquetas (multiselect)
- Timeline de actividad
- Conversaciones asociadas
- Link a cliente si ya existe

### Bandeja de conversaciones (`/crm/conversaciones`)
- Layout 3 columnas: lista de conversaciones | chat | info del lead
- Lista: filtro por estado, asignado, canal
- Chat: mensajes con burbujas (entrante/saliente), indicador de quién envió (usuario/bot/agente)
- Composer: texto + adjuntos + enviar plantilla
- Info: datos del lead, etiquetas, historial

### Configuración (`/crm/configuracion`)
- **Tab Cuentas WA:** gestión de cuentas conectadas
- **Tab Pipeline:** CRUD de etapas + transiciones (drag reorder)
- **Tab Etiquetas:** CRUD con color picker
- **Tab Plantillas:** CRUD plantillas WA
- **Tab Bots:** CRUD bots con trigger y respuesta
- **Tab Agente Nico:** nombre, personalidad (textarea), tools habilitados (checkboxes), modelo LLM, on/off

### Dashboard CRM (`/crm/dashboard`)
- Métricas: leads por etapa, conversiones, tiempo promedio, leads por origen
- Gráficos: funnel, tendencia, distribución
- Actividad del agente: events, escalaciones, errores

### Mensajería interna (`/crm/mensajes`)
- Bandeja tipo email: no leídos, todos
- Enviar mensaje a usuario con referencia opcional (OS, lead, venta)
