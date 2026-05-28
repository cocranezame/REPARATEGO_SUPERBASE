import { useAuthStore } from "../stores/auth-store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string> | undefined;
  method?: HttpMethod | undefined;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errorBody = (await res.json()) as { error?: { message?: string } };
      if (errorBody?.error?.message) message = errorBody.error.message;
    } catch {
      // keep default message
    }
    throw new Error(message);
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
