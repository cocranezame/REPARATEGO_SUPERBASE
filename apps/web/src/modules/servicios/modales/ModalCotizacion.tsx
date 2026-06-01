import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { useCambiarEstado, useCreateCotizacion } from "../hooks/useOrdenesServicio";
import type { OrdenServicioDetalle, PresupuestoItem } from "../types/orden-servicio";
import { BusquedaPresupuesto } from "./BusquedaPresupuesto";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

type LocalItem = {
  key: string;
  tipo_item: "REPUESTO" | "SERVICIO" | "MANUAL";
  producto_id?: string;
  componente_id?: string;
  descripcion_manual?: string;
  display: string;
  cantidad: number;
  precio_unitario: number;
  es_preventivo: boolean;
};

type BuscarCtx = {
  tipo: "REPUESTO" | "SERVICIO";
  componenteId?: string;
  esPreventivo: boolean;
};

function compColor(tipo_afectacion: string, tipo_accion: string) {
  if (tipo_afectacion === "PREVENTIVO") return "bg-green-100 text-green-800 border-green-300";
  if (tipo_accion === "CAMBIO") return "bg-red-100 text-red-800 border-red-300";
  return "bg-yellow-100 text-yellow-800 border-yellow-300";
}

type Props = { orden: OrdenServicioDetalle; onClose: () => void };

export function ModalCotizacion({ orden, onClose }: Props) {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [buscarCtx, setBuscarCtx] = useState<BuscarCtx | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  const [manualPrecio, setManualPrecio] = useState("");
  const [manualCant, setManualCant] = useState("1");
  const [manualPrev, setManualPrev] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createCotizacion = useCreateCotizacion();
  const cambiarEstado = useCambiarEstado();

  const finalComps = orden.componentes.filter((c) => c.etapa === "FINAL");

  function addFromPresupuesto(item: PresupuestoItem, esPreventivo: boolean) {
    setItems((prev) => [
      ...prev,
      {
        key: `${item.id}-${Date.now()}`,
        tipo_item: item.tipo as "REPUESTO" | "SERVICIO",
        producto_id: item.id,
        ...(buscarCtx?.componenteId ? { componente_id: buscarCtx.componenteId } : {}),
        display: item.nombre,
        cantidad: 1,
        precio_unitario: Number(item.precio_venta),
        es_preventivo: esPreventivo,
      },
    ]);
  }

  function addManual() {
    if (!manualDesc || !manualPrecio) return;
    setItems((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        tipo_item: "MANUAL",
        descripcion_manual: manualDesc,
        display: manualDesc,
        cantidad: Math.max(1, parseInt(manualCant) || 1),
        precio_unitario: parseFloat(manualPrecio),
        es_preventivo: manualPrev,
      },
    ]);
    setManualDesc("");
    setManualPrecio("");
    setManualCant("1");
    setManualPrev(false);
    setShowManual(false);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateCantidad(key: string, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i))
    );
  }

  const totalCorrectivo = items
    .filter((i) => !i.es_preventivo)
    .reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const totalPreventivo = items
    .filter((i) => i.es_preventivo)
    .reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const total = totalCorrectivo + totalPreventivo;

  async function handleRegistrar() {
    if (items.length === 0) {
      setError("Agrega al menos un ítem a la cotización");
      return;
    }
    setError(null);
    try {
      await createCotizacion.mutateAsync({
        ordenId: orden.id,
        items: items.map((i) => ({
          tipo_item: i.tipo_item,
          ...(i.producto_id ? { producto_id: i.producto_id } : {}),
          ...(i.componente_id ? { componente_id: i.componente_id } : {}),
          ...(i.descripcion_manual ? { descripcion_manual: i.descripcion_manual } : {}),
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          es_preventivo: i.es_preventivo,
        })),
        ...(observacion ? { observacion } : {}),
      });
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "COTIZADO" });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const isPending = createCotizacion.isPending || cambiarEstado.isPending;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          className="flex w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Armar Cotización — {orden.codigo}
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

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Componentes afectados */}
            {finalComps.length > 0 && (
              <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Componentes afectados (Final)
                </h3>
                <div className="space-y-2">
                  {finalComps.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${compColor(c.tipo_afectacion, c.tipo_accion)}`}
                      >
                        {c.componente_nombre ?? c.componente_id}
                        <span className="ml-2 opacity-60">
                          {c.tipo_afectacion === "PREVENTIVO"
                            ? "Preventivo"
                            : c.tipo_accion === "CAMBIO"
                              ? "Cambio"
                              : "Reparación"}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setBuscarCtx({
                            tipo: c.tipo_accion === "CAMBIO" ? "REPUESTO" : "SERVICIO",
                            componenteId: c.componente_id,
                            esPreventivo: c.tipo_afectacion === "PREVENTIVO",
                          })
                        }
                        className="whitespace-nowrap text-xs text-primary-600 hover:underline"
                      >
                        + {c.tipo_accion === "CAMBIO" ? "Repuesto" : "Servicio"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de ítems */}
            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-neutral-800">Ítems de cotización</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBuscarCtx({ tipo: "REPUESTO", esPreventivo: false })}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    + Repuesto
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuscarCtx({ tipo: "SERVICIO", esPreventivo: false })}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-700 hover:bg-orange-100"
                  >
                    + Servicio
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManual((v) => !v)}
                    className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200"
                  >
                    + Manual
                  </button>
                </div>
              </div>

              {showManual && (
                <div className="border-b border-neutral-200 bg-amber-50 px-4 py-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <input
                      type="text"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      placeholder="Descripción *"
                      className="col-span-5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={manualPrecio}
                      onChange={(e) => setManualPrecio(e.target.value)}
                      placeholder="Precio"
                      className="col-span-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={manualCant}
                      onChange={(e) => setManualCant(e.target.value)}
                      placeholder="Cant"
                      className="col-span-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      min="1"
                    />
                    <label className="col-span-2 flex cursor-pointer items-center gap-1.5 text-xs text-neutral-700">
                      <input
                        type="checkbox"
                        checked={manualPrev}
                        onChange={(e) => setManualPrev(e.target.checked)}
                        className="rounded border-neutral-300"
                      />
                      Preventivo
                    </label>
                    <button
                      type="button"
                      onClick={addManual}
                      disabled={!manualDesc || !manualPrecio}
                      className="col-span-2 rounded-lg bg-neutral-700 px-2 py-1.5 text-xs text-white disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">
                  Sin ítems — agrega repuestos, servicios o ítems manuales
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Ítem</th>
                      <th className="px-4 py-2.5 text-right">Cant</th>
                      <th className="px-4 py-2.5 text-right">P.venta</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item) => (
                      <tr key={item.key} className={item.es_preventivo ? "bg-green-50" : ""}>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              item.tipo_item === "REPUESTO"
                                ? "bg-blue-100 text-blue-700"
                                : item.tipo_item === "SERVICIO"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {item.tipo_item === "REPUESTO"
                              ? "Rep"
                              : item.tipo_item === "SERVICIO"
                                ? "Serv"
                                : "Man"}
                          </span>
                          {item.es_preventivo && (
                            <span className="ml-1 text-xs text-green-600">Prev</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-neutral-800">{item.display}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => updateCantidad(item.key, -1)}
                              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => updateCantidad(item.key, 1)}
                              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-700">
                          S/ {item.precio_unitario.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-neutral-900">
                          S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {items.length > 0 && (
                <div className="flex justify-end gap-6 border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                  <span className="text-yellow-700">
                    Correctivo: S/ {totalCorrectivo.toFixed(2)}
                  </span>
                  <span className="text-green-700">
                    Preventivo: S/ {totalPreventivo.toFixed(2)}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    Total: S/ {total.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Observación */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cot-obs" className="text-xs font-medium text-neutral-700">
                Observación (opcional)
              </label>
              <textarea
                id="cot-obs"
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className={INPUT}
                placeholder="Notas adicionales..."
              />
            </div>

            {error !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isPending || items.length === 0}
              onClick={handleRegistrar}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isPending ? "Registrando..." : "Registrar Cotización → COTIZADO"}
            </button>
          </div>
        </div>
      </div>

      {buscarCtx && (
        <BusquedaPresupuesto
          tipo={buscarCtx.tipo}
          componenteId={buscarCtx.componenteId}
          esPreventivo={buscarCtx.esPreventivo}
          onSelect={(item, prev) => {
            addFromPresupuesto(item, prev);
            setBuscarCtx(null);
          }}
          onClose={() => setBuscarCtx(null)}
        />
      )}
    </>
  );
}
