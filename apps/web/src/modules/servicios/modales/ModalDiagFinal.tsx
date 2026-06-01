import { X } from "lucide-react";
import { useState } from "react";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useCambiarEstado, useSaveComponentes, useUpdateOrden } from "../hooks/useOrdenesServicio";
import type { ComponenteOrden, OrdenServicioDetalle } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

type CompState = {
  tipo_afectacion: "PREVENTIVO" | "CORRECTIVO";
  tipo_accion: "REPARACION" | "CAMBIO";
} | null;

function compColor(s: CompState): string {
  if (!s) return "bg-neutral-100 text-neutral-500 border-neutral-200";
  if (s.tipo_afectacion === "PREVENTIVO") return "bg-green-100 text-green-800 border-green-300";
  if (s.tipo_accion === "CAMBIO") return "bg-red-100 text-red-800 border-red-300";
  return "bg-yellow-100 text-yellow-800 border-yellow-300";
}

function buildInitState(comps: ComponenteOrden[]): Record<string, CompState> {
  const m: Record<string, CompState> = {};
  for (const c of comps.filter((c) => c.etapa === "FINAL" || c.etapa === "PRELIMINAR")) {
    m[c.componente_id] = { tipo_afectacion: c.tipo_afectacion, tipo_accion: c.tipo_accion };
  }
  return m;
}

const MOTIVOS = [
  { value: "CLIENTE_CANCELO", label: "Cliente canceló" },
  { value: "SIN_SOLUCION", label: "Sin solución técnica" },
  { value: "COSTO_ALTO", label: "Costo muy alto" },
  { value: "OTRO", label: "Otro" },
];

type Props = {
  orden: OrdenServicioDetalle;
  onClose: () => void;
  onAbrirCotizacion: () => void;
};

export function ModalDiagFinal({ orden, onClose, onAbrirCotizacion }: Props) {
  const [editing, setEditing] = useState(false);
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico_tecnico ?? "");
  const [solucion, setSolucion] = useState(orden.solucion ?? "");
  const [compState, setCompState] = useState<Record<string, CompState>>(() =>
    buildInitState(orden.componentes)
  );
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [motivo, setMotivo] = useState("CLIENTE_CANCELO");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: compData } = useComponentes({ activo: true, pageSize: 200 });
  const allComps = compData?.data ?? [];

  const updateOrden = useUpdateOrden();
  const saveComps = useSaveComponentes();
  const cambiarEstado = useCambiarEstado();

  function handleLeftClick(compId: string) {
    if (!editing) return;
    setCompState((prev) => {
      const cur = prev[compId];
      if (!cur)
        return { ...prev, [compId]: { tipo_afectacion: "PREVENTIVO", tipo_accion: "REPARACION" } };
      if (cur.tipo_afectacion === "PREVENTIVO")
        return {
          ...prev,
          [compId]: { tipo_afectacion: "CORRECTIVO", tipo_accion: cur.tipo_accion },
        };
      return { ...prev, [compId]: null };
    });
  }

  function handleRightClick(e: React.MouseEvent, compId: string) {
    e.preventDefault();
    if (!editing) return;
    setCompState((prev) => {
      const cur = prev[compId];
      if (!cur) return prev;
      return {
        ...prev,
        [compId]: {
          ...cur,
          tipo_accion: cur.tipo_accion === "REPARACION" ? "CAMBIO" : "REPARACION",
        },
      };
    });
  }

  async function handleSave() {
    setError(null);
    try {
      await updateOrden.mutateAsync({
        id: orden.id,
        ...(diagnostico ? { diagnostico_tecnico: diagnostico } : {}),
        ...(solucion ? { solucion } : {}),
      });
      const items = allComps
        .filter((c) => compState[c.id])
        .map((c) => {
          const st = compState[c.id];
          if (!st) throw new Error("unreachable");
          return {
            componente_id: c.id,
            tipo_afectacion: st.tipo_afectacion,
            tipo_accion: st.tipo_accion,
            etapa: "FINAL" as const,
          };
        });
      await saveComps.mutateAsync({ ordenId: orden.id, etapa: "FINAL", items });
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleRegresar() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "DIAG_PRELIMINAR" });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

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

  const isPending = updateOrden.isPending || saveComps.isPending || cambiarEstado.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Diagnóstico Final — {orden.codigo}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {orden.cliente_nombre ?? "—"} · {orden.producto_nombre ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-primary-600 hover:underline"
              >
                Editar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm">
            <span className="text-xs text-neutral-500">Falla: </span>
            <span className="font-medium">{orden.falla_ingreso}</span>
          </div>

          {!editing ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500">Diagnóstico técnico</p>
                <p className="text-sm text-neutral-800">
                  {orden.diagnostico_tecnico ?? "Sin diagnóstico"}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Solución</p>
                <p className="text-sm text-neutral-800">{orden.solucion ?? "Sin solución"}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="df-diag" className="text-xs font-medium text-neutral-700">
                  Diagnóstico técnico
                </label>
                <textarea
                  id="df-diag"
                  rows={3}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="df-sol" className="text-xs font-medium text-neutral-700">
                  Solución
                </label>
                <textarea
                  id="df-sol"
                  rows={2}
                  value={solucion}
                  onChange={(e) => setSolucion(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
          )}

          {/* Componentes */}
          <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">
              Componentes {editing ? "(editable)" : "(solo lectura)"}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {allComps.map((c) => {
                const st = compState[c.id] ?? null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleLeftClick(c.id)}
                    onContextMenu={(e) => handleRightClick(e, c.id)}
                    className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${compColor(st)} ${!editing ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {c.nombre}
                    {st && (
                      <span className="ml-1 text-xs opacity-70">
                        {st.tipo_accion === "CAMBIO" ? "C" : "R"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {editing && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
              >
                Cancelar edición
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="rounded-lg bg-neutral-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}

          {showDevolucion && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-800">Motivo de devolución</h3>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={SELECT}>
                {MOTIVOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Observación adicional (opcional)"
                className={INPUT}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDevolucion(false)}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDevolucion}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  Confirmar devolución
                </button>
              </div>
            </div>
          )}

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 shrink-0">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRegresar}
            className="text-sm text-neutral-500 hover:text-neutral-700 disabled:opacity-60"
          >
            ← Regresar a Diag. Preliminar
          </button>
          <div className="flex gap-2">
            {!showDevolucion && (
              <button
                type="button"
                onClick={() => setShowDevolucion(true)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Devolución
              </button>
            )}
            <button
              type="button"
              onClick={onAbrirCotizacion}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Armar Cotización →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
