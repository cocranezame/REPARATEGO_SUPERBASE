import { X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalAprobado({ orden, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  async function handleAvanzar(estado: "AGREGAR_SKU" | "COTIZADO") {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado });
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
              Cotización Aprobada — {orden.codigo}
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
          <p className="text-sm text-neutral-600">
            La cotización fue aprobada. ¿Qué deseas hacer a continuación?
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={cambiarEstado.isPending}
              onClick={() => handleAvanzar("AGREGAR_SKU")}
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              → Agregar SKU / Repuestos
            </button>
            <button
              type="button"
              disabled={cambiarEstado.isPending}
              onClick={() => handleAvanzar("COTIZADO")}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              ← Retroceder a Cotizado
            </button>
          </div>

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
