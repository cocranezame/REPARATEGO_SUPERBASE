# Módulo: Asistencia y Planilla — Schema de Base de Datos

> Referencia: C007 (2026-06-02)
> 7 tablas nuevas

## Tablas

### turno_trabajo
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| nombre | varchar(100) | |
| hora_inicio | time | |
| hora_fin | time | |
| tolerancia_minutos | int default 15 | gracia para tardanza |
| dias_laborales | text[] | ['LUN','MAR',...] |
| activo | bool default true | |
| created_at / updated_at | timestamptz | |

UNIQUE(tenant_id, nombre)

### punto_control_wifi
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| sucursal_id | uuid FK sucursal | |
| nombre | varchar(100) | |
| ssid | varchar(100) | nombre red WiFi |
| bssid | varchar(17) | MAC del router |
| latitud | decimal(10,8) | centro GPS |
| longitud | decimal(11,8) | |
| radio_metros | int default 50 | |
| activo | bool default true | |
| created_at / updated_at | timestamptz | |

### trabajador_config
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| usuario_id | uuid FK usuario | UNIQUE |
| turno_id | uuid FK turno_trabajo | |
| sucursal_id | uuid FK sucursal | |
| tipo_contrato | enum | PLANILLA / HONORARIOS / PRACTICANTE |
| sueldo_base | decimal(10,2) | mensual PEN |
| modalidad_pago | enum | MENSUAL / QUINCENAL / SEMANAL |
| moneda | char(3) default 'PEN' | |
| fecha_ingreso | date | |
| fecha_cese | date null | |
| factor_hora_extra | decimal(4,2) default 1.25 | |
| descuento_x_tardanza | enum | POR_MINUTO / POR_RANGO / SIN_DESCUENTO |
| monto_descuento_min | decimal(6,2) default 0 | S/ por minuto |
| activo | bool default true | |
| created_at / updated_at | timestamptz | |

### evento_asistencia (tabla central)
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| usuario_id | uuid FK usuario | |
| turno_id | uuid FK turno_trabajo | |
| tipo_evento | enum | ENTRADA / SALIDA / BREAK_INICIO / BREAK_FIN |
| fecha_hora | timestamptz | momento exacto |
| fecha | date | generado (agrupar por día) |
| ssid_detectado | varchar(100) | |
| bssid_detectado | varchar(17) | |
| latitud_marcado | decimal(10,8) | |
| longitud_marcado | decimal(11,8) | |
| distancia_metros | int | calculado haversine |
| punto_control_id | uuid FK punto_control_wifi | |
| validacion_wifi | bool | ssid+bssid coincide |
| validacion_gps | bool | dentro del radio |
| validacion_aprobada | bool | AND de ambas |
| estado | enum | VALIDO / TARDANZA / FUERA_DE_ZONA / WIFI_NO_AUTORIZADO / MANUAL / ANULADO |
| minutos_tardanza | int default 0 | |
| es_hora_extra | bool default false | |
| minutos_extra | int default 0 | |
| dispositivo_info | jsonb | {userAgent, ip} |
| registrado_por | uuid FK usuario null | null=auto, uuid=admin manual |
| observacion | text null | |
| created_at / updated_at | timestamptz | |

ÍNDICES: (tenant_id, usuario_id, fecha), (tenant_id, fecha), (tenant_id, estado)

### permiso_asistencia
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| usuario_id | uuid FK usuario | |
| fecha_inicio | date | |
| fecha_fin | date | |
| tipo_permiso | enum | MEDICO / PERSONAL / VACACIONES / CAPACITACION / LICENCIA / OTRO |
| motivo | text | |
| archivo_url | text null | S3 |
| estado | enum | PENDIENTE / APROBADO / RECHAZADO |
| aprobado_por | uuid FK usuario null | |
| afecta_pago | bool default false | |
| created_at / updated_at | timestamptz | |

### planilla_mensual (tabla de cierre)
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| usuario_id | uuid FK usuario | |
| periodo | char(7) | '2025-06' |
| dias_laborables | int | según turno |
| dias_asistidos | int | |
| dias_falta | int | |
| dias_falta_justificada | int | |
| dias_vacaciones | int | |
| minutos_tardanza_total | int | |
| minutos_extra_total | int | |
| horas_extra_total | decimal(6,2) | minutos/60 |
| sueldo_base | decimal(10,2) | snapshot al calcular |
| valor_dia | decimal(10,2) | sueldo/dias_laborables |
| valor_hora | decimal(10,2) | valor_dia/8 |
| descuento_tardanzas | decimal(10,2) | |
| descuento_faltas | decimal(10,2) | |
| monto_horas_extra | decimal(10,2) | |
| bonificaciones | decimal(10,2) default 0 | |
| otros_descuentos | decimal(10,2) default 0 | |
| total_bruto | decimal(10,2) | calculado |
| total_neto | decimal(10,2) | bruto - desc + bonos |
| estado | enum | BORRADOR / CALCULADO / APROBADO / PAGADO |
| aprobado_por | uuid FK usuario null | |
| fecha_aprobacion | timestamptz null | |
| fecha_pago | date null | |
| observaciones | text null | |
| created_at / updated_at | timestamptz | |

UNIQUE(tenant_id, usuario_id, periodo)

### planilla_detalle
| col | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK tenant | |
| planilla_id | uuid FK planilla_mensual | |
| usuario_id | uuid FK usuario | |
| fecha | date | |
| estado_dia | enum | PRESENTE / FALTA / TARDANZA / PERMISO / VACACIONES / FERIADO / DESCANSO |
| hora_entrada_real | timestamptz null | |
| hora_salida_real | timestamptz null | |
| hora_entrada_prog | time | del turno |
| hora_salida_prog | time | del turno |
| minutos_tardanza | int default 0 | |
| minutos_extra | int default 0 | |
| descuento_dia | decimal(8,2) default 0 | |
| observacion | text null | |
| created_at / updated_at | timestamptz | |

UNIQUE(planilla_id, fecha)

## Fórmulas de planilla

```sql
-- valor_dia        = sueldo_base / dias_laborables
-- valor_hora       = valor_dia / 8
-- descuento_faltas = dias_falta_injustificada * valor_dia
-- POR_MINUTO:
-- descuento_tardanzas = minutos_tardanza_total * monto_descuento_min
-- POR_RANGO (>15min = descuenta 30min):
-- descuento_tardanzas = COUNT(tardanzas) * (valor_hora / 2)
-- monto_horas_extra = horas_extra_total * valor_hora * factor_hora_extra
-- total_bruto = sueldo_base - descuento_faltas - descuento_tardanzas + monto_horas_extra + bonificaciones
-- total_neto  = total_bruto - otros_descuentos
```

## Flujo validación marcado

```
POST /asistencia/marcar { ssid, bssid, lat, lng, tipo_evento }
→ buscar punto_control_wifi activo del tenant
→ validacion_wifi = (ssid match AND bssid match)
→ validacion_gps  = haversine(lat,lng,lat_ctrl,lng_ctrl) <= radio
→ validacion_aprobada = wifi AND gps
→ calcular minutos_tardanza vs turno del trabajador_config
→ INSERT evento_asistencia
→ si !validacion_aprobada → notificar admin (EventBridge)
```

## RLS

Mismo patrón existente: NULLIF(current_setting('app.tenant_id',true),'')::uuid
Aplicar en las 7 tablas nuevas.
