export type Categoria = {
  id: string;
  tenant_id: string;
  nombre: string;
  descripcion: string | null;
  categoria_padre_id: string | null;
  orden: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  hijos?: Categoria[];
};
