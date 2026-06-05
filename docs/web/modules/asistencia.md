# Módulo: Asistencia y Planilla — Pantallas Web

> Referencia: C007 (2026-06-02)
> Ruta base: /asistencia (admin) y /portal/asistencia (trabajador)

## Vistas admin en el sidebar

### 1. Configuración (/asistencia/configuracion)

2 tabs:

TAB TURNOS:
- Tabla: nombre, hora inicio, hora fin, tolerancia (min), días laborales (chips LUN-DOM), estado (toggle)
- Botón "Nuevo turno" → modal:
  - Nombre (input)
  - Hora inicio (time picker)
  - Hora fin (time picker)
  - Tolerancia minutos (number input, default 15)
  - Días laborales (checkboxes LUN-DOM, preseleccionar LUN-SAB)
  - Botones: Cancelar / Guardar
- Click en fila → editar en mismo modal
- Eliminar → soft delete con confirmación
- Permiso: ADMINISTRADOR

TAB PUNTOS DE CONTROL:
- Tabla: nombre, sucursal, SSID, BSSID, coordenadas, radio (metros), estado (toggle)
- Botón "Nuevo punto" → modal:
  - Sucursal (select de sucursales activas)
  - Nombre (input)
  - SSID (input — nombre de la red WiFi)
  - BSSID (input — MAC del router, formato XX:XX:XX:XX:XX:XX)
  - Latitud (number input con 8 decimales)
  - Longitud (number input con 8 decimales)
  - Radio metros (number input, default 50)
  - Mapa visual (mostrar punto + círculo de radio si es posible, usando leaflet o Google Maps embed)
  - Botones: Cancelar / Guardar
- Permiso: ADMINISTRADOR

### 2. Trabajadores (/asistencia/trabajadores)

Tabla: nombre (del usuario), rol, turno asignado, sucursal, tipo contrato (badge), sueldo base, modalidad pago, estado (toggle)

Botón "Configurar trabajador" → modal:
- Usuario (select de usuarios activos que no tienen config)
- Turno (select de turnos activos)
- Sucursal (select)
- Tipo contrato (select: PLANILLA / HONORARIOS / PRACTICANTE)
- Sueldo base (number input, S/)
- Modalidad pago (select: MENSUAL / QUINCENAL / SEMANAL)
- Fecha ingreso (date picker)
- Factor hora extra (number input, default 1.25)
- Descuento por tardanza (select: POR_MINUTO / POR_RANGO / SIN_DESCUENTO)
- Monto descuento por minuto (number input, visible solo si POR_MINUTO)
- Botones: Cancelar / Guardar

Click en fila → editar en mismo modal
Permiso: ADMINISTRADOR

### 3. Panel tiempo real (/asistencia/hoy)

CABECERA:
- Fecha actual (grande)
- 4 tarjetas KPI: Presentes (verde), Tardanzas (amarillo), Faltas (rojo), Con permiso (azul)

TABLA PRINCIPAL:
- Columnas: nombre, turno, hora entrada programada, hora entrada real, hora salida real, estado, minutos tardanza, observación
- Estado con color: PRESENTE (badge verde), TARDANZA (badge amarillo), FALTA (badge rojo), PERMISO (badge azul), DESCANSO (badge gris)
- Si hora_entrada_real es null y ya pasó hora_inicio + tolerancia → marcar como FALTA automáticamente en UI
- Polling cada 60 segundos (o useQuery con refetchInterval: 60000)

ACCIONES:
- Botón "Registrar manual" → modal:
  - Trabajador (select)
  - Tipo evento (select: ENTRADA / SALIDA / BREAK_INICIO / BREAK_FIN)
  - Fecha hora (datetime picker, default ahora)
  - Observación (textarea)
  - Botones: Cancelar / Registrar
  - Al confirmar → POST /asistencia/registro-manual

Filtros: turno (select), sucursal (select)
Permiso: ADMINISTRADOR

### 4. Planilla mensual (/asistencia/planilla)

CABECERA:
- Selector de período: mes (select) + año (select)
- Botón "Calcular todos" → POST /asistencia/planilla/calcular-todos → muestra progreso y resultado

TABLA RESUMEN:
- Columnas: trabajador, días laborables, días asistidos, días falta, tardanzas (min), horas extra, sueldo base, descuentos, bonificaciones, bruto, neto, estado (badge)
- Estado con color: BORRADOR (gris), CALCULADO (azul), APROBADO (verde), PAGADO (morado)
- Click en fila → abre detalle

DETALLE DE PLANILLA (modal o panel expandible):
- Cabecera: nombre trabajador, período, turno, tipo contrato, sueldo base
- Tabla día a día (planilla_detalle):
  - Columnas: fecha, día semana, estado_dia (badge color), hora entrada prog, hora entrada real, hora salida prog, hora salida real, minutos tardanza, minutos extra, descuento día, observación
- Resumen inferior: totales de tardanza, extras, descuentos, bonificaciones, bruto, neto
- Botones:
  - "Aprobar" → PUT aprobar (solo si CALCULADO, solo ADMINISTRADOR)
  - "Marcar como pagado" → PUT pagar con fecha_pago (solo si APROBADO, solo ADMINISTRADOR)
  - "Recalcular" → POST calcular (solo si no PAGADO)
  - "Exportar" → descargar Excel o PDF

EXPORTAR:
- Botón "Exportar Excel" → GET /asistencia/reportes/planilla?formato=xlsx
- Botón "Exportar PDF" → GET /asistencia/reportes/planilla?formato=pdf

Permiso: ADMINISTRADOR

### 5. Permisos y justificaciones (/asistencia/permisos)

TABLA:
- Columnas: trabajador, tipo permiso (badge), fecha inicio, fecha fin, motivo (truncado), afecta pago (ícono), estado (badge), aprobado por
- Estado con color: PENDIENTE (amarillo), APROBADO (verde), RECHAZADO (rojo)

Filtros: trabajador (select), tipo permiso (select), estado (select), rango fecha

Botón "Nuevo permiso" → modal:
- Trabajador (select de trabajadores activos)
- Tipo permiso (select: MEDICO / PERSONAL / VACACIONES / CAPACITACION / LICENCIA / OTRO)
- Fecha inicio (date picker)
- Fecha fin (date picker)
- Motivo (textarea)
- Archivo adjunto (file upload → S3)
- Afecta pago (checkbox)
- Botones: Cancelar / Solicitar

Click en fila → modal detalle:
- Toda la info + archivo adjunto descargable
- Si estado=PENDIENTE: botones "Aprobar" / "Rechazar"
- Si aprobado: info de quién aprobó y cuándo

Permiso: ADMINISTRADOR, ASISTENTE para aprobar/rechazar. Cualquier rol para solicitar.

## Portal trabajador (PWA)

### Layout portal asistencia

URL: /portal/asistencia
Auth separada: DNI + contraseña → JWT temporal (mismo patrón portal servicios C002)
Layout limpio: logo ReparaTego + nombre trabajador + botón cerrar sesión
Mobile-first, diseñado para celular del trabajador

### Login (/portal/asistencia/login)

- Campo DNI (input numérico)
- Campo contraseña (input password)
- Botón "Ingresar"
- Logo ReparaTego arriba

### Pantalla principal (/portal/asistencia)

ESTADO ACTUAL:
- Turno del día: nombre turno, hora entrada programada, hora salida programada
- Último evento: "Entrada registrada a las HH:MM" o "No has marcado entrada hoy"
- Indicador visual grande según estado:
  - Verde + check: entrada registrada
  - Amarillo + reloj: tardanza registrada (X minutos)
  - Rojo + X: fuera de zona / WiFi no autorizado
  - Gris: sin marcar

BOTÓN PRINCIPAL (grande, centrado):
- Si no ha marcado entrada hoy → "MARCAR ENTRADA" (botón verde grande)
- Si ya marcó entrada pero no salida → "MARCAR SALIDA" (botón azul grande)
- Si ya marcó ambos → "Asistencia completa hoy" (texto, sin botón)

FLUJO AL PRESIONAR BOTÓN:
1. Solicitar geolocalización del navegador (navigator.geolocation.getCurrentPosition)
2. Si navegador soporta → obtener lat/lng automáticamente
3. Si no soporta o deniega permiso → mostrar error "Activa la ubicación para marcar asistencia"
4. Obtener SSID: intentar navigator.connection o NetworkInformation API
5. Si API no disponible (común en móviles) → mostrar campo manual "Ingresa el nombre de tu red WiFi" con botón "No estoy en WiFi"
6. BSSID: no disponible desde navegador por seguridad. Enviar null. La validación crítica es GPS.
7. POST /asistencia/marcar con { ssid, bssid (null si no disponible), latitud, longitud, tipo_evento }
8. Mostrar resultado:
  - ✓ verde: "Entrada registrada correctamente a las HH:MM"
  - ✓ amarillo: "Entrada registrada con tardanza de X minutos"
  - ✗ rojo: "Fuera de zona permitida. Se notificó al administrador."

### Historial (/portal/asistencia/historial)

- Selector mes (default mes actual)
- Tabla: fecha, día semana, hora entrada, hora salida, estado (badge color), tardanza (minutos)
- Resumen inferior: días asistidos, tardanzas, faltas, horas extra del mes
- Solo lectura

### Mi planilla (/portal/asistencia/planilla)

- Selector período (default mes actual)
- Si existe planilla calculada en BD → mostrar datos reales
- Si no existe → calcular estimado desde eventos:
  - Días asistidos hasta hoy
  - Minutos tardanza acumulados
  - Horas extra acumuladas
  - Descuento estimado
  - Neto estimado
- Indicador "Estimado" o "Calculado" según fuente
- Solo lectura

## Comportamientos especiales

### Notificaciones
- Marcado inválido (fuera de zona o WiFi no autorizado) → notificación al admin vía EventBridge
- En panel tiempo real: fila se resalta en rojo si marcado inválido

### Responsive
- Panel tiempo real: tabla scroll horizontal en mobile
- Planilla detalle: tabla scroll horizontal en mobile
- Portal trabajador: 100% mobile-first, botones grandes, texto legible

### Nota sobre WiFi
- navigator.connection NO expone SSID en la mayoría de navegadores móviles por seguridad
- BSSID nunca disponible desde navegador
- Implementar fallback: campo manual para SSID + opción "No estoy en WiFi"
- La validación CRÍTICA es GPS (haversine). WiFi es capa de seguridad adicional cuando está disponible.
