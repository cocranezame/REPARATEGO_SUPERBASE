import { FileSpreadsheet, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  useAprobarPlanilla,
  useCalcularTodos,
  usePagarPlanilla,
  usePlanillaDetalle,
  usePlanillaPeriodo,
  useReportePlanilla,
} from "../hooks/useAsistencia";
import type { PlanillaDto } from "../types/asistencia";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ESTADO_PLANILLA: Record<PlanillaDto["estado"], { cls: string; label: string }> = {
  BORRADOR: { cls: "bg-neutral-100 text-neutral-600", label: "Borrador" },
  CALCULADO: { cls: "bg-blue-100 text-blue-700", label: "Calculado" },
  APROBADO: { cls: "bg-green-100 text-green-700", label: "Aprobado" },
  PAGADO: { cls: "bg-purple-100 text-purple-700", label: "Pagado" },
};

const ESTADO_DIA_CLS: Record<string, string> = {
  ASISTIO: "bg-green-100 text-green-700",
  TARDANZA: "bg-yellow-100 text-yellow-700",
  FALTA: "bg-red-100 text-red-700",
  PERMISO: "bg-blue-100 text-blue-700",
  DESCANSO: "bg-neutral-100 text-neutral-500",
  FERIADO: "bg-orange-100 text-orange-700",
  NO_LABORAL: "bg-neutral-100 text-neutral-400",
};

function fmt(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────

function ModalDetalle({
  planillaId,
  periodo,
  onClose,
}: {
  planillaId: string;
  periodo: string;
  onClose: () => void;
}) {
  const { data, isLoading } = usePlanillaDetalle(planillaId);
  const aprobar = useAprobarPlanilla();
  const pagar = usePagarPlanilla();
  const reportePlanilla = useReportePlanilla();
  const [showPagarForm, setShowPagarForm] = useState(false);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));

  const pl = data?.data.planilla;
  const detalle = data?.data.detalle ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isLoading ? "Cargando…" : `Planilla — ${pl?.nombre ?? ""}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : pl ? (
          <>
            {/* Info cabecera */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-neutral-200 px-6 py-4 text-sm lg:grid-cols-4">
              <div>
                <p className="text-xs text-neutral-500">Período</p>
                <p className="font-medium">{pl.periodo}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Turno</p>
                <p className="font-medium">{pl.turno_nombre ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Contrato</p>
                <p className="font-medium">{pl.tipo_contrato ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Sueldo base</p>
                <p className="font-medium">{fmt(pl.sueldo_base)}</p>
              </div>
            </div>

            {/* Tabla día a día */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 text-left font-medium uppercase text-neutral-500">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-left font-medium uppercase text-neutral-500">
                      Día
                    </th>
                    <th className="px-3 py-2 text-center font-medium uppercase text-neutral-500">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-center font-medium uppercase text-neutral-500">
                      Ent. prog
                    </th>
                    <th className="px-3 py-2 text-center font-medium uppercase text-neutral-500">
                      Ent. real
                    </th>
                    <th className="px-3 py-2 text-center font-medium uppercase text-neutral-500">
                      Sal. prog
                    </th>
                    <th className="px-3 py-2 text-center font-medium uppercase text-neutral-500">
                      Sal. real
                    </th>
                    <th className="px-3 py-2 text-right font-medium uppercase text-neutral-500">
                      Tard.
                    </th>
                    <th className="px-3 py-2 text-right font-medium uppercase text-neutral-500">
                      Extra
                    </th>
                    <th className="px-3 py-2 text-right font-medium uppercase text-neutral-500">
                      Desc.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {detalle.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 font-mono">{d.fecha}</td>
                      <td className="px-3 py-2 text-neutral-600">{d.dia_semana}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_DIA_CLS[d.estado_dia] ?? "bg-neutral-100 text-neutral-500"}`}
                        >
                          {d.estado_dia}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {d.hora_entrada_prog ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {d.hora_entrada_real ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {d.hora_salida_prog ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {d.hora_salida_real ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {d.minutos_tardanza > 0 ? (
                          <span className="text-yellow-700">{d.minutos_tardanza}'</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {d.minutos_extra > 0 ? (
                          <span className="text-green-700">{d.minutos_extra}'</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600">
                        {d.descuento_dia > 0 ? fmt(d.descuento_dia) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3 border-t border-neutral-200 px-6 py-3 text-sm lg:grid-cols-6">
              <div className="text-center">
                <p className="text-xs text-neutral-500">Asistidos</p>
                <p className="font-semibold">{pl.dias_asistidos}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Faltas</p>
                <p className="font-semibold text-red-600">{pl.dias_falta}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Tardanzas</p>
                <p className="font-semibold text-yellow-700">{pl.tardanzas_min} min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">H. extra</p>
                <p className="font-semibold text-green-700">{pl.horas_extra} h</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Bruto</p>
                <p className="font-semibold">{fmt(pl.total_bruto)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Neto</p>
                <p className="font-bold text-primary-700">{fmt(pl.total_neto)}</p>
              </div>
            </div>

            {/* Formulario fecha pago */}
            {showPagarForm && (
              <div className="flex items-end gap-3 border-t border-neutral-200 px-6 py-3">
                <div>
                  <label
                    htmlFor="fecha-pago"
                    className="mb-1 block text-xs font-medium text-neutral-700"
                  >
                    Fecha de pago
                  </label>
                  <input
                    id="fecha-pago"
                    type="date"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={pagar.isPending}
                  onClick={async () => {
                    await pagar.mutateAsync({ id: pl.id, fecha_pago: fechaPago });
                    setShowPagarForm(false);
                    onClose();
                  }}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {pagar.isPending ? "Procesando…" : "Confirmar pago"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPagarForm(false)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-6 py-4">
              {pl.estado === "CALCULADO" && (
                <button
                  type="button"
                  disabled={aprobar.isPending}
                  onClick={async () => {
                    await aprobar.mutateAsync(pl.id);
                    onClose();
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {aprobar.isPending ? "Aprobando…" : "Aprobar"}
                </button>
              )}
              {pl.estado === "APROBADO" && (
                <button
                  type="button"
                  onClick={() => setShowPagarForm(true)}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Marcar como pagado
                </button>
              )}

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={reportePlanilla.isPending}
                  onClick={() => reportePlanilla.mutate({ periodo, formato: "xlsx" })}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Excel
                </button>
                <button
                  type="button"
                  disabled={reportePlanilla.isPending}
                  onClick={() => reportePlanilla.mutate({ periodo, formato: "pdf" })}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  PDF
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function PlanillaPage() {
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
  const { data, isLoading } = usePlanillaPeriodo(periodo);
  const calcularTodos = useCalcularTodos();

  const planillas = data?.data ?? [];

  if (!user || user.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;

  const anios = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-4">
      {/* Selector período + acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">Planilla mensual</h1>
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={calcularTodos.isPending}
            onClick={() => calcularTodos.mutate({ periodo })}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {calcularTodos.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {calcularTodos.isPending ? "Calculando…" : "Calcular todos"}
          </button>
        </div>
      </div>

      {calcularTodos.isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {calcularTodos.data.data.calculados} planillas calculadas para {periodo}
        </div>
      )}

      {/* Tabla resumen */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-500">Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Trabajador
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Laborables
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Asistidos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Faltas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Tard. (min)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    H. Extra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Sueldo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Desc.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Bonif.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Bruto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Neto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {planillas.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-neutral-500">
                      Sin planillas para {MESES[mes - 1]} {anio}. Use "Calcular todos".
                    </td>
                  </tr>
                )}
                {planillas.map((p) => {
                  const badge = ESTADO_PLANILLA[p.estado];
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900">{p.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-neutral-600">
                        {p.dias_laborables}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-600">{p.dias_asistidos}</td>
                      <td className="px-4 py-3 text-center text-red-600">{p.dias_falta}</td>
                      <td className="px-4 py-3 text-center text-yellow-700">{p.tardanzas_min}</td>
                      <td className="px-4 py-3 text-center text-green-700">{p.horas_extra}</td>
                      <td className="px-4 py-3 text-right">{fmt(p.sueldo_base)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(p.descuentos)}</td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {fmt(p.bonificaciones)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(p.total_bruto)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-700">
                        {fmt(p.total_neto)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <ModalDetalle
          planillaId={selectedId}
          periodo={periodo}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
