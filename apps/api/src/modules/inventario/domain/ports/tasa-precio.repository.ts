import type { NivelTasaPrecio, TasaTipo, TipoRegistroTasa } from "@kallpasoft/shared";
import type { TasaPrecio } from "../entities/tasa-precio.js";

export type CreateTasaPrecioData = {
  nivel: NivelTasaPrecio;
  producto_id?: string | undefined;
  tipo_registro?: TipoRegistroTasa | undefined;
  componente_id?: string | undefined;
  tasa_tipo: TasaTipo;
  tasa_valor: number;
  created_by: string;
};

export type UpdateTasaPrecioData = {
  tasa_tipo?: TasaTipo | undefined;
  tasa_valor?: number | undefined;
};

export interface ITasaPrecioRepository {
  list(tenantId: string): Promise<TasaPrecio[]>;
  findById(tenantId: string, id: string): Promise<TasaPrecio | null>;
  resolveForProducto(
    tenantId: string,
    productoId: string,
    tipo: "PRODUCTO" | "SERVICIO",
    componenteId: string | null
  ): Promise<TasaPrecio | null>;
  create(tenantId: string, data: CreateTasaPrecioData): Promise<TasaPrecio>;
  update(tenantId: string, id: string, data: UpdateTasaPrecioData): Promise<TasaPrecio | null>;
  hardDelete(tenantId: string, id: string): Promise<boolean>;
  updateCostoYPrecio(tenantId: string, productoId: string, nuevoCosto: number): Promise<void>;
}
