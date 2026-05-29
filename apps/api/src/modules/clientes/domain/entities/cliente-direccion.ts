export type ClienteDireccion = {
  id: string;
  tenant_id: string;
  cliente_id: string;
  etiqueta: string;
  direccion: string;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  referencia: string | null;
  latitud: string | null;
  longitud: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
