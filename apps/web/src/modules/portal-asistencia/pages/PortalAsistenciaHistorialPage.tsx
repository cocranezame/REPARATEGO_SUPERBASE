import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePortalHistorial } from "../hooks/usePortalAsistencia";
import type { HistorialDiaDto } from "../lib/portal-asistencia-api";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getMesActual(): string {
  return new Date().toISOString().slice(0, 7);
}

function getDiaSemana(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return DIAS_SEMANA[dow]!;
}

function formatHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

function formatMes(periodo: string): string {
  const [y, m] = periodo.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

function addMonths(periodo: string, delta: number): string {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const ESTADO_DIA_LABELS: Record<string, { label: string; cls: string }> = {
  ASISTIO: { label: "Asistió", cls: "bg-green-100 text-green-700" },
  TARDANZA: { label: "Tardanza", cls: "bg-yellow-100 text-yellow-700" },
  FALTA: { label: "Falta", cls: "bg-red-100 text-red-700" },
  PERMISO: { label: "Permiso", cls: "bg-blue-100 text-blue-700" },
  DESCANSO: { label: "Descanso", cls: "bg-neutral-100 text-neutral-500" },
  NO_LABORAL: { label: "No laboral", cls: "bg-neutral-100 text-neutral-400" },
  FERIADO: { label: "Feriado", cls: "bg-purple-100 text-purple-600" },
};

function BadgeEstado({ estado }: { estado: string }) {
  const info = ESTADO_DIA_LABELS[estado] ?? {
    label: estado,
    cls: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.cls}`}>{info.label}</span>
  );
}

function calcResumen(dias: HistorialDiaDto[]) {
  let asistidos = 0;
  let tardanzas = 0;
  let faltas = 0;
  let minutosExtra = 0;
  let minutosTardanza = 0;

  for (const dia of dias) {
    if (dia.estado_dia === "ASISTIO") asistidos++;
    if (dia.estado_dia === "TARDANZA") {
      asistidos++;
      tardanzas++;
    }
    if (dia.estado_dia === "FALTA") faltas++;
    for (const ev of dia.eventos) {
      minutosTardanza += ev.minutos_tardanza;
      minutosExtra += ev.minutos_extra;
    }
  }

  return {
    asistidos,
    tardanzas,
    faltas,
    horasExtra: Math.floor(minutosExtra / 60),
    minutosTardanza,
  };
}

export function PortalAsistenciaHistorialPage() {
  const [mes, setMes] = useState(getMesActual);
  const { data: dias, isLoading } = usePortalHistorial(mes);

  function prevMes() {
    setMes((m) => addMonths(m, -1));
  }
  function nextMes() {
    const siguiente = addMonths(mes, 1);
    if (siguiente <= getMesActual()) setMes(siguiente);
  }

  const resumen = dias ? calcResumen(dias) : null;
  const diasLaboral = dias?.filter(
    (d) => !["DESCANSO", "NO_LABORAL", "FERIADO"].includes(d.estado_dia)
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de mes */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={prevMes}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </button>
        <p className="text-sm font-semibold capitalize text-neutral-900">{formatMes(mes)}</p>
        <button
          type="button"
          onClick={nextMes}
          disabled={mes >= getMesActual()}
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

      {!isLoading && dias && (
        <>
          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Fecha
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Día
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Entrada
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Salida
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Estado
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-500">
                    Tardanza
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {diasLaboral?.map((dia) => {
                  const entrada = dia.eventos.find((e) => e.tipo_evento === "ENTRADA");
                  const salida = dia.eventos.find((e) => e.tipo_evento === "SALIDA");
                  const tardanza = dia.eventos.reduce((acc, e) => acc + e.minutos_tardanza, 0);

                  return (
                    <tr key={dia.fecha} className="hover:bg-neutral-50">
                      <td className="px-3 py-2.5 text-neutral-700">{dia.fecha.slice(8)}</td>
                      <td className="px-3 py-2.5 text-neutral-500">{getDiaSemana(dia.fecha)}</td>
                      <td className="px-3 py-2.5 text-neutral-700">
                        {formatHora(entrada?.fecha_hora)}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-700">
                        {formatHora(salida?.fecha_hora)}
                      </td>
                      <td className="px-3 py-2.5">
                        <BadgeEstado estado={dia.estado_dia} />
                      </td>
                      <td className="px-3 py-2.5 text-right text-neutral-600">
                        {tardanza > 0 ? `${tardanza} min` : "—"}
                      </td>
                    </tr>
                  );
                })}
                {diasLaboral?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-400">
                      Sin registros para este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{resumen.asistidos}</p>
                <p className="mt-1 text-xs text-neutral-500">Días asistidos</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{resumen.tardanzas}</p>
                <p className="mt-1 text-xs text-neutral-500">Tardanzas</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{resumen.faltas}</p>
                <p className="mt-1 text-xs text-neutral-500">Faltas</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{resumen.horasExtra}</p>
                <p className="mt-1 text-xs text-neutral-500">Horas extra</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
