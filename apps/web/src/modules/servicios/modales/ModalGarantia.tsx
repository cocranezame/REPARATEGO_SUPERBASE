import { X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalGarantia({ orden, onClose }: Props) {
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  async function handleActivarGarantia() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({
        id: orden.id,
        estado: "GARANTIA",
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
            <h2 className="text-base font-semibold text-neutral-900">Garantía — {orden.codigo}</h2>
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            El cliente reporta un problema con el equipo ya entregado. Se abrirá una orden de
            garantía vinculada a este servicio.
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gar-obs" className="text-xs font-medium text-neutral-700">
              Descripción del problema de garantía <span className="text-red-500">*</span>
            </label>
            <textarea
              id="gar-obs"
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe el problema que reporta el cliente..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
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
              Cancelar
            </button>
            <button
              type="button"
              disabled={cambiarEstado.isPending || !observacion}
              onClick={handleActivarGarantia}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "..." : "→ Activar Garantía"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
