import { X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalAvisado({ orden, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  const ventaPendiente =
    orden.venta_estado && orden.venta_estado !== "PAGADO" && orden.venta_estado !== "ENTREGADO";

  async function handleEntregado() {
    if (ventaPendiente) {
      setError("La venta tiene saldo pendiente. Cobra primero antes de entregar.");
      return;
    }
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "ENTREGADO" });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleRegresar() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "REPARADO" });
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
            <h2 className="text-base font-semibold text-neutral-900">Avisado — {orden.codigo}</h2>
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
          {orden.venta_id && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                ventaPendiente
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              Venta: <span className="font-medium">{orden.venta_estado ?? "—"}</span>
              {ventaPendiente && " — hay saldo pendiente por cobrar"}
            </div>
          )}

          <p className="text-sm text-neutral-600">El cliente fue avisado. ¿Qué deseas hacer?</p>

          <div className="flex flex-col gap-3">
            {orden.venta_id && (
              <a
                href={`/ventas/${orden.venta_id}`}
                className="block w-full rounded-lg border border-primary-300 bg-primary-50 px-4 py-3 text-center text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                Ir a cobrar (Venta)
              </a>
            )}
            <button
              type="button"
              disabled={cambiarEstado.isPending || !!ventaPendiente}
              onClick={handleEntregado}
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              → Entregar equipo
            </button>
            <button
              type="button"
              disabled={cambiarEstado.isPending}
              onClick={handleRegresar}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              ← Regresar a Reparado
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
