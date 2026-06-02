import type { NivelTasaPrecio, TasaTipo, TipoRegistroTasa } from "@kallpasoft/shared";

export type TasaPrecio = {
  id: string;
  tenant_id: string;
  nivel: NivelTasaPrecio;
  producto_id: string | null;
  tipo_registro: TipoRegistroTasa | null;
  componente_id: string | null;
  tasa_tipo: TasaTipo;
  tasa_valor: string;
  ultimo_costo: string | null;
  promedio_historico: string | null;
  precio_venta: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};
