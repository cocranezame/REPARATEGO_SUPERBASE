import type { TasaPrecio } from "../entities/tasa-precio.js";

export type CreateTasaPrecioData = {
  nombre: string;
  porcentaje: number;
};

export type UpdateTasaPrecioData = {
  nombre?: string;
  porcentaje?: number;
  activo?: boolean;
};

export interface ITasaPrecioRepository {
  list(tenantId: string, activo?: boolean): Promise<TasaPrecio[]>;
  create(tenantId: string, data: CreateTasaPrecioData): Promise<TasaPrecio>;
  update(tenantId: string, id: string, data: UpdateTasaPrecioData): Promise<TasaPrecio | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
