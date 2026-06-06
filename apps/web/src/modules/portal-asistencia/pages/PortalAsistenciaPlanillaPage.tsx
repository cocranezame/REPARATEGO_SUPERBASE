import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePortalHistorial, usePortalPlanilla } from "../hooks/usePortalAsistencia";
import type { HistorialDiaDto } from "../lib/portal-asistencia-api";

function getPeriodoActual(): string {
  return new Date().toISOString().slice(0, 7);
}

function addMonths(periodo: string, delta: number): string {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

function formatSoles(valor: number): string {
  return `S/ ${valor.toFixed(2)}`;
}

function BadgeSource({ fuente }: { fuente: "Calculado" | "Estimado" }) {
  const cls =
    fuente === "Calculado" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{fuente}</span>
  );
}

function BadgeEstadoPlanilla({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    BORRADOR: { label: "Borrador", cls: "bg-neutral-100 text-neutral-500" },
    CALCULADO: { label: "Calculado", cls: "bg-blue-100 text-blue-600" },
    APROBADO: { label: "Aprobado", cls: "bg-green-100 text-green-700" },
    PAGADO: { label: "Pagado", cls: "bg-purple-100 text-purple-700" },
  };
  const info = map[estado] ?? { label: estado, cls: "bg-neutral-100 text-neutral-500" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.cls}`}>
      {info.label}
    </span>
  );
}

function calcEstimadoFromHistorial(dias: HistorialDiaDto[]) {
  let asistidos = 0;
  let faltas = 0;
  let minutosTardanza = 0;
  let minutosExtra = 0;

  for (const dia of dias) {
    if (dia.estado_dia === "ASISTIO") asistidos++;
    if (dia.estado_dia === "TARDANZA") {
      asistidos++;
      for (const ev of dia.eventos) {
        minutosTardanza += ev.minutos_tardanza;
      }
    }
    if (dia.estado_dia === "FALTA") faltas++;
    for (const ev of dia.eventos) {
      minutosExtra += ev.minutos_extra;
    }
  }

  return {
    asistidos,
    faltas,
    minutosTardanza,
    horasExtra: Math.round((minutosExtra / 60) * 100) / 100,
  };
}

type FilaProps = { label: string; value: string; highlight?: boolean };
function FilaPlanilla({ label, value, highlight }: FilaProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${highlight ? "bg-primary-50" : ""}`}
    >
      <span
        className={`text-sm ${highlight ? "font-semibold text-primary-900" : "text-neutral-600"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-primary-900" : "text-neutral-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function PortalAsistenciaPlanillaPage() {
  const [periodo, setPeriodo] = useState(getPeriodoActual);
  const { data: planilla, isLoading: loadingPlanilla } = usePortalPlanilla(periodo);
  const { data: historial, isLoading: loadingHistorial } = usePortalHistorial(periodo);

  function prevPeriodo() {
    setPeriodo((p) => addMonths(p, -1));
  }
  function nextPeriodo() {
    const siguiente = addMonths(periodo, 1);
    if (siguiente <= getPeriodoActual()) setPeriodo(siguiente);
  }

  const isLoading = loadingPlanilla || loadingHistorial;
  const estimado = historial ? calcEstimadoFromHistorial(historial) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de período */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={prevPeriodo}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </button>
        <p className="text-sm font-semibold capitalize text-neutral-900">
          {formatPeriodo(periodo)}
        </p>
        <button
          type="button"
          onClick={nextPeriodo}
          disabled={periodo >= getPeriodoActual()}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        </button>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Planilla calculada (datos reales) */}
      {!isLoading && planilla && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">
              Planilla {formatPeriodo(periodo)}
            </p>
            <div className="flex items-center gap-2">
              <BadgeEstadoPlanilla estado={planilla.estado} />
              <BadgeSource fuente="Calculado" />
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            <FilaPlanilla label="Días laborables" value={String(planilla.dias_laborables)} />
            <FilaPlanilla label="Días asistidos" value={String(planilla.dias_asistidos)} />
            <FilaPlanilla label="Faltas" value={String(planilla.dias_falta)} />
            <FilaPlanilla
              label="Min. tardanza"
              value={
                planilla.minutos_tardanza_total > 0 ? `${planilla.minutos_tardanza_total} min` : "—"
              }
            />
            <FilaPlanilla
              label="Horas extra"
              value={
                planilla.horas_extra_total > 0 ? `${planilla.horas_extra_total.toFixed(1)} h` : "—"
              }
            />
            <FilaPlanilla label="Sueldo base" value={formatSoles(planilla.sueldo_base)} />
            <FilaPlanilla
              label="Descuento tardanzas"
              value={
                planilla.descuento_tardanzas > 0
                  ? `− ${formatSoles(planilla.descuento_tardanzas)}`
                  : "—"
              }
            />
            <FilaPlanilla
              label="Descuento faltas"
              value={
                planilla.descuento_faltas > 0 ? `− ${formatSoles(planilla.descuento_faltas)}` : "—"
              }
            />
            <FilaPlanilla
              label="Monto horas extra"
              value={
                planilla.monto_horas_extra > 0
                  ? `+ ${formatSoles(planilla.monto_horas_extra)}`
                  : "—"
              }
            />
            <FilaPlanilla label="Total bruto" value={formatSoles(planilla.total_bruto)} />
            <FilaPlanilla label="Total neto" value={formatSoles(planilla.total_neto)} highlight />
          </div>
        </div>
      )}

      {/* Estimado desde historial */}
      {!isLoading && !planilla && estimado && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">
              Planilla {formatPeriodo(periodo)}
            </p>
            <BadgeSource fuente="Estimado" />
          </div>

          <div className="divide-y divide-neutral-100">
            <FilaPlanilla label="Días asistidos (hasta hoy)" value={String(estimado.asistidos)} />
            <FilaPlanilla label="Faltas" value={String(estimado.faltas)} />
            <FilaPlanilla
              label="Min. tardanza acumulados"
              value={estimado.minutosTardanza > 0 ? `${estimado.minutosTardanza} min` : "—"}
            />
            <FilaPlanilla
              label="Horas extra acumuladas"
              value={estimado.horasExtra > 0 ? `${estimado.horasExtra} h` : "—"}
            />
          </div>

          <div className="border-t border-neutral-100 bg-yellow-50 px-4 py-3">
            <p className="text-xs text-yellow-700">
              Planilla no calculada aún. Los valores monetarios serán determinados por el
              administrador al cerrar el período.
            </p>
          </div>
        </div>
      )}

      {/* Sin datos en absoluto */}
      {!isLoading && !planilla && (!historial || historial.length === 0) && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">
          Sin datos para este período
        </div>
      )}
    </div>
  );
}
