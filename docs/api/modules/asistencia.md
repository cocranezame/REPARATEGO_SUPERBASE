# Módulo: Asistencia y Planilla — API Endpoints

> Referencia: C007 (2026-06-02)
> Base path: /asistencia (admin) y /portal/asistencia (trabajador)

## Turnos de trabajo

GET /asistencia/turnos
  → retorna: { turnos con nombre, hora_inicio, hora_fin, tolerancia, dias_laborales }
  → permiso: [ADMINISTRADOR]

POST /asistencia/turnos
  → recibe: { nombre, hora_inicio, hora_fin, tolerancia_minutos, dias_laborales[] }
  → retorna: { turno creado }
  → permiso: [ADMINISTRADOR]

GET /asistencia/turnos/:id
  → retorna: { turno completo }
  → permiso: [ADMINISTRADOR]

PUT /asistencia/turnos/:id
  → recibe: { campos a actualizar }
  → retorna: { turno actualizado }
  → permiso: [ADMINISTRADOR]

DELETE /asistencia/turnos/:id
  → retorna: { soft delete activo=false }
  → permiso: [ADMINISTRADOR]

## Puntos de control WiFi

GET /asistencia/puntos-control
  → retorna: { puntos con sucursal, ssid, bssid, coordenadas, radio }
  → permiso: [ADMINISTRADOR]

POST /asistencia/puntos-control
  → recibe: { sucursal_id, nombre, ssid, bssid, latitud, longitud, radio_metros }
  → retorna: { punto creado }
  → permiso: [ADMINISTRADOR]

GET /asistencia/puntos-control/:id
  → retorna: { punto completo }
  → permiso: [ADMINISTRADOR]

PUT /asistencia/puntos-control/:id
  → recibe: { campos a actualizar }
  → retorna: { punto actualizado }
  → permiso: [ADMINISTRADOR]

DELETE /asistencia/puntos-control/:id
  → retorna: { soft delete activo=false }
  → permiso: [ADMINISTRADOR]

## Trabajador config

GET /asistencia/trabajadores
  → retorna: { lista con join a usuario (nombre, rol), turno, sucursal, tipo_contrato, sueldo }
  → permiso: [ADMINISTRADOR]

POST /asistencia/trabajadores
  → recibe: { usuario_id, turno_id, sucursal_id, tipo_contrato, sueldo_base, modalidad_pago, fecha_ingreso, factor_hora_extra, descuento_x_tardanza, monto_descuento_min }
  → retorna: { config creada }
  → permiso: [ADMINISTRADOR]
  → regla: solo 1 config activa por usuario (UNIQUE usuario_id)

GET /asistencia/trabajadores/:id
  → retorna: { config completa con usuario y turno }
  → permiso: [ADMINISTRADOR]

PUT /asistencia/trabajadores/:id
  → recibe: { campos a actualizar }
  → retorna: { config actualizada }
  → permiso: [ADMINISTRADOR]

DELETE /asistencia/trabajadores/:id
  → retorna: { soft delete activo=false }
  → permiso: [ADMINISTRADOR]

## Marcado de asistencia

POST /asistencia/marcar
  → recibe: { ssid, bssid, latitud, longitud, tipo_evento (ENTRADA/SALIDA/BREAK_INICIO/BREAK_FIN) }
  → auth: JWT trabajador (mismo patrón portal servicios C002)
  → retorna: { aprobado (boolean), estado, minutos_tardanza, mensaje, validacion_wifi, validacion_gps }
  → lógica:
    1. Obtener trabajador_config del usuario autenticado
    2. Buscar punto_control_wifi activo del tenant
    3. validacion_wifi = ssid match AND bssid match
    4. validacion_gps = haversine(lat, lng, lat_ctrl, lng_ctrl) <= radio_metros
    5. validacion_aprobada = wifi AND gps
    6. Calcular minutos_tardanza: si tipo_evento=ENTRADA y fecha_hora > turno.hora_inicio + tolerancia_minutos → minutos de diferencia
    7. Determinar estado: VALIDO, TARDANZA, FUERA_DE_ZONA, WIFI_NO_AUTORIZADO
    8. Detectar hora_extra: si tipo_evento=SALIDA y fecha_hora > turno.hora_fin → minutos_extra
    9. INSERT evento_asistencia con todos los campos calculados + dispositivo_info del request
    10. Si !validacion_aprobada → emit evento EventBridge 'asistencia.marcado_invalido'
  → regla: helper haversine en packages/shared/src/geo.ts

GET /asistencia/mi-historial
  → query params: { mes (YYYY-MM) }
  → auth: JWT trabajador
  → retorna: { eventos del trabajador autenticado en el mes, agrupados por fecha }

## Registro manual (admin)

POST /asistencia/registro-manual
  → recibe: { usuario_id, tipo_evento, fecha_hora, observacion }
  → retorna: { evento creado con estado=MANUAL, registrado_por=admin_id }
  → permiso: [ADMINISTRADOR, ASISTENTE]

## Panel tiempo real

GET /asistencia/hoy
  → retorna: { trabajadores del turno del día con: nombre, turno, hora_entrada_prog, hora_entrada_real, hora_salida_real, estado (PRESENTE/TARDANZA/FALTA/PERMISO), minutos_tardanza }
  → permiso: [ADMINISTRADOR]
  → regla: cruza trabajador_config + evento_asistencia del día + permiso_asistencia

## Planilla

POST /asistencia/planilla/calcular
  → recibe: { usuario_id, periodo (YYYY-MM) }
  → retorna: { planilla_mensual con detalle día a día }
  → permiso: [ADMINISTRADOR]
  → lógica:
    1. Obtener trabajador_config del usuario
    2. Calcular dias_laborables del periodo según turno.dias_laborales
    3. Recorrer cada día del periodo:
      - Buscar evento_asistencia del día
      - Buscar permiso_asistencia del día
      - Determinar estado_dia: PRESENTE, FALTA, TARDANZA, PERMISO, VACACIONES, FERIADO, DESCANSO
      - Acumular minutos_tardanza y minutos_extra
      - INSERT planilla_detalle por día
    4. Calcular totales con fórmulas de docs/db/modules/asistencia.md
    5. INSERT/UPDATE planilla_mensual con estado=CALCULADO

POST /asistencia/planilla/calcular-todos
  → recibe: { periodo (YYYY-MM) }
  → retorna: { cantidad_calculados, errores[] }
  → permiso: [ADMINISTRADOR]
  → regla: batch — ejecuta calcular para cada trabajador_config activo

GET /asistencia/planilla/:periodo
  → retorna: { lista de planillas del periodo con resumen por trabajador }
  → permiso: [ADMINISTRADOR]

GET /asistencia/planilla/detalle/:id
  → retorna: { planilla_mensual + array planilla_detalle día a día }
  → permiso: [ADMINISTRADOR]

PUT /asistencia/planilla/:id/aprobar
  → retorna: { estado: APROBADO, aprobado_por, fecha_aprobacion }
  → permiso: [ADMINISTRADOR]
  → regla: solo si estado actual es CALCULADO

PUT /asistencia/planilla/:id/pagar
  → recibe: { fecha_pago }
  → retorna: { estado: PAGADO, fecha_pago }
  → permiso: [ADMINISTRADOR]
  → regla: solo si estado actual es APROBADO. Una vez PAGADO no se puede modificar.

## Permisos y justificaciones

GET /asistencia/permisos
  → query params: { usuario_id, estado, tipo_permiso, fecha_desde, fecha_hasta, page, limit }
  → retorna: { permisos paginados }
  → permiso: [ADMINISTRADOR, ASISTENTE]

POST /asistencia/permisos
  → recibe: { usuario_id, fecha_inicio, fecha_fin, tipo_permiso, motivo, archivo_url, afecta_pago }
  → retorna: { permiso creado con estado=PENDIENTE }
  → permiso: [ADMINISTRADOR, ASISTENTE, VENDEDOR, TECNICO] (cualquiera puede solicitar)

GET /asistencia/permisos/:id
  → retorna: { permiso completo }
  → permiso: [ADMINISTRADOR, ASISTENTE]

PUT /asistencia/permisos/:id/aprobar
  → retorna: { estado: APROBADO, aprobado_por }
  → permiso: [ADMINISTRADOR, ASISTENTE]
  → regla: si afecta_pago=true y existe planilla en BORRADOR/CALCULADO → recalcular planilla

PUT /asistencia/permisos/:id/rechazar
  → recibe: { motivo_rechazo (opcional) }
  → retorna: { estado: RECHAZADO }
  → permiso: [ADMINISTRADOR, ASISTENTE]

## Reportes

GET /asistencia/reportes/asistencia
  → query params: { periodo (YYYY-MM), formato (xlsx/pdf) }
  → retorna: archivo descargable
  → permiso: [ADMINISTRADOR]
  → Excel: una fila por día por trabajador con campos de planilla_detalle
  → PDF: resumen ejecutivo por trabajador con totales

GET /asistencia/reportes/planilla
  → query params: { periodo (YYYY-MM), formato (xlsx/pdf) }
  → retorna: archivo descargable
  → permiso: [ADMINISTRADOR]
  → Excel: resumen de planilla por trabajador
  → PDF: planilla formal con firma de aprobación

## Portal trabajador (auth separada)

POST /portal/asistencia/auth/login
  → recibe: { numero_doc, password }
  → retorna: { token_temporal, usuario_id, nombre }
  → permiso: público
  → regla: JWT temporal con expiración corta (mismo patrón portal servicios C002)

GET /portal/asistencia/estado
  → retorna: { turno_hoy, hora_entrada_prog, hora_salida_prog, ultimo_evento (tipo, hora), puede_marcar_entrada (bool), puede_marcar_salida (bool) }
  → auth: JWT portal trabajador

GET /portal/asistencia/historial
  → query params: { mes (YYYY-MM) }
  → retorna: { eventos del mes agrupados por fecha con estado por día }
  → auth: JWT portal trabajador

GET /portal/asistencia/planilla
  → query params: { periodo (YYYY-MM) }
  → retorna: { resumen estimado: dias asistidos, tardanzas, extras, descuentos, neto estimado }
  → auth: JWT portal trabajador
  → regla: si planilla no existe en BD, calcular estimado en tiempo real desde eventos
