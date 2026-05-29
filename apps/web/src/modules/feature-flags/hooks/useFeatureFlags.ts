import type { UpsertFeatureFlagInput } from "@kallpasoft/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import type { FeatureFlagResponse, FeatureFlagsListResponse } from "../types/feature-flag";

export function useFeatureFlags() {
  return useQuery<FeatureFlagsListResponse>({
    queryKey: ["feature-flags"],
    queryFn: () => apiClient.get<FeatureFlagsListResponse>("/feature-flags"),
  });
}

export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation<FeatureFlagResponse, Error, { clave: string } & UpsertFeatureFlagInput>({
    mutationFn: ({ clave, ...body }) =>
      apiClient.put<FeatureFlagResponse>(`/feature-flags/${clave}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
    },
  });
}
