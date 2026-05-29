export type Marca = {
  id: string;
  tenant_id: string;
  nombre: string;
  logo_url: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
