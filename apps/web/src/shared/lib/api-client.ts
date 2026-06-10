import { useAuthStore } from "../stores/auth-store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string> | undefined;
  method?: HttpMethod | undefined;
};

// Single in-flight refresh promise to prevent concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      return false;
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = (await res.json()) as {
        data: { access_token: string; refresh_token: string };
      };
      setTokens(data.data.access_token, data.data.refresh_token);
      return true;
    } catch {
      logout();
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = useAuthStore.getState().accessToken;
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (TENANT_ID) {
    headers["X-Tenant-Id"] = TENANT_ID;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...headers },
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  // Auto-refresh on 401 (token expired), retry once
  if (res.status === 401 && !isRetry) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const errorBody = (await res.json()) as { error?: { message?: string; code?: string } };
      if (errorBody?.error?.message) message = errorBody.error.message;
      if (errorBody?.error?.code) code = errorBody.error.code;
    } catch {
      // keep default message
    }
    throw new ApiRequestError(message, res.status, code);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { headers, method: "DELETE" }),
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { headers, method: "GET" }),
  patch: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { body, headers, method: "PATCH" }),
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { body, headers, method: "POST" }),
  put: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { body, headers, method: "PUT" }),
};
