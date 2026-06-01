import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { PortalServicio } from "../lib/portal-api";
import { portalApi } from "../lib/portal-api";
import { ESTADOS_CON_COTIZACION, estadoBadgeClass, estadoLabel } from "../lib/portal-estados";

// ─── T&C version and text (R17) ──────────────────────────────────────────────

const TC_VERSION = "v1.0-2025-01";
const TC_TEXTO = `Al aceptar, confirmas que:
1. Autorizas al taller ReparaTego a inspeccionar y evaluar tu equipo.
2. Reconoces que el costo de revisión (S/ {costo}) es cobrado independientemente del resultado.
3. El diagnóstico y presupuesto serán comunicados por este medio antes de iniciar cualquier reparación.
4. Los datos de este equipo serán tratados conforme a nuestra política de privacidad.

Esta aceptación queda registrada con fecha, hora e IP para cumplimiento del Código de Protección al Consumidor (INDECOPI).`;

export function PortalServicioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal", "servicio", id],
    queryFn: () => portalApi.getServicio(id as string),
    staleTime: 10_000,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-48 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-32 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-danger-500" />
        <p className="text-sm text-neutral-600">No se pudo cargar el servicio.</p>
        <Link to="/portal/mis-equipos" className="text-sm text-primary-600 underline">
          Volver a mis equipos
        </Link>
      </div>
    );
  }

  const servicio = data.data;

  function onEstadoCambiado() {
    qc.invalidateQueries({ queryKey: ["portal", "servicio", id] });
    qc.invalidateQueries({ queryKey: ["portal", "mis-equipos"] });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis equipos
      </button>

      {/* Header card */}
      <ServicioHeader servicio={servicio} />

      {/* Estado-specific views */}
      {servicio.estado === "VALIDACION" && (
        <ValidacionView servicio={servicio} onDone={onEstadoCambiado} />
      )}
      {servicio.estado === "COTIZADO" && (
        <CotizadoView servicio={servicio} onDone={onEstadoCambiado} />
      )}
      {["REPARADO", "AVISADO"].includes(servicio.estado) && <ListoView servicio={servicio} />}
      {["ENTREGADO"].includes(servicio.estado) && <EntregadoView servicio={servicio} />}
      {["DEVOLUCION", "SIN_REPARACION"].includes(servicio.estado) && (
        <DevolucionView servicio={servicio} />
      )}
      {["RECIBIDO", "REVISION", "DIAG_EXTERNO", "APROBADO", "AGREGAR_SKU", "PRIORIDAD"].includes(
        servicio.estado
      ) && <ProgresoView servicio={servicio} />}

      {/* Diagnostic + cotizacion (shared across varios estados) */}
      {ESTADOS_CON_COTIZACION.has(servicio.estado) && <DiagnosticoSection servicio={servicio} />}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function ServicioHeader({ servicio }: { servicio: PortalServicio }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-mono text-neutral-400">{servicio.codigo}</p>
          <p className="font-semibold text-neutral-900">{servicio.producto_nombre ?? "Equipo"}</p>
          <p className="text-xs text-neutral-500">
            {[servicio.marca_nombre, servicio.categoria_nombre].filter(Boolean).join(" · ")}
          </p>
          {servicio.numero_serie && (
            <p className="text-xs text-neutral-400">S/N: {servicio.numero_serie}</p>
          )}
        </div>
        {servicio.imagenes_instancia[0] ? (
          <img
            src={servicio.imagenes_instancia[0].url}
            alt={servicio.producto_nombre ?? "Equipo"}
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
            <Cpu className="h-7 w-7 text-neutral-400" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoBadgeClass(servicio.estado)}`}
        >
          {estadoLabel(servicio.estado)}
        </span>
        <span className="text-xs text-neutral-400">
          Actualizado: {new Date(servicio.updated_at).toLocaleDateString("es-PE")}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-0.5">
        <p className="text-xs text-neutral-600">
          <span className="font-medium">Falla reportada:</span> {servicio.falla_ingreso}
        </p>
        <p className="text-xs text-neutral-500">
          Costo de revisión: <span className="font-medium">S/ {servicio.costo_revision}</span>
        </p>
      </div>
    </div>
  );
}

// ─── G4: VALIDACION view ─────────────────────────────────────────────────────

function ValidacionView({ servicio, onDone }: { servicio: PortalServicio; onDone: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textoMostrado = TC_TEXTO.replace("{costo}", servicio.costo_revision);

  const mutation = useMutation({
    mutationFn: () =>
      portalApi.aceptarValidacion(servicio.id, {
        texto_mostrado: textoMostrado,
        documento_version: TC_VERSION,
      }),
    onSuccess: () => {
      setSubmitted(true);
      onDone();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al procesar");
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="font-medium text-green-800">¡Validación aceptada!</p>
        <p className="text-sm text-green-700">El técnico comenzará la revisión de tu equipo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="font-medium text-amber-900 text-sm">Autorización requerida</p>
      </div>
      <p className="text-sm text-amber-800">
        Para que el técnico pueda revisar tu equipo, necesitamos tu autorización. Léela con
        atención:
      </p>

      <div className="max-h-48 overflow-y-auto rounded-lg bg-white p-4 text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap border border-amber-200">
        {textoMostrado}
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-amber-400 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-amber-900">
          He leído y acepto las condiciones de revisión de mi equipo
        </span>
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-danger-600">{error}</div>
      )}

      <button
        type="button"
        disabled={!accepted || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Procesando..." : "Autorizar revisión"}
      </button>

      <p className="text-center text-xs text-amber-700">
        Versión del documento: <span className="font-mono">{TC_VERSION}</span>
      </p>
    </div>
  );
}

// ─── G5: COTIZADO view ───────────────────────────────────────────────────────

const PRESUPUESTO_TEXTO = `Declaro haber revisado el presupuesto de reparación detallado arriba y acepto los términos del servicio. Entiendo que el costo puede variar si se encuentran daños adicionales durante la reparación, y que seré notificado antes de proceder.

Esta aceptación queda registrada con fecha, hora e IP para cumplimiento del Código de Protección al Consumidor (INDECOPI).`;

const PRESUPUESTO_VERSION = "v1.0-2025-01";

function CotizadoView({ servicio, onDone }: { servicio: PortalServicio; onDone: () => void }) {
  const [preventivoAccepted, setPreventivoAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cot = servicio.cotizacion;
  const tienePreventivo =
    cot?.items.some((i) => i.es_preventivo) && Number(cot.total_preventivo) > 0;

  const mutation = useMutation({
    mutationFn: () =>
      portalApi.aceptarPresupuesto(servicio.id, {
        preventivo_accepted: preventivoAccepted,
        texto_mostrado: PRESUPUESTO_TEXTO,
        documento_version: PRESUPUESTO_VERSION,
      }),
    onSuccess: () => {
      setSubmitted(true);
      onDone();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al procesar");
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="font-medium text-green-800">¡Presupuesto aceptado!</p>
        <p className="text-sm text-green-700">El técnico comenzará la reparación de tu equipo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cotización items */}
      {cot && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-neutral-500" />
            <p className="font-medium text-neutral-900 text-sm">Presupuesto de reparación</p>
          </div>

          <div className="flex flex-col gap-2">
            {cot.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 rounded-lg p-3 text-sm ${
                  item.es_preventivo ? "bg-blue-50" : "bg-neutral-50"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-neutral-900">{item.descripcion}</p>
                  <p className="text-xs text-neutral-500">
                    {item.cantidad} × S/ {item.precio_unitario}
                    {item.es_preventivo && (
                      <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        Preventivo
                      </span>
                    )}
                  </p>
                </div>
                <p className="flex-shrink-0 font-medium text-neutral-900">S/ {item.subtotal}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-1 border-t border-neutral-200 pt-3">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Correctivo</span>
              <span>S/ {cot.total_correctivo}</span>
            </div>
            {tienePreventivo && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Preventivo</span>
                <span>S/ {cot.total_preventivo}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold text-neutral-900">
              <span>Total</span>
              <span>S/ {cot.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preventivo choice */}
      {tienePreventivo && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="mb-2 font-medium text-blue-900 text-sm">Mantenimiento preventivo</p>
          <p className="mb-3 text-xs text-blue-800">
            Te recomendamos incluir el mantenimiento preventivo para prolongar la vida útil de tu
            equipo. ¿Deseas incluirlo?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreventivoAccepted(true)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                preventivoAccepted
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
              }`}
            >
              Sí, incluir (+S/ {cot?.total_preventivo})
            </button>
            <button
              type="button"
              onClick={() => setPreventivoAccepted(false)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                !preventivoAccepted
                  ? "border-neutral-600 bg-neutral-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              No, solo correctivo
            </button>
          </div>
        </div>
      )}

      {/* Terms + accept */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <p className="mb-2 font-medium text-purple-900 text-sm">Confirmar presupuesto</p>

        <div className="mb-3 max-h-32 overflow-y-auto rounded-lg bg-white p-3 text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap border border-purple-200">
          {PRESUPUESTO_TEXTO}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-purple-400 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-purple-900">
            He revisado el presupuesto y acepto los términos
          </span>
        </label>

        {error && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-danger-600">{error}</div>
        )}

        <button
          type="button"
          disabled={!termsAccepted || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Procesando..." : "Aceptar presupuesto"}
        </button>

        <p className="mt-2 text-center text-xs text-purple-700">
          Versión: <span className="font-mono">{PRESUPUESTO_VERSION}</span>
        </p>
      </div>
    </div>
  );
}

// ─── G6: REPARADO / AVISADO — listo para recoger ─────────────────────────────

function ListoView({ servicio }: { servicio: PortalServicio }) {
  const suc = servicio.sucursal;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <p className="font-medium text-green-900 text-sm">¡Tu equipo está listo!</p>
      </div>
      <p className="text-sm text-green-800">
        Tu equipo ya fue reparado. Puedes pasar a recogerlo en nuestra tienda.
      </p>

      {suc && (
        <div className="rounded-lg bg-white p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-700" />
            <p className="font-medium text-neutral-900 text-sm">{suc.nombre}</p>
          </div>
          {suc.direccion && (
            <p className="text-xs text-neutral-600 mb-1">
              {suc.direccion}
              {suc.distrito ? `, ${suc.distrito}` : ""}
            </p>
          )}
          {suc.telefono && (
            <a
              href={`tel:${suc.telefono}`}
              className="flex items-center gap-1.5 text-xs text-primary-600"
            >
              <Phone className="h-3.5 w-3.5" />
              {suc.telefono}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── G6: ENTREGADO ───────────────────────────────────────────────────────────

function EntregadoView({ servicio }: { servicio: PortalServicio }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-6 text-center">
      <CheckCircle2 className="h-10 w-10 text-teal-600" />
      <p className="font-medium text-teal-900">Equipo entregado</p>
      <p className="text-sm text-teal-800">
        Tu equipo fue entregado exitosamente. ¡Gracias por confiar en ReparaTego!
      </p>
      {servicio.venta_estado && (
        <p className="text-xs text-teal-700">Estado de pago: {servicio.venta_estado}</p>
      )}
    </div>
  );
}

// ─── G6: DEVOLUCION / SIN_REPARACION ─────────────────────────────────────────

function DevolucionView({ servicio }: { servicio: PortalServicio }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-danger-600" />
        <p className="font-medium text-danger-900 text-sm">
          {servicio.estado === "DEVOLUCION" ? "Devolución del equipo" : "Sin reparación posible"}
        </p>
      </div>
      {servicio.motivo_devolucion ? (
        <p className="text-sm text-danger-800">{servicio.motivo_devolucion}</p>
      ) : (
        <p className="text-sm text-danger-800">
          Lo sentimos, no fue posible reparar tu equipo. Por favor comunícate con nosotros para
          coordinar la devolución.
        </p>
      )}
    </div>
  );
}

// ─── G6: En progreso (RECIBIDO, REVISION, DIAG_EXTERNO, APROBADO, AGREGAR_SKU, PRIORIDAD) ──

const PROGRESO_PASOS: { estado: string; label: string }[] = [
  { estado: "RECIBIDO", label: "Recibido" },
  { estado: "REVISION", label: "En revisión" },
  { estado: "COTIZADO", label: "Presupuesto" },
  { estado: "APROBADO", label: "Aprobado" },
  { estado: "REPARADO", label: "Reparado" },
];

const PROGRESO_ORDEN: Record<string, number> = {
  RECIBIDO: 0,
  VALIDACION: 0,
  REVISION: 1,
  DIAG_EXTERNO: 1,
  COTIZADO: 2,
  APROBADO: 3,
  AGREGAR_SKU: 3,
  PRIORIDAD: 3,
  REPARADO: 4,
};

function ProgresoView({ servicio }: { servicio: PortalServicio }) {
  const pasoActual = PROGRESO_ORDEN[servicio.estado] ?? 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-neutral-500" />
        <p className="font-medium text-neutral-900 text-sm">Estado del servicio</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center">
        {PROGRESO_PASOS.map((paso, i) => (
          <div key={paso.estado} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${i <= pasoActual ? "bg-primary-500" : "bg-neutral-200"}`}
                />
              )}
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  i < pasoActual
                    ? "bg-primary-600 text-white"
                    : i === pasoActual
                      ? "border-2 border-primary-600 bg-white text-primary-700"
                      : "border-2 border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {i < pasoActual ? "✓" : i + 1}
              </div>
              {i < PROGRESO_PASOS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${i < pasoActual ? "bg-primary-500" : "bg-neutral-200"}`}
                />
              )}
            </div>
            <p
              className={`mt-1.5 text-center text-xs ${
                i === pasoActual ? "font-medium text-primary-700" : "text-neutral-400"
              }`}
            >
              {paso.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-neutral-600">{estadoLabel(servicio.estado)}</p>
    </div>
  );
}

// ─── Diagnóstico + evidencias + cotización (info only) ───────────────────────

function DiagnosticoSection({ servicio }: { servicio: PortalServicio }) {
  const hasDiag = servicio.diagnostico_tecnico || servicio.solucion;
  const hasEvidencias = servicio.evidencias.length > 0;

  if (!hasDiag && !hasEvidencias) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-neutral-500" />
        <p className="font-medium text-neutral-900 text-sm">Diagnóstico técnico</p>
      </div>

      {servicio.diagnostico_tecnico && (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1">Problema encontrado</p>
          <p className="text-sm text-neutral-800 leading-relaxed">{servicio.diagnostico_tecnico}</p>
        </div>
      )}

      {servicio.solucion && (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1">Solución propuesta</p>
          <p className="text-sm text-neutral-800 leading-relaxed">{servicio.solucion}</p>
        </div>
      )}

      {hasEvidencias && (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">Evidencias fotográficas</p>
          <div className="grid grid-cols-3 gap-2">
            {servicio.evidencias.map((ev) => (
              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={ev.url}
                  alt={ev.descripcion ?? "Evidencia"}
                  className="aspect-square w-full rounded-lg object-cover hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
