import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import { useDisponibilidadTecnicos } from "../hooks/useDomicilios";

const HORAS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

function formatFecha(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatLabel(d: Date): string {
  return d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

const ESTADO_COLORS: Record<string, string> = {
  POR_VALIDAR: "bg-neutral-200 text-neutral-700",
  VALIDADA: "bg-blue-200 text-blue-800",
  ASIGNADA: "bg-purple-200 text-purple-800",
  EN_CAMINO: "bg-yellow-200 text-yellow-800",
  EN_SITIO: "bg-orange-200 text-orange-800",
  TERMINADA: "bg-green-200 text-green-800",
  CANCELADA: "bg-red-100 text-red-600",
};

export function CalendarioPage() {
  const hoy = new Date();
  const [semanaBase, setSemanaBase] = useState<Date>(hoy);
  const [tecnicoFiltro, setTecnicoFiltro] = useState("");
  const [vista, setVista] = useState<"semana" | "dia">("semana");
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(formatFecha(hoy));

  const { data: tecnicosData } = useUsuarios({ rol: "TECNICO", activo: true, pageSize: 200 });

  const fecha = vista === "dia" ? diaSeleccionado : formatFecha(semanaBase);
  const { data: dispData, isLoading } = useDisponibilidadTecnicos(
    fecha,
    tecnicoFiltro || undefined
  );

  const tecnicos = dispData?.data ?? [];

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i));

  function prevSemana() {
    setSemanaBase((d) => addDays(d, -7));
  }

  function nextSemana() {
    setSemanaBase((d) => addDays(d, 7));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">Calendario de técnicos</h1>
        <div className="flex items-center gap-2">
          <select
            value={tecnicoFiltro}
            onChange={(e) => setTecnicoFiltro(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Todos los técnicos</option>
            {tecnicosData?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombres} {u.apellidos}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-neutral-300 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setVista("semana")}
              className={`px-3 py-2 ${vista === "semana" ? "bg-primary-600 text-white" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVista("dia")}
              className={`px-3 py-2 ${vista === "dia" ? "bg-primary-600 text-white" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
            >
              Día
            </button>
          </div>
          <Link
            to="/domicilios/nueva"
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Agendar
          </Link>
        </div>
      </div>

      {vista === "semana" ? (
        <>
          {/* Semana navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSemana}
              className="rounded-lg border border-neutral-300 p-1.5 hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <span className="text-sm font-medium text-neutral-700">
              {formatLabel(diasSemana[0] ?? semanaBase)} —{" "}
              {formatLabel(diasSemana[6] ?? semanaBase)}
            </span>
            <button
              type="button"
              onClick={nextSemana}
              className="rounded-lg border border-neutral-300 p-1.5 hover:bg-neutral-50"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </button>
          </div>

          {/* Semana grid */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <div className="grid" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
              {/* Header */}
              <div className="border-b border-neutral-200 bg-neutral-50 p-2 text-xs font-medium text-neutral-500">
                Técnico
              </div>
              {diasSemana.map((d) => (
                <button
                  key={formatFecha(d)}
                  type="button"
                  onClick={() => {
                    setDiaSeleccionado(formatFecha(d));
                    setVista("dia");
                  }}
                  className={`border-b border-l border-neutral-200 p-2 text-center text-xs font-medium hover:bg-primary-50 ${
                    formatFecha(d) === formatFecha(hoy)
                      ? "bg-primary-50 text-primary-700"
                      : "bg-neutral-50 text-neutral-600"
                  }`}
                >
                  {formatLabel(d)}
                </button>
              ))}

              {/* Rows */}
              {isLoading ? (
                <div
                  className="col-span-8 py-8 text-center text-sm text-neutral-400"
                  style={{ gridColumn: "1 / -1" }}
                >
                  Cargando…
                </div>
              ) : tecnicos.length === 0 ? (
                <div
                  className="col-span-8 py-8 text-center text-sm text-neutral-400"
                  style={{ gridColumn: "1 / -1" }}
                >
                  Sin visitas en esta semana
                </div>
              ) : (
                tecnicos.map((t) => (
                  <>
                    <div
                      key={`label-${t.tecnico_id}`}
                      className="border-b border-neutral-200 p-2 text-xs font-medium text-neutral-700"
                    >
                      {t.tecnico_nombre}
                    </div>
                    {diasSemana.map((d) => {
                      const dayStr = formatFecha(d);
                      const visitasDia = t.visitas.filter(() => fecha === dayStr);
                      return (
                        <div
                          key={`${t.tecnico_id}-${dayStr}`}
                          className="min-h-[60px] border-b border-l border-neutral-200 p-1"
                        >
                          {visitasDia.map((v) => (
                            <div
                              key={v.id}
                              className={`mb-1 rounded px-1.5 py-0.5 text-xs ${ESTADO_COLORS[v.estado] ?? "bg-neutral-100"}`}
                            >
                              <span className="font-mono">{v.codigo}</span>
                              {v.hora_inicio && (
                                <span className="ml-1 text-neutral-500">{v.hora_inicio}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Día navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDiaSeleccionado((d) => formatFecha(addDays(new Date(`${d}T00:00:00`), -1)))
              }
              className="rounded-lg border border-neutral-300 p-1.5 hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <input
              type="date"
              value={diaSeleccionado}
              onChange={(e) => setDiaSeleccionado(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setDiaSeleccionado((d) => formatFecha(addDays(new Date(d + "T00:00:00"), 1)))
              }
              className="rounded-lg border border-neutral-300 p-1.5 hover:bg-neutral-50"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </button>
          </div>

          {/* Día grid */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-neutral-400">Cargando…</div>
            ) : tecnicos.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-400">
                Sin visitas para este día
              </div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: "120px repeat(auto-fill, 1fr)" }}>
                <div className="border-b border-neutral-200 bg-neutral-50 p-2 text-xs font-medium text-neutral-500">
                  Hora
                </div>
                {tecnicos.map((t) => (
                  <div
                    key={t.tecnico_id}
                    className="border-b border-l border-neutral-200 bg-neutral-50 p-2 text-center text-xs font-medium text-neutral-700"
                  >
                    {t.tecnico_nombre}
                  </div>
                ))}
                {HORAS.map((hora) => (
                  <>
                    <div
                      key={`hora-${hora}`}
                      className="border-b border-neutral-200 p-2 text-xs text-neutral-400"
                    >
                      {hora}
                    </div>
                    {tecnicos.map((t) => {
                      const visitasHora = t.visitas.filter((v) =>
                        v.hora_inicio?.startsWith(hora.slice(0, 2))
                      );
                      return (
                        <div
                          key={`${t.tecnico_id}-${hora}`}
                          className="min-h-[48px] border-b border-l border-neutral-200 p-1"
                        >
                          {visitasHora.map((v) => (
                            <div
                              key={v.id}
                              className={`mb-1 rounded px-1.5 py-1 text-xs ${ESTADO_COLORS[v.estado] ?? "bg-neutral-100"}`}
                            >
                              <div className="font-mono font-semibold">{v.codigo}</div>
                              {v.cliente_nombre && (
                                <div className="flex items-center gap-0.5 text-neutral-600">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {v.cliente_nombre}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
