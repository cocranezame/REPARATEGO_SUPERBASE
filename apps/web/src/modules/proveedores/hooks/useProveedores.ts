import type {
  CreateCondicionPagoInput,
  CreateProveedorContactoInput,
  CreateProveedorInput,
  CreateProveedorLineaInput,
  CreateProveedorMetodoPagoInput,
  UpdateCondicionPagoInput,
  UpdateProveedorContactoInput,
  UpdateProveedorInput,
  UpdateProveedorMetodoPagoInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  CondicionPagoListResponse,
  CondicionPagoResponse,
  ProveedorContactoResponse,
  ProveedorContactosListResponse,
  ProveedoresListResponse,
  ProveedoresParams,
  ProveedorLineaResponse,
  ProveedorLineasListResponse,
  ProveedorMetodoPagoResponse,
  ProveedorMetodosPagoListResponse,
  ProveedorResponse,
} from "../types/proveedor";

function buildProveedoresQS(params: ProveedoresParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useProveedores(params: ProveedoresParams = {}) {
  return useQuery<ProveedoresListResponse>({
    queryKey: ["proveedores", params],
    queryFn: () =>
      apiClient.get<ProveedoresListResponse>(`/proveedores${buildProveedoresQS(params)}`),
  });
}

export function useProveedor(id: string) {
  return useQuery<ProveedorResponse>({
    queryKey: ["proveedores", id],
    queryFn: () => apiClient.get<ProveedorResponse>(`/proveedores/${id}`),
    enabled: id !== "",
  });
}

export function useCreateProveedor() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorResponse, Error, CreateProveedorInput>({
    mutationFn: (body) => apiClient.post<ProveedorResponse>("/proveedores", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

export function useUpdateProveedor() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorResponse, Error, { id: string } & UpdateProveedorInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<ProveedorResponse>(`/proveedores/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

export function useDeleteProveedor() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/proveedores/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

// ─── Condiciones de pago ─────────────────────────────────────────────────────

export function useCondicionesPago() {
  return useQuery<CondicionPagoListResponse>({
    queryKey: ["condiciones-pago"],
    queryFn: () => apiClient.get<CondicionPagoListResponse>("/proveedores/condiciones-pago"),
  });
}

export function useCreateCondicionPago() {
  const queryClient = useQueryClient();
  return useMutation<CondicionPagoResponse, Error, CreateCondicionPagoInput>({
    mutationFn: (body) =>
      apiClient.post<CondicionPagoResponse>("/proveedores/condiciones-pago", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["condiciones-pago"] });
    },
  });
}

export function useUpdateCondicionPago() {
  const queryClient = useQueryClient();
  return useMutation<CondicionPagoResponse, Error, { id: string } & UpdateCondicionPagoInput>({
    mutationFn: ({ id, ...body }) =>
      apiClient.put<CondicionPagoResponse>(`/proveedores/condiciones-pago/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["condiciones-pago"] });
    },
  });
}

export function useDeleteCondicionPago() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ success: true; data: null }>(`/proveedores/condiciones-pago/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["condiciones-pago"] });
    },
  });
}

// ─── Contactos ────────────────────────────────────────────────────────────────

type CreateContactoVars = { proveedorId: string } & CreateProveedorContactoInput;
type UpdateContactoVars = { id: string; proveedorId: string } & UpdateProveedorContactoInput;

export function useProveedorContactos(proveedorId: string) {
  return useQuery<ProveedorContactosListResponse>({
    queryKey: ["proveedores", proveedorId, "contactos"],
    queryFn: () =>
      apiClient.get<ProveedorContactosListResponse>(`/proveedores/${proveedorId}/contactos`),
    enabled: proveedorId !== "",
  });
}

export function useCreateContacto() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorContactoResponse, Error, CreateContactoVars>({
    mutationFn: ({ proveedorId, ...body }) =>
      apiClient.post<ProveedorContactoResponse>(`/proveedores/${proveedorId}/contactos`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "contactos"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

export function useUpdateContacto() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorContactoResponse, Error, UpdateContactoVars>({
    mutationFn: ({ id, proveedorId, ...body }) =>
      apiClient.put<ProveedorContactoResponse>(`/proveedores/${proveedorId}/contactos/${id}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "contactos"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

export function useDeleteContacto() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, { id: string; proveedorId: string }>({
    mutationFn: ({ id, proveedorId }) =>
      apiClient.delete<{ success: true; data: null }>(
        `/proveedores/${proveedorId}/contactos/${id}`
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "contactos"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────

type CreateMetodoPagoVars = { proveedorId: string } & CreateProveedorMetodoPagoInput;
type UpdateMetodoPagoVars = { id: string; proveedorId: string } & UpdateProveedorMetodoPagoInput;

export function useProveedorMetodosPago(proveedorId: string) {
  return useQuery<ProveedorMetodosPagoListResponse>({
    queryKey: ["proveedores", proveedorId, "metodos-pago"],
    queryFn: () =>
      apiClient.get<ProveedorMetodosPagoListResponse>(`/proveedores/${proveedorId}/metodos-pago`),
    enabled: proveedorId !== "",
  });
}

export function useCreateMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorMetodoPagoResponse, Error, CreateMetodoPagoVars>({
    mutationFn: ({ proveedorId, ...body }) =>
      apiClient.post<ProveedorMetodoPagoResponse>(`/proveedores/${proveedorId}/metodos-pago`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "metodos-pago"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

export function useUpdateMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorMetodoPagoResponse, Error, UpdateMetodoPagoVars>({
    mutationFn: ({ id, proveedorId, ...body }) =>
      apiClient.put<ProveedorMetodoPagoResponse>(
        `/proveedores/${proveedorId}/metodos-pago/${id}`,
        body
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "metodos-pago"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

export function useDeleteMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, { id: string; proveedorId: string }>({
    mutationFn: ({ id, proveedorId }) =>
      apiClient.delete<{ success: true; data: null }>(
        `/proveedores/${proveedorId}/metodos-pago/${id}`
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "metodos-pago"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

// ─── Líneas ───────────────────────────────────────────────────────────────────

type CreateLineaVars = { proveedorId: string } & CreateProveedorLineaInput;

export function useProveedorLineas(proveedorId: string) {
  return useQuery<ProveedorLineasListResponse>({
    queryKey: ["proveedores", proveedorId, "lineas"],
    queryFn: () => apiClient.get<ProveedorLineasListResponse>(`/proveedores/${proveedorId}/lineas`),
    enabled: proveedorId !== "",
  });
}

export function useCreateLinea() {
  const queryClient = useQueryClient();
  return useMutation<ProveedorLineaResponse, Error, CreateLineaVars>({
    mutationFn: ({ proveedorId, ...body }) =>
      apiClient.post<ProveedorLineaResponse>(`/proveedores/${proveedorId}/lineas`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "lineas"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}

export function useDeleteLinea() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, { id: string; proveedorId: string }>({
    mutationFn: ({ id, proveedorId }) =>
      apiClient.delete<{ success: true; data: null }>(`/proveedores/${proveedorId}/lineas/${id}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", variables.proveedorId, "lineas"],
      });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", variables.proveedorId] });
    },
  });
}
