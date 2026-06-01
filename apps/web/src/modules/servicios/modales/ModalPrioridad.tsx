import { X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalPrioridad({ orden, onClose }: Props) {
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  async function handleReparado() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({
        id: orden.id,
        estado: "REPARADO",
        ...(observacion ? { observacion } : {}),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              En Prioridad — {orden.codigo}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {orden.cliente_nombre ?? "—"} · {orden.producto_nombre ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            El equipo está en espera de repuesto o en cola de prioridad. Cuando esté listo, márcalo
            como Reparado.
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="prio-obs" className="text-xs font-medium text-neutral-700">
              Observación (opcional)
            </label>
            <textarea
              id="prio-obs"
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              placeholder="Estado actual, tiempo estimado..."
            />
          </div>

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={cambiarEstado.isPending}
              onClick={handleReparado}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "..." : "→ Marcar como Reparado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
