export type Componente = {
  id: string;
  tenant_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
