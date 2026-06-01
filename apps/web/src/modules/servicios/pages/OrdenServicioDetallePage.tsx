import { ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useCreateObservacion,
  useHistorial,
  useObservaciones,
  useOrden,
} from "../hooks/useOrdenesServicio";
import type { EstadoOS } from "../types/orden-servicio";

const ESTADO_COLORS: Record<EstadoOS, string> = {
  VALIDACION: "bg-slate-100 text-slate-700",
  REVISION: "bg-purple-100 text-purple-700",
  DIAG_PRELIMINAR: "bg-blue-100 text-blue-700",
  DIAG_FINAL: "bg-indigo-100 text-indigo-700",
  COTIZADO: "bg-yellow-100 text-yellow-700",
  APROBADO: "bg-orange-100 text-orange-700",
  AGREGAR_SKU: "bg-amber-100 text-amber-700",
  PRIORIDAD: "bg-red-100 text-red-700",
  REPARADO: "bg-teal-100 text-teal-700",
  AVISADO: "bg-cyan-100 text-cyan-700",
  ENTREGADO: "bg-green-100 text-green-700",
  GARANTIA: "bg-amber-100 text-amber-700",
  DEVOLUCION: "bg-red-100 text-red-600",
};

type TabId = "info" | "cotizacion" | "componentes" | "evidencias" | "historial";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdenServicioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const osId = id ?? "";

  const { data, isLoading, isError } = useOrden(osId);
  const os = data?.data;

  const { data: histData } = useHistorial(osId);
  const { data: obsData } = useObservaciones(osId);
  const createObs = useCreateObservacion();

  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [obsText, setObsText] = useState("");
  const [obsEtapa, setObsEtapa] = useState("GENERAL");
  const [obsError, setObsError] = useState<string | null>(null);

  async function handleAddObs(e: React.FormEvent) {
    e.preventDefault();
    if (!obsText) return;
    setObsError(null);
    try {
      await createObs.mutateAsync({ ordenId: osId, etapa: obsEtapa, texto: obsText });
      setObsText("");
    } catch (err) {
      setObsError((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !os) {
    return (
      <div className="py-10 text-center text-sm text-red-600">
        Orden no encontrada.{" "}
        <Link to="/servicios" className="text-primary-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  const historial = histData?.data ?? [];
  const observaciones = obsData?.data ?? [];

  const tabs: { id: TabId; label: string }[] = [
    { id: "info", label: "Info" },
    { id: "cotizacion", label: "Cotización" },
    { id: "componentes", label: "Componentes" },
    { id: "evidencias", label: "Evidencias" },
    { id: "historial", label: "Historial" },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          to="/servicios"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Servicios
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="font-mono text-sm font-semibold text-neutral-900">{os.codigo}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900">{os.codigo}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[os.estado]}`}
              >
                {os.estado.replace(/_/g, " ")}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  os.canal === "DOMICILIO"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {os.canal}
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              Cliente:{" "}
              <span className="font-medium text-neutral-800">{os.cliente_nombre ?? "—"}</span>
            </p>
            <p className="text-sm text-neutral-500">
              Producto:{" "}
              <span className="font-medium text-neutral-800">{os.producto_nombre ?? "—"}</span>
              {os.numero_serie && (
                <span className="ml-2 text-neutral-400">S/N: {os.numero_serie}</span>
              )}
            </p>
            <p className="text-sm text-neutral-500">
              Falla: <span className="text-neutral-700">{os.falla_ingreso}</span>
            </p>
          </div>
          <div className="text-right text-sm space-y-1">
            <p className="text-neutral-500">
              Técnico:{" "}
              <span className="font-medium text-neutral-800">{os.tecnico_nombre ?? "—"}</span>
            </p>
            <p className="text-neutral-500">
              Costo revisión:{" "}
              <span className="font-medium">S/ {Number(os.costo_revision).toFixed(2)}</span>
            </p>
            {os.venta_id && (
              <Link
                to={`/ventas/${os.venta_id}`}
                className="flex items-center justify-end gap-1 text-xs text-primary-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver venta ({os.venta_estado ?? "—"})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex overflow-x-auto border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-700"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {[
                  { label: "Tipo servicio", value: os.tipo_servicio },
                  { label: "Canal", value: os.canal },
                  { label: "Técnico", value: os.tecnico_nombre ?? "—" },
                  {
                    label: "Creado",
                    value: fmtDate(os.created_at),
                  },
                  {
                    label: "Actualizado",
                    value: fmtDate(os.updated_at),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className="font-medium text-neutral-800">{value}</p>
                  </div>
                ))}
              </div>

              {(os.diagnostico_tecnico || os.solucion) && (
                <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
                  {os.diagnostico_tecnico && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500">Diagnóstico técnico</p>
                      <p className="text-sm text-neutral-800">{os.diagnostico_tecnico}</p>
                    </div>
                  )}
                  {os.solucion && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500">Solución</p>
                      <p className="text-sm text-neutral-800">{os.solucion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones */}
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Observaciones</h3>
                {observaciones.length > 0 ? (
                  <div className="space-y-2">
                    {observaciones.map((o) => (
                      <div key={o.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-neutral-400">
                            {o.etapa} — {o.usuario_nombre ?? "—"} — {fmtDate(o.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-neutral-800">{o.texto}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">Sin observaciones.</p>
                )}
                <form onSubmit={handleAddObs} className="flex gap-2">
                  <input
                    type="text"
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    placeholder="Agregar observación..."
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <select
                    value={obsEtapa}
                    onChange={(e) => setObsEtapa(e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="GENERAL">General</option>
                    <option value="REVISION">Revisión</option>
                    <option value="DIAGNOSTICO">Diagnóstico</option>
                    <option value="REPARACION">Reparación</option>
                    <option value="ENTREGA">Entrega</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!obsText || createObs.isPending}
                    className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </form>
                {obsError !== null && <p className="text-xs text-red-600">{obsError}</p>}
              </div>

              {/* SKUs */}
              {os.skus.length > 0 && (
                <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-800">SKUs asignados</h3>
                  {os.skus.map((sku) => (
                    <div key={sku.id} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700">
                        {sku.producto_nombre ?? sku.producto_id}
                      </span>
                      <div className="flex gap-3 text-xs text-neutral-500">
                        <span>Cant: {sku.cantidad}</span>
                        <span>S/ {Number(sku.precio_presupuesto).toFixed(2)}</span>
                        <span className="font-mono">{sku.lote_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Requerimientos */}
              {os.requerimientos.length > 0 && (
                <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-800">Requerimientos</h3>
                  {os.requerimientos.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700">{r.descripcion}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.estado === "PENDIENTE"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.estado === "ATENDIDO"
                              ? "bg-green-100 text-green-700"
                              : r.estado === "EN_COMPRA"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Cotización */}
          {activeTab === "cotizacion" && (
            <div className="space-y-4">
              {os.cotizacion.items.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  Sin cotización registrada.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50">
                          <th className="px-4 py-2 text-left text-xs text-neutral-500">Tipo</th>
                          <th className="px-4 py-2 text-left text-xs text-neutral-500">Ítem</th>
                          <th className="px-4 py-2 text-center text-xs text-neutral-500">Prev</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500">Cant</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500">P.U.</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {os.cotizacion.items.map((item) => (
                          <tr key={item.id} className={item.es_preventivo ? "bg-green-50" : ""}>
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
                                {item.tipo_item}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {item.producto_nombre ??
                                item.descripcion_manual ??
                                item.componente_nombre ??
                                "—"}
                            </td>
                            <td className="px-4 py-2 text-center text-xs">
                              {item.es_preventivo ? "✓" : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">{item.cantidad}</td>
                            <td className="px-4 py-2 text-right">
                              S/ {Number(item.precio_unitario).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              S/ {Number(item.subtotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <div className="flex gap-8">
                      <span className="text-yellow-700">Correctivo</span>
                      <span>S/ {Number(os.cotizacion.total_correctivo).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-green-700">Preventivo</span>
                      <span>S/ {Number(os.cotizacion.total_preventivo).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-8 text-base font-bold">
                      <span>Total</span>
                      <span>S/ {Number(os.cotizacion.total).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Componentes */}
          {activeTab === "componentes" && (
            <div className="space-y-3">
              {os.componentes.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  Sin componentes registrados.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="px-4 py-2 text-left text-xs text-neutral-500">Componente</th>
                        <th className="px-4 py-2 text-center text-xs text-neutral-500">Etapa</th>
                        <th className="px-4 py-2 text-center text-xs text-neutral-500">
                          Afectación
                        </th>
                        <th className="px-4 py-2 text-center text-xs text-neutral-500">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {os.componentes.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-2">{c.componente_nombre ?? c.componente_id}</td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                c.etapa === "PRELIMINAR"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              {c.etapa}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                c.tipo_afectacion === "PREVENTIVO"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {c.tipo_afectacion}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-xs text-neutral-600">
                            {c.tipo_accion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Evidencias */}
          {activeTab === "evidencias" && (
            <div className="space-y-3">
              {os.evidencias.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  Sin evidencias registradas.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {os.evidencias.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <p className="text-xs font-medium text-neutral-700 truncate">
                        {ev.etapa ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-500">{ev.descripcion ?? "—"}</p>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver archivo
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Historial */}
          {activeTab === "historial" && (
            <div className="space-y-2">
              {historial.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">Sin historial.</p>
              ) : (
                historial.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-neutral-800">
                        {h.estado_anterior || "—"} → {h.estado_nuevo}
                      </span>
                      {h.observacion && (
                        <p className="mt-0.5 text-xs text-neutral-500">{h.observacion}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-neutral-400">
                      <p>{h.usuario_nombre ?? "—"}</p>
                      <p>{fmtDate(h.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
