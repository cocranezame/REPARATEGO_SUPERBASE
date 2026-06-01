import { X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

const MOTIVOS = [
  { value: "CLIENTE_CANCELO", label: "Cliente canceló" },
  { value: "SIN_SOLUCION", label: "Sin solución técnica" },
  { value: "COSTO_ALTO", label: "Costo muy alto" },
  { value: "OTRO", label: "Otro" },
];

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalDevolucion({ orden, onClose }: Props) {
  const [motivo, setMotivo] = useState("CLIENTE_CANCELO");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  async function handleDevolucion() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({
        id: orden.id,
        estado: "DEVOLUCION",
        motivo_devolucion: motivo,
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
              Devolución — {orden.codigo}
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Se generará una mini-venta por el costo de revisión (S/{" "}
            {Number(orden.costo_revision).toFixed(2)}) antes de proceder con la devolución.
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dev-motivo" className="text-xs font-medium text-neutral-700">
              Motivo de devolución
            </label>
            <select
              id="dev-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dev-obs" className="text-xs font-medium text-neutral-700">
              Observación adicional (opcional)
            </label>
            <input
              id="dev-obs"
              type="text"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalle del motivo..."
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
              disabled={cambiarEstado.isPending}
              onClick={handleDevolucion}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "Procesando..." : "Confirmar devolución + Cobro revisión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
