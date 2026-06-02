import { X } from "lucide-react";
import { useState } from "react";
import { useAnularVenta, useVentas } from "../hooks/useVentas";
import type { VentaDto } from "../types/ventas";

const COLUMNAS: { estado: string; label: string; color: string }[] = [
  { estado: "PAGO_PENDIENTE", label: "Pago pendiente", color: "border-amber-300 bg-amber-50" },
  { estado: "COMPLETADA", label: "Completada", color: "border-green-300 bg-green-50" },
  { estado: "ANULADA", label: "Anulada", color: "border-red-300 bg-red-50" },
];

// ─── Modal anular ─────────────────────────────────────────────────────────────

function AnularModal({ venta, onClose }: { venta: VentaDto; onClose: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useAnularVenta();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motivo.trim()) {
      setError("Ingresa el motivo de anulación");
      return;
    }
    setError(null);
    mutate(
      { ventaId: venta.id, motivo },
      { onSuccess: onClose, onError: (err) => setError(err.message) }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Anular venta</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3 px-6 py-4">
            <p className="text-sm text-neutral-600">
              Venta <span className="font-mono font-semibold text-neutral-900">{venta.codigo}</span>{" "}
              — S/ {Number(venta.total).toFixed(2)}
            </p>
            <div className="flex flex-col gap-1">
              <label htmlFor="motivo-anular" className="text-xs font-medium text-neutral-700">
                Motivo de anulación
              </label>
              <input
                id="motivo-anular"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ingresa el motivo..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            {error !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">{error}</div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Anulando..." : "Anular venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function VentaCard({ venta }: { venta: VentaDto }) {
  const [showAnular, setShowAnular] = useState(false);
  const canAnular = venta.estado_pago !== "ANULADA";

  return (
    <>
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-neutral-900">{venta.codigo}</span>
          <span className="text-xs font-medium text-neutral-500">
            S/ {Number(venta.total).toFixed(2)}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-neutral-600">
          {venta.cliente_nombre ?? "Sin cliente"}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">{venta.tipo_venta}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {new Date(venta.created_at).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
        </p>
        {canAnular && (
          <button
            type="button"
            onClick={() => setShowAnular(true)}
            className="mt-2 text-xs font-medium text-red-500 hover:text-red-700"
          >
            Anular
          </button>
        )}
      </div>
      {showAnular && <AnularModal venta={venta} onClose={() => setShowAnular(false)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KanbanVentasPage() {
  const { data, isLoading, isError } = useVentas({ pageSize: 200 });
  const ventas = data?.data ?? [];

  const byEstado = (estado: string) => ventas.filter((v) => v.estado_pago === estado);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Kanban — Ventas</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar ventas.</p>
      )}

      {!isLoading && !isError && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map(({ estado, label, color }) => {
            const items = byEstado(estado);
            return (
              <div
                key={estado}
                className={`flex w-56 shrink-0 flex-col rounded-xl border-2 ${color}`}
              >
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    {label}
                  </span>
                  <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-semibold text-neutral-700">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto p-2">
                  {items.length === 0 && (
                    <p className="py-4 text-center text-xs text-neutral-400">Vacío</p>
                  )}
                  {items.map((v) => (
                    <VentaCard key={v.id} venta={v} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
