import type { ClienteDireccion } from "./cliente-direccion.js";

export type Cliente = {
  id: string;
  tenant_id: string;
  tipo_documento: string;
  numero_documento: string;
  tipo_persona: string;
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
  telefono_secundario: string | null;
  notas: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  direcciones?: ClienteDireccion[];
};
