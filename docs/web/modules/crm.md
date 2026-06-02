# Módulo: CRM + Agente IA (Nico) — Pantallas Web

> Referencia: C005 (2026-06-02)
> Ruta base: /crm
> Sección dentro de apps/web, no app separada

## Vistas en el sidebar

### 1. Bandeja de conversaciones — Inbox (/crm/inbox)

Lista de conversaciones activas.

PANEL IZQUIERDO — Lista:
- Avatar (inicial del nombre o ícono genérico)
- Nombre o número del contacto
- Último mensaje (preview truncado)
- Timestamp del último mensaje
- Etapa actual como badge con color
- Indicador de mensajes sin leer (badge numérico)
- Indicador modo: ícono robot (NICO) o ícono persona (VENDEDOR)
- Ordenadas por ultimo_mensaje_at DESC

FILTROS LATERALES:
- Por etapa (dropdown)
- Por etiqueta (multi-select)
- Por vendedor asignado (dropdown)
- Por modo (NICO/VENDEDOR)
- Por estado (ACTIVA/CERRADA)

Click en conversación → abre chat en vivo en panel derecho

### 2. Chat en vivo (/crm/inbox/:id)

PANEL DERECHO (se abre junto a la lista):

ZONA DE MENSAJES:
- Burbujas estilo WhatsApp
- Entrantes (cliente): burbuja izquierda, color claro
- Salientes Nico: burbuja derecha, color azul con ícono robot
- Salientes vendedor: burbuja derecha, color verde con nombre del vendedor
- Sistema/Bot: burbuja central, gris, texto pequeño
- Cada burbuja: contenido, hora, estado (enviado/entregado/leído si disponible)
- Scroll infinito hacia arriba para historial

INPUT DE MENSAJE:
- Campo texto con placeholder "Escribe un mensaje..."
- Botón enviar
- Al enviar primer mensaje → modo cambia a VENDEDOR automáticamente, Nico se pausa
- Indicador si estamos fuera de ventana 24h: "Solo plantillas HSM disponibles" + botón selector de plantilla

PANEL LATERAL DERECHO (ficha rápida del lead):
- Nombre, celular, documento (si capturado)
- Etapa actual con badge color
- Etiquetas como chips
- Vendedor asignado
- UTM (source, campaign, medium) si tiene
- Datos capturados: equipo, falla, ubicación
- Cliente vinculado (link si existe)
- Servicios vinculados (links si existen)

ACCIONES (barra superior del chat):
- Botón "Derivar a vendedor" → modal seleccionar vendedor + motivo
- Botón "Devolver a Nico" → confirma y cambia modo a NICO
- Botón "Cambiar etapa" → dropdown con etapas destino permitidas
- Botón "Asignar vendedor" → dropdown vendedores (solo admin)
- Botón "Enviar plantilla" → modal selector de plantillas HSM aprobadas con variables
- Botón "Cerrar conversación" → confirma y cierra

### 3. Kanban de leads (/crm/leads)

Tablero con columnas por etapa del pipeline (15 columnas).

COLUMNA:
- Header: nombre etapa + conteo leads + color + ícono operador (robot=IA, persona=HUMANO, engranaje=BOT, auto=SISTEMA)
- Cards de lead ordenadas por última actividad

CARD DE LEAD:
- Nombre o número del contacto
- Última actividad (fecha/hora)
- Etiquetas como chips pequeños (max 3 visibles + "+N")
- Vendedor asignado (avatar pequeño)
- Indicador canal UTM si tiene (ícono meta/tiktok/google)
- Color de borde según tiempo sin actividad (verde=reciente, amarillo=24h+, rojo=48h+)

INTERACCIONES:
- Drag & drop para mover entre etapas (valida transiciones permitidas, si no permitida → tooltip error)
- Click en card → abre ficha de lead
- Filtros superiores: por etiqueta, vendedor, rango fecha, UTM source

### 4. Ficha de lead (/crm/leads/:id)

Vista detallada completa.

TAB 1 — INFORMACIÓN:
- Datos personales: nombre, celular, documento, ubicación
- UTM: source, campaign, medium
- Etapa actual (editable con dropdown de destinos permitidos)
- Vendedor asignado (editable por admin)
- Cliente vinculado (link al módulo clientes, o botón "Crear cliente" si no existe)
- Fecha de creación, última actividad

TAB 2 — CONVERSACIÓN:
- Historial completo de mensajes (mismo formato que chat en vivo pero solo lectura)
- Notas de Nico intercaladas (fondo amarillo claro, ícono nota)
- Notas del vendedor intercaladas (fondo azul claro)
- Input para agregar nota manual

TAB 3 — ETIQUETAS:
- Todas las etiquetas agrupadas por grupo (IDENTIFICACION, RUTA_ACTIVA, CAPTURA_DATOS, ESTADO_OPERATIVO)
- Toggle para agregar/quitar etiquetas
- Indicador de quién asignó cada etiqueta (NICO/VENDEDOR/SISTEMA)

TAB 4 — SERVICIOS:
- Lista de servicios vinculados al cliente (si fue convertido)
- Estado de cada servicio
- Link a detalle del servicio en módulo servicios

TAB 5 — TIMELINE:
- Historial de etapas transitadas con fecha, quién movió (Nico/vendedor/sistema) y duración en cada etapa
- Eventos relevantes: derivaciones, errores, creación cliente, creación servicio

### 5. Dashboard CRM (/crm/dashboard)

KPIs PRINCIPALES (tarjetas superiores):
- Leads activos (total)
- Tasa de conversión (convertidos / total %)
- Tiempo promedio de respuesta (minutos)
- Leads nuevos hoy

GRÁFICAS:
- Leads por etapa (bar chart horizontal, colores por etapa)
- Embudo de conversión (funnel chart: primer contacto → identificación → ... → convertido)
- Leads por canal UTM (pie chart: meta, tiktok, google, organic)
- Leads por período (line chart: últimos 30 días)

RENDIMIENTO DE NICO:
- Mensajes procesados (hoy / semana / mes)
- Tools usadas (bar chart por tool)
- Tasa de éxito de tools (%)
- Errores recientes (lista últimos 10)
- Tiempo promedio de respuesta (ms)

COMPARATIVO:
- Selector de período (hoy, 7d, 30d, custom)
- Comparar con período anterior

### 6. Configuración de agentes (/crm/config/agentes)

Solo accesible por ADMINISTRADOR.

LISTA DE AGENTES:
- Nombre, canal, modelo IA, estado (activo/inactivo toggle)

DETALLE DE AGENTE:
- Nombre (editable)
- Canal (WHATSAPP, solo lectura por ahora)
- Modelo IA (editable: claude-haiku, etc.)
- Tono (textarea editable — personalidad y estilo)
- Prompt base (textarea editable — instrucciones generales)
- Max mensajes contexto (number input — cuántos mensajes incluir en context builder)
- Toggle activo/inactivo

LOG DE ACCIONES:
- Tabla: fecha/hora, tool, input (JSON colapsable), output (JSON colapsable), exitoso (badge), duración (ms), error
- Filtros: rango fecha, tool_name, solo errores
- Paginación

### 7. Configuración de cuentas WhatsApp (/crm/config/wa-cuentas)

Solo accesible por ADMINISTRADOR.

LISTA:
- Nombre, phone_number_id, negocio, estado (activo/inactivo), fecha creación

FORMULARIO ALTA/EDICIÓN:
- Negocio nombre
- Phone number ID
- WABA ID
- Access token (campo password, se encripta al guardar)
- Webhook verify token
- Nombre descriptivo

### 8. Gestión de etapas del pipeline (/crm/config/etapas)

Solo accesible por ADMINISTRADOR.

LISTA ORDENABLE (drag & drop para reordenar):
- Nombre, código, operador (badge: IA/BOT/HUMANO/SISTEMA), objetivo (truncado), color, leads activos (conteo)

FORMULARIO CREAR/EDITAR:
- Nombre (editable)
- Código (editable al crear, solo lectura después)
- Orden (numérico, o drag & drop en lista)
- Objetivo (textarea — se inyecta en prompt de Nico)
- Operador (select: IA, BOT, HUMANO, SISTEMA)
- Bot vinculado (select de bots disponibles, solo visible si operador=BOT)
- Tiempo espera horas (number — para recordatorio)
- Max intentos recordatorio (number)
- Color (color picker)

GESTIÓN DE TRANSICIONES:
- Por cada etapa: lista de etapas destino permitidas
- Checkboxes para agregar/quitar destinos
- Visualización como mini-grafo o lista

### 9. Gestión de etiquetas (/crm/config/etiquetas)

Solo accesible por ADMINISTRADOR.

LISTA agrupada por grupo (4 secciones):
- IDENTIFICACION, RUTA_ACTIVA, CAPTURA_DATOS, ESTADO_OPERATIVO
- Cada etiqueta: nombre, código, descripción, activo toggle

FORMULARIO CREAR/EDITAR:
- Nombre, código, grupo (select), descripción

### 10. Gestión de plantillas (/crm/config/plantillas)

Solo accesible por ADMINISTRADOR.

LISTA:
- Nombre, estado Meta (badge: PENDIENTE/APROBADA/RECHAZADA), variables, fecha creación

FORMULARIO CREAR/EDITAR:
- Nombre
- Contenido (textarea con preview de variables)
- Variables (tags input: nombre, equipo, etc.)
- Nombre template Meta (para HSM)

### 11. Gestión de bots (/crm/config/bots)

Solo accesible por ADMINISTRADOR.

LISTA:
- Nombre, código, tipo (badge), activo toggle

DETALLE/EDICIÓN:
- Nombre (editable)
- Tipo (COTIZACION_REPUESTO / SERVICIO_PROCESO / RECORDATORIO)
- Config JSONB (editor JSON o formulario visual de pasos según tipo):
  - COTIZACION_REPUESTO: pasos (seleccionar categoría → componente → buscar precio → mostrar resultado)
  - SERVICIO_PROCESO: pasos (pedir documento → buscar servicios → mostrar estado)
  - RECORDATORIO: config (mensaje, intervalo_horas, max_intentos)
- Toggle activo/inactivo

### 12. Mensajería interna (/crm/mensajeria)

PANEL IZQUIERDO — Contactos/conversaciones:
- Lista de empleados con último mensaje
- Indicador mensajes sin leer
- Buscador de empleados

PANEL DERECHO — Chat:
- Burbujas de mensaje (enviado/recibido)
- Input de texto
- Timestamp por mensaje
- Indicador leído/no leído

## Comportamientos especiales

### Notificaciones en tiempo real
- Nuevo mensaje entrante → badge en sidebar "CRM" + badge en conversación específica
- Derivación a vendedor → notificación toast + badge
- Lead sin respuesta 24h+ → indicador en kanban (borde amarillo)
- Lead sin respuesta 48h+ → indicador en kanban (borde rojo)

### Acceso desde otros módulos
- Desde módulo servicios: si orden tiene lead_id, link "Ver lead en CRM" → /crm/leads/:id
- Desde módulo clientes: si cliente fue creado desde CRM, link "Ver lead origen" → /crm/leads/:id

### Responsive
- Inbox: en mobile lista ocupa 100% pantalla, click abre chat fullscreen con botón back
- Kanban: scroll horizontal en mobile
- Dashboard: cards stack en mobile
