import { AlertCircle, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUpdateEstadoVisita, useVisitasDomicilio } from "../hooks/useDomicilios";
import type { EstadoVisita, VisitaDomicilioDto } from "../types/domicilios";

const COLUMNAS: EstadoVisita[] = [
  "POR_VALIDAR",
  "VALIDADA",
  "ASIGNADA",
  "EN_CAMINO",
  "EN_SITIO",
  "TERMINADA",
];

const COLUMNA_LABELS: Record<EstadoVisita, string> = {
  POR_VALIDAR: "Por validar",
  VALIDADA: "Validada",
  ASIGNADA: "Asignada",
  EN_CAMINO: "En camino",
  EN_SITIO: "En sitio",
  TERMINADA: "Terminada",
  CANCELADA: "Cancelada",
};

const COLUMNA_COLORS: Record<EstadoVisita, string> = {
  POR_VALIDAR: "bg-neutral-100 text-neutral-600",
  VALIDADA: "bg-blue-100 text-blue-700",
  ASIGNADA: "bg-purple-100 text-purple-700",
  EN_CAMINO: "bg-yellow-100 text-yellow-700",
  EN_SITIO: "bg-orange-100 text-orange-700",
  TERMINADA: "bg-green-100 text-green-700",
  CANCELADA: "bg-red-100 text-red-700",
};

const SIGUIENTE: Partial<Record<EstadoVisita, EstadoVisita>> = {
  POR_VALIDAR: "VALIDADA",
  VALIDADA: "ASIGNADA",
  ASIGNADA: "EN_CAMINO",
  EN_CAMINO: "EN_SITIO",
  EN_SITIO: "TERMINADA",
};

function VisitaCard({
  visita,
  onAvanzar,
  onCancelar,
  loading,
}: {
  visita: VisitaDomicilioDto;
  onAvanzar: (v: VisitaDomicilioDto) => void;
  onCancelar: (v: VisitaDomicilioDto) => void;
  loading: boolean;
}) {
  const siguiente = SIGUIENTE[visita.estado];
  const puedeAvanzar = siguiente !== undefined && visita.estado !== "TERMINADA";
  const puedeCancelar = visita.estado !== "TERMINADA" && visita.estado !== "CANCELADA";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-primary-600">{visita.codigo}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLUMNA_COLORS[visita.estado]}`}
        >
          {COLUMNA_LABELS[visita.estado]}
        </span>
      </div>
      <p className="text-sm font-medium text-neutral-900">{visita.cliente_nombre ?? "—"}</p>
      <p className="mt-0.5 text-xs text-neutral-500">
        <MapPin className="mr-0.5 inline h-3 w-3" />
        {visita.direccion_texto} · {visita.distrito}
      </p>
      <p className="mt-0.5 text-xs text-neutral-400">
        {visita.fecha_programada}
        {visita.hora_inicio ? ` ${visita.hora_inicio}` : ""}
      </p>
      {visita.tecnico_nombre && (
        <p className="mt-0.5 text-xs text-neutral-500">Técnico: {visita.tecnico_nombre}</p>
      )}
      <p className="mt-0.5 text-xs font-medium text-neutral-700">
        Tarifa: S/ {Number(visita.tarifa).toFixed(2)}
      </p>
      <div className="mt-2 flex gap-1">
        {puedeAvanzar && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onAvanzar(visita)}
            className="flex-1 rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
          >
            → {COLUMNA_LABELS[siguiente]}
          </button>
        )}
        {puedeCancelar && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onCancelar(visita)}
            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function DomiciliosPage() {
  const [filterEstado, setFilterEstado] = useState<EstadoVisita | "">("");
  const [cancelConfirm, setCancelConfirm] = useState<VisitaDomicilioDto | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading } = useVisitasDomicilio({
    ...(filterEstado ? { estado: filterEstado } : {}),
    pageSize: 100,
  });

  const updateEstado = useUpdateEstadoVisita();

  const visitas = data?.data ?? [];

  function handleAvanzar(visita: VisitaDomicilioDto) {
    const siguiente = SIGUIENTE[visita.estado];
    if (!siguiente) return;
    setServerError(null);
    updateEstado.mutate(
      { id: visita.id, estado: siguiente },
      {
        onError: (e) => setServerError(e.message),
      }
    );
  }

  function handleCancelar(visita: VisitaDomicilioDto) {
    setCancelConfirm(visita);
    setMotivoCancelacion("");
  }

  function confirmCancelar() {
    if (!cancelConfirm) return;
    setServerError(null);
    updateEstado.mutate(
      { id: cancelConfirm.id, estado: "CANCELADA", motivo_cancelacion: motivoCancelacion },
      {
        onSuccess: () => {
          setCancelConfirm(null);
          setMotivoCancelacion("");
        },
        onError: (e) => setServerError(e.message),
      }
    );
  }

  const visitasPorEstado = (estado: EstadoVisita) => visitas.filter((v) => v.estado === estado);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Visitas a domicilio</h1>
        <div className="flex items-center gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoVisita | "")}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {COLUMNAS.map((e) => (
              <option key={e} value={e}>
                {COLUMNA_LABELS[e]}
              </option>
            ))}
            <option value="CANCELADA">Cancelada</option>
          </select>
          <Link
            to="/domicilios/nueva"
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Agendar visita
          </Link>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">Cargando visitas…</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: `${COLUMNAS.length * 220}px` }}>
            {COLUMNAS.map((estado) => {
              const columnaVisitas = visitasPorEstado(estado);
              return (
                <div key={estado} className="flex w-52 shrink-0 flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLUMNA_COLORS[estado]}`}
                    >
                      {COLUMNA_LABELS[estado]}
                    </span>
                    <span className="text-xs text-neutral-400">{columnaVisitas.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {columnaVisitas.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-neutral-200 py-6 text-center text-xs text-neutral-400">
                        Sin visitas
                      </div>
                    ) : (
                      columnaVisitas.map((v) => (
                        <VisitaCard
                          key={v.id}
                          visita={v}
                          onAvanzar={handleAvanzar}
                          onCancelar={handleCancelar}
                          loading={updateEstado.isPending}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Cancelar visita</h2>
            <p className="mb-4 text-sm text-neutral-600">
              ¿Cancelar <strong>{cancelConfirm.codigo}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mb-4">
              <label
                htmlFor="motivo_cancelacion"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Motivo (opcional)
              </label>
              <textarea
                id="motivo_cancelacion"
                rows={3}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirm(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={updateEstado.isPending}
                onClick={confirmCancelar}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
