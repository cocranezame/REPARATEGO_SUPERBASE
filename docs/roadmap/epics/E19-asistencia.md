# Épica 19 — Asistencia y Planilla

> Referencia: C007 (2026-06-02)
> Estado: TODO
> Branch: epic/E19-asistencia
> 12 tickets

## Objetivo
Control de asistencia del personal con validación WiFi + GPS, cálculo automático de planilla mensual y portal PWA para el trabajador.

## Tickets

| ID | Descripción | Estado |
|---|---|---|
| E19.1 | DB: Migración 7 tablas + RLS | TODO |
| E19.2 | DB: Drizzle schemas + Zod validators + helper haversine | TODO |
| E19.3 | API: CRUD turno_trabajo + punto_control_wifi | TODO |
| E19.4 | API: CRUD trabajador_config | TODO |
| E19.5 | API: Endpoint marcado (WiFi+GPS+haversine) + mi-historial + registro manual | TODO |
| E19.6 | API: Planilla (calcular, calcular-todos, aprobar, pagar) | TODO |
| E19.7 | API: Permisos y justificaciones (CRUD + aprobar/rechazar + recalculo planilla) | TODO |
| E19.8 | Web Admin: Configuración turnos y puntos de control | TODO |
| E19.9 | Web Admin: Panel tiempo real (hoy) con polling 60s + registro manual | TODO |
| E19.10 | Web Admin: Planilla mensual (resumen + detalle día a día + aprobar/pagar) | TODO |
| E19.11 | PWA Trabajador: Portal marcado (login, geolocalización, WiFi fallback) + historial + planilla estimada | TODO |
| E19.12 | Reportes: Export Excel/PDF (asistencia + planilla) | TODO |

## Detalle de tickets

### E19.1 — DB: Migración 7 tablas + RLS
Crear migración SQL con las tablas: turno_trabajo, punto_control_wifi, trabajador_config, evento_asistencia, permiso_asistencia, planilla_mensual, planilla_detalle.
Ver schema completo en docs/db/modules/asistencia.md.
Aplicar RLS con patrón NULLIF en las 7 tablas.

### E19.2 — DB: Drizzle schemas + Zod validators
- packages/db/src/schema/asistencia.ts → pgTable para las 7 tablas
- packages/validators/src/asistencia.ts → schemas Zod para insert/select/marcado/planilla/permisos
- packages/shared/src/geo.ts → helper haversine para cálculo de distancia
- Exportar desde @kallpasoft/db y @kallpasoft/validators

### E19.3 — API: CRUD turno_trabajo + punto_control_wifi
Módulo DDD: apps/api/src/modules/asistencia/
Endpoints turno: GET/POST/GET:id/PUT/DELETE (soft delete)
Endpoints punto_control: GET/POST/GET:id/PUT/DELETE (soft delete)
Permiso: ADMINISTRADOR

### E19.4 — API: CRUD trabajador_config
Endpoints: GET (join usuario+turno)/POST/GET:id/PUT/DELETE
Regla: UNIQUE usuario_id (solo 1 config activa por trabajador)
Permiso: ADMINISTRADOR

### E19.5 — API: Endpoint marcado (WiFi+GPS)
POST /asistencia/marcar — auth JWT trabajador
Lógica: buscar punto_control → validar WiFi (SSID+BSSID) → validar GPS (haversine) → calcular tardanza → INSERT evento → emit EventBridge si inválido
GET /asistencia/mi-historial — historial del trabajador autenticado
POST /asistencia/registro-manual — admin registra marcado manual
GET /asistencia/hoy — panel tiempo real para admin

### E19.6 — API: Planilla (calcular, cerrar, aprobar)
POST calcular (usuario+periodo) → genera planilla_mensual + planilla_detalle desde eventos
POST calcular-todos (periodo) → batch todos los trabajadores
GET por periodo → lista resumen
GET detalle → planilla + líneas día a día
PUT aprobar → solo ADMINISTRADOR, solo si CALCULADO
PUT pagar → solo ADMINISTRADOR, solo si APROBADO, inmutable después

### E19.7 — API: Permisos y justificaciones
GET/POST/GET:id permisos
PUT aprobar → ADMINISTRADOR/ASISTENTE, recalcula planilla si afecta_pago=true
PUT rechazar
Cualquier rol puede solicitar

### E19.8 — Web Admin: Turnos y puntos de control
/asistencia/configuracion → 2 tabs
Tab turnos: CRUD con checkboxes días laborales
Tab puntos control: CRUD con campos WiFi + coordenadas + mapa visual

### E19.9 — Web Admin: Panel tiempo real
/asistencia/hoy
4 KPIs (presentes/tardanzas/faltas/permisos) + tabla trabajadores del día
Polling 60s, modal registro manual, badges color por estado

### E19.10 — Web Admin: Planilla mensual
/asistencia/planilla
Selector período + botón calcular todos + tabla resumen
Drill-down por trabajador → detalle día a día
Botones aprobar/pagar + exportar Excel/PDF

### E19.11 — PWA Trabajador: Portal marcado + historial
/portal/asistencia — auth DNI + contraseña (patrón C002)
Login → pantalla principal con botón MARCAR grande → flujo geolocalización + WiFi fallback
Historial mes actual + planilla estimada
Mobile-first

### E19.12 — Reportes: Export Excel/PDF
GET reportes/asistencia?formato=xlsx|pdf
GET reportes/planilla?formato=xlsx|pdf
Excel: fila por día por trabajador
PDF: resumen ejecutivo con totales y firma

## Dependencias

- Requiere completado: E1 (seguridad — usuarios, sucursales, roles)
- Requiere patrón: C002 (portal servicios — JWT público para portal trabajador)
- Requiere infraestructura: EventBridge (E0 — notificación marcado inválido)
- Nuevo helper: packages/shared/src/geo.ts (haversine)
- No depende de módulos de negocio (servicios, ventas, inventario, CRM)
