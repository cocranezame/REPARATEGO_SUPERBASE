import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import {
  useCambiarEstado,
  useCreateEvidencia,
  useCreateRequerimiento,
  useSaveComponentes,
  useUpdateOrden,
} from "../hooks/useOrdenesServicio";
import type { ComponenteOrden, OrdenServicioResumen } from "../types/orden-servicio";

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

function compBadge(s: CompState): string | null {
  if (!s) return null;
  return s.tipo_accion === "CAMBIO" ? "cambio" : "rep";
}

function initCompState(existing: ComponenteOrden[], etapa: "PRELIMINAR" | "FINAL") {
  const map: Record<string, CompState> = {};
  for (const c of existing) {
    if (c.etapa === etapa) {
      map[c.componente_id] = { tipo_afectacion: c.tipo_afectacion, tipo_accion: c.tipo_accion };
    }
  }
  return map;
}

type Props = {
  orden: OrdenServicioResumen;
  existingComponentes: ComponenteOrden[];
  onClose: () => void;
};

export function ModalRevision({ orden, existingComponentes, onClose }: Props) {
  const [accion, setAccion] = useState<"DIAG_PRELIMINAR" | "DIAG_FINAL" | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [solucion, setSolucion] = useState("");

  const etapa: "PRELIMINAR" | "FINAL" = accion === "DIAG_PRELIMINAR" ? "PRELIMINAR" : "FINAL";
  const [compState, setCompState] = useState<Record<string, CompState>>(() =>
    initCompState(existingComponentes, etapa)
  );

  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqImagen, setReqImagen] = useState("");
  const [reqObs, setReqObs] = useState("");

  const [error, setError] = useState<string | null>(null);

  const { data: compData } = useComponentes({ activo: true, pageSize: 200 });
  const allComps = compData?.data ?? [];

  const updateOrden = useUpdateOrden();
  const saveComps = useSaveComponentes();
  const addEvidencia = useCreateEvidencia();
  const addReq = useCreateRequerimiento();
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

  async function handleAddEvidencia(e: React.FormEvent) {
    e.preventDefault();
    if (!evidenceUrl) return;
    setError(null);
    try {
      await addEvidencia.mutateAsync({
        ordenId: orden.id,
        url: evidenceUrl,
        etapa: etapa,
        ...(evidenceDesc ? { descripcion: evidenceDesc } : {}),
      });
      setEvidenceUrl("");
      setEvidenceDesc("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddReq(e: React.FormEvent) {
    e.preventDefault();
    if (!reqDesc) return;
    setError(null);
    try {
      await addReq.mutateAsync({
        ordenId: orden.id,
        descripcion: reqDesc,
        cantidad: 1,
        ...(reqImagen ? { imagen_url: reqImagen } : {}),
        ...(reqObs ? { observacion: reqObs } : {}),
      });
      setReqDesc("");
      setReqImagen("");
      setReqObs("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAvanzar() {
    if (!accion) return;
    setError(null);
    try {
      if (diagnostico || solucion) {
        await updateOrden.mutateAsync({
          id: orden.id,
          ...(diagnostico ? { diagnostico_tecnico: diagnostico } : {}),
          ...(solucion ? { solucion } : {}),
        });
      }

      const items = allComps
        .filter((c) => compState[c.id])
        .map((c) => {
          const st = compState[c.id];
          if (!st) throw new Error("unreachable");
          return {
            componente_id: c.id,
            tipo_afectacion: st.tipo_afectacion,
            tipo_accion: st.tipo_accion,
            etapa,
          };
        });

      await saveComps.mutateAsync({ ordenId: orden.id, etapa, items });
      await cambiarEstado.mutateAsync({ id: orden.id, estado: accion });
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Revisión — {orden.codigo}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {orden.cliente_nombre ?? "—"} · {orden.producto_nombre ?? "—"} · Falla:{" "}
              {orden.falla_ingreso}
            </p>
            <p className="text-xs text-neutral-500">
              Costo revisión: S/ {Number(orden.costo_revision).toFixed(2)}
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
          {/* Action buttons */}
          {!accion && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAccion("DIAG_PRELIMINAR");
                  setCompState(initCompState(existingComponentes, "PRELIMINAR"));
                }}
                className="flex-1 rounded-lg border-2 border-primary-300 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                → Diagnóstico Preliminar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccion("DIAG_FINAL");
                  setCompState(initCompState(existingComponentes, "FINAL"));
                }}
                className="flex-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100"
              >
                → Diagnóstico Final
              </button>
            </div>
          )}

          {accion && (
            <>
              {/* Diagnóstico */}
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Diagnóstico técnico</h3>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rev-diag" className="text-xs text-neutral-600">
                    Diagnóstico
                  </label>
                  <textarea
                    id="rev-diag"
                    rows={2}
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    placeholder="Describe el diagnóstico..."
                    className={INPUT}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rev-sol" className="text-xs text-neutral-600">
                    Solución
                  </label>
                  <textarea
                    id="rev-sol"
                    rows={2}
                    value={solucion}
                    onChange={(e) => setSolucion(e.target.value)}
                    placeholder="Solución propuesta..."
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Componentes grid */}
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-800">Componentes afectados</h3>
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
                    const badge = compBadge(st);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleLeftClick(c.id)}
                        onContextMenu={(e) => handleRightClick(e, c.id)}
                        className={`relative rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${compColor(st)}`}
                      >
                        {c.nombre}
                        {badge && (
                          <span className="absolute -right-1 -top-1 rounded-full bg-white px-1 text-xs font-bold shadow">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-400">
                  Click izq: cicla estado · Click der: alterna reparación↔cambio
                </p>
              </div>

              {/* Evidencias */}
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Evidencias</h3>
                <form onSubmit={handleAddEvidencia} className="flex gap-2">
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="URL de imagen..."
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!evidenceUrl || addEvidencia.isPending}
                    className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Requerimientos */}
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Solicitud de repuestos</h3>
                <form onSubmit={handleAddReq} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={reqDesc}
                      onChange={(e) => setReqDesc(e.target.value)}
                      placeholder="Descripción del repuesto *"
                      className="col-span-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={reqImagen}
                      onChange={(e) => setReqImagen(e.target.value)}
                      placeholder="URL imagen (opcional)"
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={reqObs}
                      onChange={(e) => setReqObs(e.target.value)}
                      placeholder="Observación (opcional)"
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!reqDesc || addReq.isPending}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" /> Agregar requerimiento
                  </button>
                </form>
              </div>
            </>
          )}

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        {accion && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={() => setAccion(null)}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              ← Cambiar acción
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleAvanzar}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {isPending
                  ? "Guardando..."
                  : `Pasar a ${accion === "DIAG_PRELIMINAR" ? "Diag. Preliminar" : "Diag. Final"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
