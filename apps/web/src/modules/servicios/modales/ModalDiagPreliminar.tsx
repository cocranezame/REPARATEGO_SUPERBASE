import { X } from "lucide-react";
import { useState } from "react";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useCambiarEstado, useSaveComponentes, useUpdateOrden } from "../hooks/useOrdenesServicio";
import type { ComponenteOrden, OrdenServicioDetalle } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

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
  for (const c of comps.filter((c) => c.etapa === "PRELIMINAR")) {
    m[c.componente_id] = { tipo_afectacion: c.tipo_afectacion, tipo_accion: c.tipo_accion };
  }
  return m;
}

type Props = { orden: OrdenServicioDetalle; onClose: () => void; onAbrirCotizacion?: () => void };

export function ModalDiagPreliminar({ orden, onClose }: Props) {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico_tecnico ?? "");
  const [solucion, setSolucion] = useState(orden.solucion ?? "");
  const [compState, setCompState] = useState<Record<string, CompState>>(() =>
    buildInitState(orden.componentes)
  );
  const [error, setError] = useState<string | null>(null);

  const { data: compData } = useComponentes({ activo: true, pageSize: 200 });
  const allComps = compData?.data ?? [];

  const updateOrden = useUpdateOrden();
  const saveComps = useSaveComponentes();
  const cambiarEstado = useCambiarEstado();

  function handleLeftClick(compId: string) {
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
            etapa: "PRELIMINAR" as const,
          };
        });
      await saveComps.mutateAsync({ ordenId: orden.id, etapa: "PRELIMINAR", items });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAvanzar() {
    await handleSave();
    if (error) return;
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: "DIAG_FINAL" });
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
              Diag. Preliminar — {orden.codigo}
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Falla */}
          <div className="rounded-lg bg-neutral-50 p-3 text-sm">
            <span className="text-xs text-neutral-500">Falla reportada: </span>
            <span className="font-medium text-neutral-800">{orden.falla_ingreso}</span>
          </div>

          {/* Diagnóstico */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="dp-diag" className="text-xs font-medium text-neutral-700">
                Diagnóstico técnico
              </label>
              <textarea
                id="dp-diag"
                rows={3}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dp-sol" className="text-xs font-medium text-neutral-700">
                Solución
              </label>
              <textarea
                id="dp-sol"
                rows={2}
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {/* Componentes */}
          <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800">Componentes (Preliminar)</h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-300" />
                  Prev
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-300" />
                  Corr+Rep
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-300" />
                  Corr+Cambio
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {allComps.map((c) => {
                const st = compState[c.id] ?? null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleLeftClick(c.id)}
                    onContextMenu={(e) => handleRightClick(e, c.id)}
                    className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${compColor(st)}`}
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

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex justify-between border-t border-neutral-200 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {updateOrden.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleAvanzar}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "..." : "→ Diagnóstico Final"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
