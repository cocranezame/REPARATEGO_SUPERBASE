import { usePortalAuthStore } from "../../../shared/stores/portal-auth-store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

type HttpMethod = "GET" | "POST";

type RequestOptions = {
  body?: unknown;
  method?: HttpMethod;
  public?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, public: isPublic = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!isPublic) {
    const token = usePortalAuthStore.getState().user?.token;
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortalLoginResponse = {
  success: true;
  data: { token: string; cliente_id: string; cliente_nombre: string };
};

export type PortalInstanciaImagen = { id: string; url: string; descripcion?: string };

export type PortalInstancia = {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  categoria_nombre?: string;
  marca_nombre?: string;
  modelo_nombre?: string;
  numero_serie?: string;
  imagenes: PortalInstanciaImagen[];
  servicio_activo?: { id: string; codigo: string; estado: string };
};

export type PortalCotizacionItem = {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
};

export type PortalEvidencia = { id: string; url: string; descripcion?: string };

export type PortalSucursal = {
  nombre: string;
  direccion?: string;
  distrito?: string;
  telefono?: string;
};

export type PortalServicio = {
  id: string;
  codigo: string;
  estado: string;
  falla_ingreso: string;
  costo_revision: string;
  canal: string;
  created_at: string;
  updated_at: string;
  cliente_nombre?: string;
  instancia_id: string;
  producto_nombre?: string;
  categoria_nombre?: string;
  marca_nombre?: string;
  numero_serie?: string;
  imagenes_instancia: PortalInstanciaImagen[];
  diagnostico_tecnico?: string;
  solucion?: string;
  evidencias: PortalEvidencia[];
  cotizacion?: {
    items: PortalCotizacionItem[];
    total_correctivo: string;
    total_preventivo: string;
    total: string;
  };
  sucursal?: PortalSucursal;
  venta_estado?: string;
  motivo_devolucion?: string;
  preventivo_accepted?: boolean;
};

// ─── API calls ────────────────────────────────────────────────────────────────

export const portalApi = {
  login: (numero_doc: string, celular: string) =>
    request<PortalLoginResponse>("/portal/auth/login", {
      method: "POST",
      body: { numero_doc, celular },
      public: true,
    }),

  misEquipos: () => request<{ success: true; data: PortalInstancia[] }>("/portal/mis-equipos"),

  getServicio: (id: string) =>
    request<{ success: true; data: PortalServicio }>(`/portal/servicios/${id}`),

  aceptarValidacion: (id: string, body: { texto_mostrado: string; documento_version: string }) =>
    request<{ success: true; data: { estado_nuevo: string } }>(
      `/portal/servicios/${id}/aceptar-validacion`,
      { method: "POST", body }
    ),

  aceptarPresupuesto: (
    id: string,
    body: { preventivo_accepted: boolean; texto_mostrado: string; documento_version: string }
  ) =>
    request<{ success: true; data: { estado_nuevo: string } }>(
      `/portal/servicios/${id}/aceptar-presupuesto`,
      { method: "POST", body }
    ),
};
