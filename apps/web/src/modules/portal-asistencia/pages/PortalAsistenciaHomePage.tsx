import { CheckCircle, Clock, Loader2, MapPin, WifiOff, XCircle } from "lucide-react";
import { useState } from "react";
import { usePortalEstado, usePortalMarcar } from "../hooks/usePortalAsistencia";
import type { MarcadoResultDto } from "../lib/portal-asistencia-api";

type FlowStep = "idle" | "getting_location" | "wifi_input" | "sending" | "result";

function formatHora(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

function IndicadorEstado({
  puede_marcar_entrada,
  puede_marcar_salida,
  ultimo_evento,
  resultado,
}: {
  puede_marcar_entrada: boolean;
  puede_marcar_salida: boolean;
  ultimo_evento: { tipo: string; hora: string } | null;
  resultado: MarcadoResultDto | null;
}) {
  if (resultado) {
    if (!resultado.aprobado) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-center text-sm font-medium text-red-700">{resultado.mensaje}</p>
        </div>
      );
    }
    if (resultado.minutos_tardanza > 0) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="text-center text-sm font-medium text-yellow-700">{resultado.mensaje}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <p className="text-center text-sm font-medium text-green-700">{resultado.mensaje}</p>
      </div>
    );
  }

  if (!puede_marcar_entrada && !puede_marcar_salida && ultimo_evento) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-700">Asistencia completa hoy</p>
      </div>
    );
  }

  if (!puede_marcar_entrada && puede_marcar_salida) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-700">
          Entrada registrada a las {formatHora(ultimo_evento?.hora)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
        <Clock className="h-12 w-12 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-500">Sin marcar hoy</p>
    </div>
  );
}

export function PortalAsistenciaHomePage() {
  const { data: estado, isLoading: loadingEstado } = usePortalEstado();
  const marcarMutation = usePortalMarcar();

  const [step, setStep] = useState<FlowStep>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tipoEvento, setTipoEvento] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [wifiSSID, setWifiSSID] = useState("");
  const [noWifi, setNoWifi] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MarcadoResultDto | null>(null);

  async function handlePressMarcar(tipo: "ENTRADA" | "SALIDA") {
    setTipoEvento(tipo);
    setGeoError(null);
    setResultado(null);
    setStep("getting_location");

    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización");
      setStep("idle");
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          enableHighAccuracy: true,
        });
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStep("wifi_input");
    } catch {
      setGeoError("Activa la ubicación para marcar asistencia");
      setStep("idle");
    }
  }

  async function handleConfirmarWifi() {
    if (!coords) return;
    const ssid = noWifi ? null : wifiSSID.trim() || null;
    setStep("sending");

    try {
      const result = await marcarMutation.mutateAsync({
        ssid,
        bssid: null,
        latitud: coords.lat,
        longitud: coords.lng,
        tipo_evento: tipoEvento,
      });
      setResultado(result);
      setStep("result");
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "Error al marcar asistencia");
      setStep("idle");
    }
  }

  function handleNuevoMarcado() {
    setStep("idle");
    setResultado(null);
    setCoords(null);
    setWifiSSID("");
    setNoWifi(false);
    setGeoError(null);
  }

  if (loadingEstado) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const puede_marcar_entrada = estado?.puede_marcar_entrada ?? true;
  const puede_marcar_salida = estado?.puede_marcar_salida ?? false;
  const turno = estado?.turno ?? null;
  const ultimo_evento = estado?.ultimo_evento ?? null;
  const asistenciaCompleta = !puede_marcar_entrada && !puede_marcar_salida;

  return (
    <div className="flex flex-col gap-6">
      {/* Turno del día */}
      {turno && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Tu turno hoy
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{turno.nombre}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-neutral-600">
            <span>Entrada: {turno.hora_inicio}</span>
            <span>·</span>
            <span>Salida: {turno.hora_fin}</span>
          </div>
          {estado?.hora_entrada_prog && (
            <p className="mt-1 text-xs text-neutral-400">
              Tolerancia: {turno.tolerancia_minutos} min
            </p>
          )}
        </div>
      )}

      {!turno && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center text-sm text-neutral-500">
          No tienes turno configurado para hoy
        </div>
      )}

      {/* Indicador visual */}
      <div className="flex justify-center py-4">
        <IndicadorEstado
          puede_marcar_entrada={puede_marcar_entrada}
          puede_marcar_salida={puede_marcar_salida}
          ultimo_evento={ultimo_evento}
          resultado={resultado}
        />
      </div>

      {/* Error de geolocalización */}
      {geoError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* ── IDLE: botón principal ── */}
      {step === "idle" && !asistenciaCompleta && !resultado && turno && (
        <div className="flex flex-col gap-3">
          {puede_marcar_entrada && (
            <button
              type="button"
              onClick={() => handlePressMarcar("ENTRADA")}
              className="w-full rounded-2xl bg-green-600 py-5 text-xl font-bold text-white shadow-lg shadow-green-200 transition-colors hover:bg-green-700 active:scale-95"
            >
              MARCAR ENTRADA
            </button>
          )}
          {puede_marcar_salida && (
            <button
              type="button"
              onClick={() => handlePressMarcar("SALIDA")}
              className="w-full rounded-2xl bg-blue-600 py-5 text-xl font-bold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 active:scale-95"
            >
              MARCAR SALIDA
            </button>
          )}
        </div>
      )}

      {/* ── Asistencia completa ── */}
      {asistenciaCompleta && !resultado && (
        <p className="text-center text-base font-medium text-neutral-500">
          Asistencia completa hoy
        </p>
      )}

      {/* ── Getting location ── */}
      {step === "getting_location" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-neutral-600">Obteniendo tu ubicación...</p>
        </div>
      )}

      {/* ── WiFi input ── */}
      {step === "wifi_input" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <WifiOff className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Red WiFi</p>
              <p className="text-xs text-neutral-500">
                El nombre de la red WiFi no se puede obtener automáticamente
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {!noWifi && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ssid" className="text-sm font-medium text-neutral-700">
                  Nombre de tu red WiFi (SSID)
                </label>
                <input
                  id="ssid"
                  type="text"
                  placeholder="Ej: ReparaTego_WiFi"
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={noWifi}
                onChange={(e) => setNoWifi(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">No estoy en WiFi</span>
            </label>

            {noWifi && (
              <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                Sin WiFi, solo se validará tu ubicación GPS. El admin revisará el marcado.
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirmarWifi}
              disabled={!noWifi && !wifiSSID.trim()}
              className="mt-1 w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar {tipoEvento === "ENTRADA" ? "entrada" : "salida"}
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="w-full rounded-xl py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Sending ── */}
      {step === "sending" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-neutral-600">Registrando marcado...</p>
        </div>
      )}

      {/* ── Result ── */}
      {step === "result" && resultado && (
        <button
          type="button"
          onClick={handleNuevoMarcado}
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Aceptar
        </button>
      )}
    </div>
  );
}
