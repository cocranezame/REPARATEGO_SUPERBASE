import type { Caja, ResumenCaja } from "../entities/caja.js";

export type AbrirCajaData = {
  sucursal_id: string;
  usuario_id: string;
  monto_apertura: number;
};

export type CerrarCajaData = {
  monto_cierre: number;
  notas_cierre?: string | undefined;
};

export type ListCajasParams = {
  sucursal_id?: string | undefined;
  estado?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListCajasResult = {
  items: Caja[];
  total: number;
};

export interface ICajaRepository {
  list(tenantId: string, params: ListCajasParams): Promise<ListCajasResult>;
  findActual(tenantId: string, usuarioId: string): Promise<Caja | null>;
  findById(tenantId: string, id: string): Promise<Caja | null>;
  abrir(tenantId: string, data: AbrirCajaData): Promise<Caja>;
  cerrar(tenantId: string, id: string, data: CerrarCajaData): Promise<Caja | null>;
  resumen(tenantId: string, id: string): Promise<ResumenCaja>;
}
