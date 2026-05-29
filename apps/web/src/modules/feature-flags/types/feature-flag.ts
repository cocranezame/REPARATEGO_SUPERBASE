export type FeatureFlagDto = {
  id: string;
  tenant_id: string;
  clave: string;
  habilitado: boolean;
  created_at: string;
  updated_at: string;
};

export type FeatureFlagsListResponse = {
  success: true;
  data: FeatureFlagDto[];
};

export type FeatureFlagResponse = {
  success: true;
  data: FeatureFlagDto;
};
