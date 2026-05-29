import type {
  CreateClienteInput,
  UpdateClienteDireccionInput,
  UpdateClienteInput,
} from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type {
  ClienteResponse,
  ClientesListResponse,
  ClientesParams,
  DireccionesListResponse,
  DireccionResponse,
} from "../types/cliente";

function buildClientesQS(params: ClientesParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.tipo_documento) q.set("tipo_documento", params.tipo_documento);
  if (params.tipo_persona) q.set("tipo_persona", params.tipo_persona);
  if (params.activo !== undefined) q.set("activo", String(params.activo));
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  return `?${q.toString()}`;
}

export function useClientes(params: ClientesParams = {}) {
  return useQuery<ClientesListResponse>({
    queryKey: ["clientes", params],
    queryFn: () => apiClient.get<ClientesListResponse>(`/clientes${buildClientesQS(params)}`),
  });
}

export function useCliente(id: string) {
  return useQuery<ClienteResponse>({
    queryKey: ["clientes", id],
    queryFn: () => apiClient.get<ClienteResponse>(`/clientes/${id}`),
    enabled: id !== "",
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation<ClienteResponse, Error, CreateClienteInput>({
    mutationFn: (body) => apiClient.post<ClienteResponse>("/clientes", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation<ClienteResponse, Error, { id: string } & UpdateClienteInput>({
    mutationFn: ({ id, ...body }) => apiClient.put<ClienteResponse>(`/clientes/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: true; data: null }>(`/clientes/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

// ─── Direcciones ──────────────────────────────────────────────────────────────

type CreateDireccionVars = {
  clienteId: string;
  etiqueta: "PRINCIPAL" | "TRABAJO" | "OTRO";
  direccion: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  es_principal: boolean;
};

type UpdateDireccionVars = { id: string; clienteId: string } & UpdateClienteDireccionInput;

export function useDirecciones(clienteId: string) {
  return useQuery<DireccionesListResponse>({
    queryKey: ["clientes", clienteId, "direcciones"],
    queryFn: () => apiClient.get<DireccionesListResponse>(`/clientes/${clienteId}/direcciones`),
    enabled: clienteId !== "",
  });
}

export function useCreateDireccion() {
  const queryClient = useQueryClient();
  return useMutation<DireccionResponse, Error, CreateDireccionVars>({
    mutationFn: ({ clienteId, ...body }) =>
      apiClient.post<DireccionResponse>(`/clientes/${clienteId}/direcciones`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", variables.clienteId, "direcciones"],
      });
      void queryClient.invalidateQueries({ queryKey: ["clientes", variables.clienteId] });
    },
  });
}

export function useUpdateDireccion() {
  const queryClient = useQueryClient();
  return useMutation<DireccionResponse, Error, UpdateDireccionVars>({
    mutationFn: ({ id, clienteId, ...body }) =>
      apiClient.put<DireccionResponse>(`/clientes/${clienteId}/direcciones/${id}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", variables.clienteId, "direcciones"],
      });
      void queryClient.invalidateQueries({ queryKey: ["clientes", variables.clienteId] });
    },
  });
}

export function useDeleteDireccion() {
  const queryClient = useQueryClient();
  return useMutation<{ success: true; data: null }, Error, { id: string; clienteId: string }>({
    mutationFn: ({ id, clienteId }) =>
      apiClient.delete<{ success: true; data: null }>(`/clientes/${clienteId}/direcciones/${id}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", variables.clienteId, "direcciones"],
      });
      void queryClient.invalidateQueries({ queryKey: ["clientes", variables.clienteId] });
    },
  });
}
