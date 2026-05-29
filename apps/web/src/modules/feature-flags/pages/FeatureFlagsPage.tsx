import { Check, Flag, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useFeatureFlags, useToggleFeatureFlag } from "../hooks/useFeatureFlags";
import type { FeatureFlagDto } from "../types/feature-flag";

const FLAG_META: Record<string, { label: string; description: string }> = {
  MODULO_CRM: {
    label: "CRM y WhatsApp",
    description: "Gestión de clientes potenciales y mensajería vía WhatsApp",
  },
  MODULO_DOMICILIOS: {
    label: "Visitas a domicilio",
    description: "Agenda y gestión de servicios técnicos a domicilio",
  },
};

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        checked ? "bg-primary-600" : "bg-neutral-300"
      } ${disabled === true ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function FeatureFlagsPage() {
  const { data, isLoading, isError } = useFeatureFlags();
  const toggle = useToggleFeatureFlag();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  function handleToggle(flag: FeatureFlagDto) {
    toggle.mutate(
      { clave: flag.clave, habilitado: !flag.habilitado },
      {
        onSuccess: () => {
          const label = FLAG_META[flag.clave]?.label ?? flag.clave;
          const action = !flag.habilitado ? "habilitado" : "deshabilitado";
          showToast(`${label} ${action}`, "success");
        },
        onError: () => showToast("Error al actualizar el módulo", "error"),
      }
    );
  }

  const flags = data?.data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Módulos del sistema</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Activa o desactiva módulos opcionales para este tenant.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar los módulos. Recarga la página.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {flags.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No hay módulos configurados.
            </p>
          ) : (
            flags.map((flag) => {
              const meta = FLAG_META[flag.clave];
              return (
                <div
                  key={flag.clave}
                  className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Flag className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{meta?.label ?? flag.clave}</p>
                    {meta?.description !== undefined && (
                      <p className="text-sm text-neutral-500">{meta.description}</p>
                    )}
                  </div>
                  <ToggleSwitch
                    checked={flag.habilitado}
                    onChange={() => handleToggle(flag)}
                    disabled={toggle.isPending}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {toast !== null && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
