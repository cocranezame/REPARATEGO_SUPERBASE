import { usePortalAsistenciaAuthStore } from "../../../shared/stores/portal-asistencia-auth-store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT";
  public?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, public: isPublic = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!isPublic) {
    const token = usePortalAsistenciaAuthStore.getState().user?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (TENANT_ID) headers["X-Tenant-Id"] = TENANT_ID;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { error?: { message?: string } };
      if (err?.error?.message) message = err.error.message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

export type PortalAsistenciaLoginResponse = {
  success: true;
  data: { token: string; usuario_id: string; nombre: string };
};

export type TurnoDto = {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos: number;
  dias_laborales: string[];
};

export type PortalEstadoDto = {
  turno: TurnoDto | null;
  hora_entrada_prog: string | null;
  hora_salida_prog: string | null;
  ultimo_evento: { tipo: string; hora: string } | null;
  puede_marcar_entrada: boolean;
  puede_marcar_salida: boolean;
};

export type HistorialEventoDto = {
  id: string;
  tipo_evento: string;
  fecha_hora: string;
  estado: string;
  minutos_tardanza: number;
  minutos_extra: number;
};

export type HistorialDiaDto = {
  fecha: string;
  eventos: HistorialEventoDto[];
  estado_dia: string;
};

export type MarcadoResultDto = {
  aprobado: boolean;
  estado: string;
  minutos_tardanza: number;
  minutos_extra: number;
  distancia_metros: number;
  mensaje: string;
  validacion_wifi: boolean;
  validacion_gps: boolean;
};

export type PlanillaPortalDto = {
  id: string;
  periodo: string;
  dias_laborables: number;
  dias_asistidos: number;
  dias_falta: number;
  minutos_tardanza_total: number;
  horas_extra_total: number;
  sueldo_base: number;
  descuento_tardanzas: number;
  descuento_faltas: number;
  monto_horas_extra: number;
  bonificaciones: number;
  otros_descuentos: number;
  total_bruto: number;
  total_neto: number;
  estado: string;
} | null;

export type MarcarPayload = {
  ssid: string | null;
  bssid: string | null;
  latitud: number;
  longitud: number;
  tipo_evento: "ENTRADA" | "SALIDA";
};

// ─── API calls ────────────────────────────────────────────────────────────────

export const portalAsistenciaApi = {
  login: (numero_doc: string, password: string) =>
    request<PortalAsistenciaLoginResponse>("/portal/asistencia/auth/login", {
      method: "POST",
      body: { numero_doc, password },
      public: true,
    }),

  getEstado: () => request<{ success: true; data: PortalEstadoDto }>("/portal/asistencia/estado"),

  marcar: (payload: MarcarPayload) =>
    request<{ success: true; data: MarcadoResultDto }>("/portal/asistencia/marcar", {
      method: "POST",
      body: payload,
    }),

  getHistorial: (mes: string) =>
    request<{ success: true; data: HistorialDiaDto[] }>(`/portal/asistencia/historial?mes=${mes}`),

  getPlanilla: (periodo: string) =>
    request<{ success: true; data: PlanillaPortalDto }>(
      `/portal/asistencia/planilla?periodo=${periodo}`
    ),
};
