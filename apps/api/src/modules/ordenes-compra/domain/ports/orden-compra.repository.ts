import type { OrdenCompra } from "../entities/orden-compra.js";

export type ListOrdenesParams = {
  page: number;
  pageSize: number;
  estado?: string;
  proveedor_id?: string;
  desde?: string;
  hasta?: string;
};

export type ListOrdenesResult = {
  items: OrdenCompra[];
  total: number;
};

export type GenerarOrdenData = {
  proveedor_id: string;
  solicitud_ids: string[];
  items: Array<{
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  usuario_id: string;
  fecha_entrega_estimada?: string;
  notas?: string;
};

export type ConfirmarOrdenItemData = {
  producto_id: string;
  cantidad_recibida: number;
  precio_unitario: number;
  conforme: boolean;
  notas?: string | undefined;
};

export interface IOrdenCompraRepository {
  list(tenantId: string, params: ListOrdenesParams): Promise<ListOrdenesResult>;
  findById(tenantId: string, id: string): Promise<OrdenCompra | null>;
  generar(tenantId: string, data: GenerarOrdenData): Promise<OrdenCompra>;
  updateEstado(tenantId: string, id: string, estado: string): Promise<OrdenCompra | null>;
  confirmar(
    tenantId: string,
    id: string,
    items: ConfirmarOrdenItemData[]
  ): Promise<OrdenCompra | null>;
}
