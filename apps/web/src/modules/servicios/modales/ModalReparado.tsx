import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioDetalle } from "../types/orden-servicio";

type Props = { orden: OrdenServicioDetalle; onClose: () => void };

export function ModalReparado({ orden, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  const waMsg = encodeURIComponent(
    `Hola ${orden.cliente_nombre ?? "cliente"}, tu equipo ${orden.producto_nombre ?? ""} (${orden.codigo}) ya está listo para recoger. Por favor visítanos para proceder con la entrega.`
  );
  const waLink = `https://wa.me/?text=${waMsg}`;

  async function handleAvisar() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "AVISADO" });
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
            <h2 className="text-base font-semibold text-neutral-900">Reparado — {orden.codigo}</h2>
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
          {/* Resumen cotización */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1">
            <p className="text-xs text-neutral-500">Resumen de venta</p>
            <div className="flex gap-4 text-sm">
              <span className="text-yellow-700">
                Correctivo: S/ {Number(orden.cotizacion.total_correctivo).toFixed(2)}
              </span>
              <span className="text-green-700">
                Preventivo: S/ {Number(orden.cotizacion.total_preventivo).toFixed(2)}
              </span>
            </div>
            <p className="font-semibold text-neutral-900">
              Total: S/ {Number(orden.cotizacion.total).toFixed(2)}
            </p>
            {orden.venta_id && (
              <p className="text-xs text-neutral-400">
                Venta auto-generada: {orden.venta_estado ?? "—"}
              </p>
            )}
          </div>

          <p className="text-sm text-neutral-600">
            El equipo está reparado. Avisa al cliente para que venga a recogerlo.
          </p>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Avisar por WhatsApp
          </a>

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between gap-3">
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
              onClick={handleAvisar}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "..." : "→ Marcar como Avisado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
