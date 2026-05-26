export type ID = string;

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type TenantScoped = {
  tenantId: ID;
};

export type BaseEntity = {
  id: ID;
  activo: boolean;
} & Timestamps &
  TenantScoped;

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

export const VERSION = "0.0.1";
