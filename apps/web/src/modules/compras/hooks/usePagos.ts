import type { CreatePagoProveedorInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { PagoResponse, PagosListResponse, PagosParams } from "../types/pago";

function buildQS(params: PagosParams): string {
  const q = new URLSearchParams();
  if (params.proveedor_id) q.set("proveedor_id", params.proveedor_id);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  return `?${q.toString()}`;
}

export function usePagos(params: PagosParams = {}) {
  return useQuery<PagosListResponse>({
    queryKey: ["pagos-proveedor", params],
    queryFn: () => apiClient.get<PagosListResponse>(`/pagos-proveedor${buildQS(params)}`),
  });
}

export function useCreatePago() {
  const queryClient = useQueryClient();
  return useMutation<PagoResponse, Error, CreatePagoProveedorInput>({
    mutationFn: (body) => apiClient.post<PagoResponse>("/pagos-proveedor", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pagos-proveedor"] });
      void queryClient.invalidateQueries({ queryKey: ["ordenes-compra"] });
    },
  });
}
