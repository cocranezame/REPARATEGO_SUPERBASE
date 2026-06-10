import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import {
  useAsignarSku,
  useCambiarEstado,
  useCreateAceptacion,
  useCreateCotizacion,
  useCreateEvidencia,
  useCreateObservacion,
  useCreateRequerimiento,
  useEliminarSku,
  useEvidencias,
  useHistorial,
  useObservaciones,
  useOrden,
  useRequerimientos,
  useSaveComponentes,
  useSkus,
  useUpdateOrden,
} from "../hooks/useOrdenesServicio";
import { BusquedaPresupuesto } from "../modales/BusquedaPresupuesto";
import type {
  ComponenteOrden,
  EstadoOS,
  OrdenServicioDetalle,
  PresupuestoItem,
} from "../types/orden-servicio";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

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

const ALL_ESTADOS: EstadoOS[] = [
  "VALIDACION",
  "REVISION",
  "DIAG_PRELIMINAR",
  "DIAG_FINAL",
  "COTIZADO",
  "APROBADO",
  "AGREGAR_SKU",
  "PRIORIDAD",
  "REPARADO",
  "AVISADO",
  "ENTREGADO",
  "GARANTIA",
  "DEVOLUCION",
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

// ─── Accordion wrapper ────────────────────────────────────────────────────────

type AccordionProps = {
  title: string;
  hasData: boolean;
  editable: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function Accordion({ title, hasData, editable, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50"
      >
        <div className="flex items-center gap-3">
          {hasData ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-neutral-300" />
          )}
          <span className="text-sm font-semibold text-neutral-800">{title}</span>
          {editable && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
              Editable
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        )}
      </button>
      {open && <div className={`px-5 pb-5 ${editable ? "" : "bg-neutral-50/60"}`}>{children}</div>}
    </div>
  );
}

// ─── Sección 1: Validación ────────────────────────────────────────────────────

function SeccionValidacion({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const aceptacionVal = os.aceptaciones.find((a) => a.tipo === "VALIDACION");

  const [tab, setTab] = useState<"wa" | "manual">("wa");
  const [canal, setCanal] = useState<"TIENDA" | "WHATSAPP">("TIENDA");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateAceptacion();

  const waUrl = `https://reparatego.com/mis-equipos?codigo=${os.codigo}`;
  const waMsg = encodeURIComponent(
    `Hola ${os.cliente_nombre ?? "cliente"}, tu equipo ${os.producto_nombre ?? ""} (${os.codigo}) ha sido recibido. Acepta aquí: ${waUrl}`
  );

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Contraseña obligatoria");
      return;
    }
    if (canal === "WHATSAPP" && !evidenceUrl) {
      setError("Adjunta la captura");
      return;
    }
    try {
      await mutation.mutateAsync({
        ordenId: os.id,
        tipo: "VALIDACION",
        canal_aceptacion: canal === "TIENDA" ? "MANUAL_TIENDA" : "MANUAL_WHATSAPP",
        manual_reason: canal,
        password,
        ...(canal === "WHATSAPP" && evidenceUrl ? { evidence_image_url: evidenceUrl } : {}),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="1. Validación"
      hasData={!!aceptacionVal}
      editable={editable}
      defaultOpen={editable}
    >
      {!editable && aceptacionVal ? (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-neutral-400">Canal</p>
            <p className="font-medium">{aceptacionVal.canal_aceptacion}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Fecha</p>
            <p className="font-medium">{fmtDate(aceptacionVal.accepted_at)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Tipo</p>
            <p className="font-medium">{aceptacionVal.tipo}</p>
          </div>
        </div>
      ) : !editable ? (
        <p className="text-sm text-neutral-400">Sin datos de validación.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex border-b border-neutral-200">
            {(["wa", "manual"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-primary-600 text-primary-700" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                {t === "wa" ? "Enviar por WhatsApp" : "Aprobación manual"}
              </button>
            ))}
          </div>
          {tab === "wa" ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Envía el enlace al cliente para aceptar los términos.
              </p>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 break-all">
                {waUrl}
              </div>
              <a
                href={`https://wa.me/?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </a>
              <p className="text-center text-xs text-neutral-400">
                El estado cambia a REVISIÓN cuando el cliente acepta desde el portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManual} className="space-y-3" noValidate>
              <div className="flex flex-col gap-1">
                <label htmlFor="val-edit-canal" className="text-xs font-medium text-neutral-700">
                  Canal de aprobación
                </label>
                <select
                  id="val-edit-canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as "TIENDA" | "WHATSAPP")}
                  className={INPUT}
                >
                  <option value="TIENDA">En tienda (presencial)</option>
                  <option value="WHATSAPP">Por WhatsApp (captura)</option>
                </select>
              </div>
              {canal === "WHATSAPP" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="val-edit-url" className="text-xs font-medium text-neutral-700">
                    URL captura <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="val-edit-url"
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor="val-edit-pwd" className="text-xs font-medium text-neutral-700">
                  Contraseña del vendedor <span className="text-red-500">*</span>
                </label>
                <input
                  id="val-edit-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>
              {error !== null && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {mutation.isPending ? "Guardando..." : "Aprobar validación → REVISIÓN"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Accordion>
  );
}

// ─── Sección 2: Diagnóstico ───────────────────────────────────────────────────

function SeccionDiagnostico({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const hasData = !!(os.diagnostico_tecnico || os.solucion);

  const [diag, setDiag] = useState(os.diagnostico_tecnico ?? "");
  const [sol, setSol] = useState(os.solucion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const updateOrden = useUpdateOrden();

  async function handleSave() {
    setError(null);
    try {
      await updateOrden.mutateAsync({ id: os.id, diagnostico_tecnico: diag, solucion: sol });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="2. Diagnóstico"
      hasData={hasData}
      editable={editable}
      defaultOpen={editable && !hasData}
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="diag-edit-text" className="text-xs font-medium text-neutral-700">
            Diagnóstico técnico
          </label>
          {editable ? (
            <textarea
              id="diag-edit-text"
              rows={3}
              value={diag}
              onChange={(e) => setDiag(e.target.value)}
              placeholder="Describe el diagnóstico..."
              className={INPUT}
            />
          ) : (
            <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
              {os.diagnostico_tecnico || "—"}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="diag-edit-sol" className="text-xs font-medium text-neutral-700">
            Solución aplicada
          </label>
          {editable ? (
            <textarea
              id="diag-edit-sol"
              rows={3}
              value={sol}
              onChange={(e) => setSol(e.target.value)}
              placeholder="Solución propuesta..."
              className={INPUT}
            />
          ) : (
            <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
              {os.solucion || "—"}
            </p>
          )}
        </div>
        {error !== null && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        {editable && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateOrden.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saved
                ? "¡Guardado!"
                : updateOrden.isPending
                  ? "Guardando..."
                  : "Guardar diagnóstico"}
            </button>
          </div>
        )}
      </div>
    </Accordion>
  );
}

// ─── Sección 3: Componentes ───────────────────────────────────────────────────

function SeccionComponentes({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const hasData = os.componentes.length > 0;

  const { data: compData } = useComponentes({ activo: true, pageSize: 200 });
  const allComps = compData?.data ?? [];

  const [etapa, setEtapa] = useState<"PRELIMINAR" | "FINAL">("FINAL");
  const [compState, setCompState] = useState<Record<string, CompState>>(() =>
    initCompState(os.componentes, "FINAL")
  );
  const [error, setError] = useState<string | null>(null);
  const saveComps = useSaveComponentes();

  function handleEtapaChange(e: "PRELIMINAR" | "FINAL") {
    setEtapa(e);
    setCompState(initCompState(os.componentes, e));
  }

  function handleLeftClick(id: string) {
    setCompState((prev) => {
      const cur = prev[id];
      if (!cur)
        return { ...prev, [id]: { tipo_afectacion: "PREVENTIVO", tipo_accion: "REPARACION" } };
      if (cur.tipo_afectacion === "PREVENTIVO")
        return { ...prev, [id]: { tipo_afectacion: "CORRECTIVO", tipo_accion: cur.tipo_accion } };
      return { ...prev, [id]: null };
    });
  }

  function handleRightClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setCompState((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return {
        ...prev,
        [id]: { ...cur, tipo_accion: cur.tipo_accion === "REPARACION" ? "CAMBIO" : "REPARACION" },
      };
    });
  }

  async function handleSave() {
    setError(null);
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
    try {
      await saveComps.mutateAsync({ ordenId: os.id, etapa, items });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="3. Componentes afectados"
      hasData={hasData}
      editable={editable}
      defaultOpen={false}
    >
      <div className="space-y-4">
        {editable && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-600">Etapa:</span>
            {(["PRELIMINAR", "FINAL"] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleEtapaChange(e)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${etapa === e ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {editable ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs">
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
            {error !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveComps.isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {saveComps.isPending ? "Guardando..." : "Guardar componentes"}
              </button>
            </div>
          </>
        ) : hasData ? (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2">Componente</th>
                  <th className="px-4 py-2 text-center">Etapa</th>
                  <th className="px-4 py-2 text-center">Afectación</th>
                  <th className="px-4 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {os.componentes.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.componente_nombre ?? c.componente_id}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${c.etapa === "PRELIMINAR" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}
                      >
                        {c.etapa}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${c.tipo_afectacion === "PREVENTIVO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
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
        ) : (
          <p className="text-sm text-neutral-400">Sin componentes registrados.</p>
        )}
      </div>
    </Accordion>
  );
}

// ─── Sección 4: Evidencias ────────────────────────────────────────────────────

function SeccionEvidencias({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const { data: evData } = useEvidencias(os.id);
  const evidencias = evData?.data ?? os.evidencias;

  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [etapa, setEtapa] = useState("REVISION");
  const [error, setError] = useState<string | null>(null);
  const addEv = useCreateEvidencia();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setError(null);
    try {
      await addEv.mutateAsync({
        ordenId: os.id,
        url,
        etapa,
        ...(desc ? { descripcion: desc } : {}),
      });
      setUrl("");
      setDesc("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="4. Evidencias"
      hasData={evidencias.length > 0}
      editable={editable}
      defaultOpen={false}
    >
      <div className="space-y-4">
        {evidencias.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evidencias.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-700 truncate">{ev.etapa ?? "—"}</p>
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
        {editable && evidencias.length < 5 && (
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL de imagen *"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              />
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              />
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="REVISION">Revisión</option>
                <option value="DIAG_PRELIMINAR">Diag. Prelim</option>
                <option value="DIAG_FINAL">Diag. Final</option>
              </select>
              <button
                type="submit"
                disabled={!url || addEv.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {error !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
          </form>
        )}
        {!editable && evidencias.length === 0 && (
          <p className="text-sm text-neutral-400">Sin evidencias registradas.</p>
        )}
      </div>
    </Accordion>
  );
}

// ─── Sección 5: Requerimientos ────────────────────────────────────────────────

function SeccionRequerimientos({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const { data: reqData } = useRequerimientos(os.id);
  const reqs = reqData?.data ?? os.requerimientos;

  const [desc, setDesc] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [obs, setObs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addReq = useCreateRequerimiento();

  const hasData = reqs.length > 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!desc) return;
    setError(null);
    try {
      await addReq.mutateAsync({
        ordenId: os.id,
        descripcion: desc,
        cantidad: 1,
        ...(imgUrl ? { imagen_url: imgUrl } : {}),
        ...(obs ? { observacion: obs } : {}),
      });
      setDesc("");
      setImgUrl("");
      setObs("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion title="5. Requerimientos" hasData={hasData} editable={editable} defaultOpen={false}>
      <div className="space-y-4">
        {reqs.length > 0 && (
          <div className="space-y-2">
            {reqs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="text-neutral-700">{r.descripcion}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${r.estado === "PENDIENTE" ? "bg-yellow-100 text-yellow-700" : r.estado === "ATENDIDO" ? "bg-green-100 text-green-700" : r.estado === "EN_COMPRA" ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        )}
        {editable && (
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción del repuesto *"
                className="col-span-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              />
              <input
                type="url"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="URL imagen (opcional)"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              />
              <input
                type="text"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observación (opcional)"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            {error !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            <button
              type="submit"
              disabled={!desc || addReq.isPending}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Agregar requerimiento
            </button>
          </form>
        )}
        {!hasData && !editable && <p className="text-sm text-neutral-400">Sin requerimientos.</p>}
      </div>
    </Accordion>
  );
}

// ─── Sección 6: Cotización ────────────────────────────────────────────────────

type LocalItem = {
  key: string;
  tipo_item: "REPUESTO" | "SERVICIO" | "MANUAL";
  producto_id?: string;
  componente_id?: string;
  descripcion_manual?: string;
  display: string;
  cantidad: number;
  precio_unitario: number;
  es_preventivo: boolean;
};

type BuscarCtx = { tipo: "REPUESTO" | "SERVICIO"; componenteId?: string; esPreventivo: boolean };

function SeccionCotizacion({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const hasCot = os.cotizacion.items.length > 0;

  const [items, setItems] = useState<LocalItem[]>([]);
  const [buscarCtx, setBuscarCtx] = useState<BuscarCtx | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  const [manualPrecio, setManualPrecio] = useState("");
  const [manualCant, setManualCant] = useState("1");
  const [manualPrev, setManualPrev] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCotizacion = useCreateCotizacion();

  const finalComps = os.componentes.filter((c) => c.etapa === "FINAL");

  function addFromPresupuesto(item: PresupuestoItem, esPreventivo: boolean) {
    setItems((prev) => [
      ...prev,
      {
        key: `${item.id}-${Date.now()}`,
        tipo_item: item.tipo as "REPUESTO" | "SERVICIO",
        producto_id: item.id,
        ...(buscarCtx?.componenteId ? { componente_id: buscarCtx.componenteId } : {}),
        display: item.nombre,
        cantidad: 1,
        precio_unitario: Number(item.precio_venta),
        es_preventivo: esPreventivo,
      },
    ]);
  }

  function addManual() {
    if (!manualDesc || !manualPrecio) return;
    setItems((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        tipo_item: "MANUAL",
        descripcion_manual: manualDesc,
        display: manualDesc,
        cantidad: Math.max(1, parseInt(manualCant, 10) || 1),
        precio_unitario: parseFloat(manualPrecio),
        es_preventivo: manualPrev,
      },
    ]);
    setManualDesc("");
    setManualPrecio("");
    setManualCant("1");
    setManualPrev(false);
    setShowManual(false);
  }

  function updateCant(key: string, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i))
    );
  }

  const totCorr = items
    .filter((i) => !i.es_preventivo)
    .reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  const totPrev = items
    .filter((i) => i.es_preventivo)
    .reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  async function handleRegistrar() {
    if (items.length === 0) {
      setError("Agrega al menos un ítem");
      return;
    }
    setError(null);
    try {
      await createCotizacion.mutateAsync({
        ordenId: os.id,
        items: items.map((i) => ({
          tipo_item: i.tipo_item,
          ...(i.producto_id ? { producto_id: i.producto_id } : {}),
          ...(i.componente_id ? { componente_id: i.componente_id } : {}),
          ...(i.descripcion_manual ? { descripcion_manual: i.descripcion_manual } : {}),
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          es_preventivo: i.es_preventivo,
        })),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const isPending = createCotizacion.isPending;

  return (
    <>
      <Accordion
        title="6. Cotización / Presupuesto"
        hasData={hasCot}
        editable={editable}
        defaultOpen={editable}
      >
        <div className="space-y-4">
          {hasCot && (
            <>
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">Ítem</th>
                      <th className="px-4 py-2 text-center">Prev</th>
                      <th className="px-4 py-2 text-right">Cant</th>
                      <th className="px-4 py-2 text-right">P.U.</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {os.cotizacion.items.map((item) => (
                      <tr key={item.id} className={item.es_preventivo ? "bg-green-50" : ""}>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${item.tipo_item === "REPUESTO" ? "bg-blue-100 text-blue-700" : item.tipo_item === "SERVICIO" ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-600"}`}
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
                <div className="flex gap-6">
                  <span className="text-yellow-700">Correctivo</span>
                  <span>S/ {Number(os.cotizacion.total_correctivo).toFixed(2)}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-green-700">Preventivo</span>
                  <span>S/ {Number(os.cotizacion.total_preventivo).toFixed(2)}</span>
                </div>
                <div className="flex gap-6 text-base font-bold">
                  <span>Total</span>
                  <span>S/ {Number(os.cotizacion.total).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {editable && (
            <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-semibold text-neutral-700">Armar nueva cotización</p>
              {finalComps.length > 0 && (
                <div className="space-y-1">
                  {finalComps.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${compColor({ tipo_afectacion: c.tipo_afectacion, tipo_accion: c.tipo_accion })}`}
                      >
                        {c.componente_nombre ?? c.componente_id} —{" "}
                        {c.tipo_afectacion === "PREVENTIVO"
                          ? "Preventivo"
                          : c.tipo_accion === "CAMBIO"
                            ? "Cambio"
                            : "Reparación"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setBuscarCtx({
                            tipo: c.tipo_accion === "CAMBIO" ? "REPUESTO" : "SERVICIO",
                            componenteId: c.componente_id,
                            esPreventivo: c.tipo_afectacion === "PREVENTIVO",
                          })
                        }
                        className="whitespace-nowrap text-xs text-primary-600 hover:underline"
                      >
                        + {c.tipo_accion === "CAMBIO" ? "Repuesto" : "Servicio"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBuscarCtx({ tipo: "REPUESTO", esPreventivo: false })}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                >
                  + Repuesto
                </button>
                <button
                  type="button"
                  onClick={() => setBuscarCtx({ tipo: "SERVICIO", esPreventivo: false })}
                  className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-700 hover:bg-orange-100"
                >
                  + Servicio
                </button>
                <button
                  type="button"
                  onClick={() => setShowManual((v) => !v)}
                  className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200"
                >
                  + Manual
                </button>
              </div>
              {showManual && (
                <div className="grid grid-cols-12 gap-2 items-end rounded-lg border border-neutral-200 bg-amber-50 p-3">
                  <input
                    type="text"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    placeholder="Descripción *"
                    className="col-span-5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={manualPrecio}
                    onChange={(e) => setManualPrecio(e.target.value)}
                    placeholder="Precio"
                    className="col-span-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={manualCant}
                    onChange={(e) => setManualCant(e.target.value)}
                    placeholder="Cant"
                    className="col-span-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    min="1"
                  />
                  <label className="col-span-2 flex cursor-pointer items-center gap-1 text-xs text-neutral-700">
                    <input
                      type="checkbox"
                      checked={manualPrev}
                      onChange={(e) => setManualPrev(e.target.checked)}
                      className="rounded"
                    />
                    Prev
                  </label>
                  <button
                    type="button"
                    onClick={addManual}
                    disabled={!manualDesc || !manualPrecio}
                    className="col-span-2 rounded-lg bg-neutral-700 px-2 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              )}
              {items.length > 0 && (
                <>
                  <table className="w-full text-sm rounded-lg overflow-hidden border border-neutral-200">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Ítem</th>
                        <th className="px-3 py-2 text-right">Cant</th>
                        <th className="px-3 py-2 text-right">Precio</th>
                        <th className="px-3 py-2 text-right">Sub</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {items.map((item) => (
                        <tr key={item.key} className={item.es_preventivo ? "bg-green-50" : ""}>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${item.tipo_item === "REPUESTO" ? "bg-blue-100 text-blue-700" : item.tipo_item === "SERVICIO" ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-600"}`}
                            >
                              {item.tipo_item === "REPUESTO"
                                ? "Rep"
                                : item.tipo_item === "SERVICIO"
                                  ? "Serv"
                                  : "Man"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-neutral-800">{item.display}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => updateCant(item.key, -1)}
                                className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center">{item.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => updateCant(item.key, 1)}
                                className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            S/ {item.precio_unitario.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) => prev.filter((i) => i.key !== item.key))
                              }
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end gap-4 text-sm">
                    <span className="text-yellow-700">Correctivo: S/ {totCorr.toFixed(2)}</span>
                    <span className="text-green-700">Preventivo: S/ {totPrev.toFixed(2)}</span>
                    <span className="font-semibold">
                      Total: S/ {(totCorr + totPrev).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {error !== null && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRegistrar}
                  disabled={isPending || items.length === 0}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {isPending ? "Guardando..." : "Guardar cotización"}
                </button>
              </div>
            </div>
          )}

          {!hasCot && !editable && (
            <p className="text-sm text-neutral-400">Sin cotización registrada.</p>
          )}
        </div>
      </Accordion>

      {buscarCtx && (
        <BusquedaPresupuesto
          tipo={buscarCtx.tipo}
          componenteId={buscarCtx.componenteId}
          esPreventivo={buscarCtx.esPreventivo}
          onSelect={(item, prev) => {
            addFromPresupuesto(item, prev);
            setBuscarCtx(null);
          }}
          onClose={() => setBuscarCtx(null)}
        />
      )}
    </>
  );
}

// ─── Sección 7: Aprobación presupuesto ───────────────────────────────────────

function SeccionAprobacion({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const aceptacionPres = os.aceptaciones.find((a) => a.tipo === "PRESUPUESTO");
  const hasData = !!aceptacionPres;
  const hasPreventivo = Number(os.cotizacion.total_preventivo) > 0;

  const [tab, setTab] = useState<"wa" | "manual">("wa");
  const [canal, setCanal] = useState<"TIENDA" | "WHATSAPP">("TIENDA");
  const [prevAccepted, setPrevAccepted] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateAceptacion();

  const waUrl = `https://reparatego.com/mis-equipos?codigo=${os.codigo}`;
  const waMsg = encodeURIComponent(
    `Hola ${os.cliente_nombre ?? "cliente"}, tu cotización (${os.codigo}) está lista. Revísala: ${waUrl}`
  );

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Contraseña obligatoria");
      return;
    }
    if (canal === "WHATSAPP" && !evidenceUrl) {
      setError("Adjunta la captura");
      return;
    }
    try {
      await mutation.mutateAsync({
        ordenId: os.id,
        tipo: "PRESUPUESTO",
        canal_aceptacion: canal === "TIENDA" ? "MANUAL_TIENDA" : "MANUAL_WHATSAPP",
        manual_reason: canal,
        password,
        preventivo_accepted: hasPreventivo ? prevAccepted : undefined,
        ...(canal === "WHATSAPP" && evidenceUrl ? { evidence_image_url: evidenceUrl } : {}),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="7. Aprobación de presupuesto"
      hasData={hasData}
      editable={editable}
      defaultOpen={editable}
    >
      {!editable && hasData ? (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span className="text-yellow-700">
              Correctivo: S/ {Number(os.cotizacion.total_correctivo).toFixed(2)}
            </span>
            {hasPreventivo && (
              <span className="text-green-700">
                Preventivo: S/ {Number(os.cotizacion.total_preventivo).toFixed(2)}
              </span>
            )}
            <span className="font-semibold">
              Total: S/ {Number(os.cotizacion.total).toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-neutral-400">Canal</p>
              <p className="font-medium">{aceptacionPres.canal_aceptacion}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Fecha</p>
              <p className="font-medium">{fmtDate(aceptacionPres.accepted_at)}</p>
            </div>
            {aceptacionPres.preventivo_accepted !== undefined && (
              <div>
                <p className="text-xs text-neutral-400">Prev. aceptado</p>
                <p className="font-medium">{aceptacionPres.preventivo_accepted ? "Sí" : "No"}</p>
              </div>
            )}
          </div>
        </div>
      ) : !editable ? (
        <p className="text-sm text-neutral-400">Sin aprobación registrada.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-yellow-700">
              Correctivo: S/ {Number(os.cotizacion.total_correctivo).toFixed(2)}
            </span>
            {hasPreventivo && (
              <span className="text-green-700">
                Preventivo: S/ {Number(os.cotizacion.total_preventivo).toFixed(2)}
              </span>
            )}
            <span className="font-semibold">
              Total: S/ {Number(os.cotizacion.total).toFixed(2)}
            </span>
          </div>
          <div className="flex border-b border-neutral-200">
            {(["wa", "manual"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-primary-600 text-primary-700" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                {t === "wa" ? "Enviar por WhatsApp" : "Aprobación manual"}
              </button>
            ))}
          </div>
          {tab === "wa" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 break-all">
                {waUrl}
              </div>
              <a
                href={`https://wa.me/?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </a>
              <p className="text-center text-xs text-neutral-400">
                El estado cambia a APROBADO cuando el cliente acepta desde el portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManual} className="space-y-3" noValidate>
              <div className="flex flex-col gap-1">
                <label htmlFor="apr-edit-canal" className="text-xs font-medium text-neutral-700">
                  Canal
                </label>
                <select
                  id="apr-edit-canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as "TIENDA" | "WHATSAPP")}
                  className={INPUT}
                >
                  <option value="TIENDA">En tienda</option>
                  <option value="WHATSAPP">Por WhatsApp (captura)</option>
                </select>
              </div>
              {hasPreventivo && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-green-800">
                    <input
                      type="checkbox"
                      checked={prevAccepted}
                      onChange={(e) => setPrevAccepted(e.target.checked)}
                      className="rounded"
                    />
                    Cliente aprueba ítems preventivos (S/{" "}
                    {Number(os.cotizacion.total_preventivo).toFixed(2)})
                  </label>
                </div>
              )}
              {canal === "WHATSAPP" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="apr-edit-url" className="text-xs font-medium text-neutral-700">
                    URL captura <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="apr-edit-url"
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor="apr-edit-pwd" className="text-xs font-medium text-neutral-700">
                  Contraseña del vendedor <span className="text-red-500">*</span>
                </label>
                <input
                  id="apr-edit-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>
              {error !== null && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {mutation.isPending ? "Guardando..." : "Aprobar presupuesto → APROBADO"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Accordion>
  );
}

// ─── Sección 8: SKUs ──────────────────────────────────────────────────────────

function SeccionSkus({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const { data: skusData } = useSkus(os.id);
  const skus = skusData?.data ?? os.skus;
  const hasData = skus.length > 0;

  const [loteId, setLoteId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState<string | null>(null);

  const asignar = useAsignarSku();
  const eliminar = useEliminarSku();
  const cambiarEstado = useCambiarEstado();

  const repuestoItems = os.cotizacion.items.filter((i) => i.tipo_item === "REPUESTO");

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault();
    if (!loteId || !productoId || !precio) {
      setError("Lote, producto y precio son obligatorios");
      return;
    }
    setError(null);
    try {
      await asignar.mutateAsync({
        ordenId: os.id,
        lote_id: loteId,
        producto_id: productoId,
        cantidad: Math.max(1, parseInt(cantidad, 10) || 1),
        precio_presupuesto: parseFloat(precio),
      });
      setLoteId("");
      setProductoId("");
      setCantidad("1");
      setPrecio("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleContinuar(estado: "PRIORIDAD" | "REPARADO") {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: os.id, estado });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion
      title="8. SKUs asignados"
      hasData={hasData}
      editable={editable}
      defaultOpen={editable}
    >
      <div className="space-y-4">
        {repuestoItems.length > 0 && editable && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-600">Repuestos en cotización:</p>
            {repuestoItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs"
              >
                <span className="font-medium text-neutral-800">
                  {item.producto_nombre ?? "Repuesto"}
                </span>
                <div className="flex gap-3 text-neutral-500">
                  <span>Cant: {item.cantidad}</span>
                  <span>S/ {Number(item.precio_unitario).toFixed(2)}</span>
                  {item.producto_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductoId(item.producto_id ?? "");
                        setPrecio(Number(item.precio_unitario).toFixed(2));
                        setCantidad(String(item.cantidad));
                      }}
                      className="text-primary-600 hover:underline"
                    >
                      Usar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {skus.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Lote</th>
                  <th className="px-4 py-2 text-right">Cant</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2">Estado</th>
                  {editable && <th className="px-2 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {skus.map((sku) => (
                  <tr key={sku.id}>
                    <td className="px-4 py-2">{sku.producto_nombre ?? sku.producto_id}</td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-500">{sku.lote_id}</td>
                    <td className="px-4 py-2 text-right">{sku.cantidad}</td>
                    <td className="px-4 py-2 text-right">
                      S/ {Number(sku.precio_presupuesto).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{sku.estado}</td>
                    {editable && (
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => eliminar.mutate({ ordenId: os.id, skuId: sku.id })}
                          disabled={eliminar.isPending}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editable && (
          <form
            onSubmit={handleAsignar}
            className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 p-4"
          >
            <p className="col-span-2 text-xs font-semibold text-neutral-700">Asignar SKU / Lote</p>
            <div className="flex flex-col gap-1">
              <label htmlFor="sku-edit-lote" className="text-xs font-medium text-neutral-700">
                ID Lote <span className="text-red-500">*</span>
              </label>
              <input
                id="sku-edit-lote"
                type="text"
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                placeholder="LOT-00001"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sku-edit-prod" className="text-xs font-medium text-neutral-700">
                ID Producto <span className="text-red-500">*</span>
              </label>
              <input
                id="sku-edit-prod"
                type="text"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                placeholder="UUID"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sku-edit-cant" className="text-xs font-medium text-neutral-700">
                Cantidad
              </label>
              <input
                id="sku-edit-cant"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sku-edit-precio" className="text-xs font-medium text-neutral-700">
                Precio presupuesto <span className="text-red-500">*</span>
              </label>
              <input
                id="sku-edit-precio"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={INPUT}
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={asignar.isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {asignar.isPending ? "Asignando..." : "Asignar SKU"}
              </button>
            </div>
          </form>
        )}

        {error !== null && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        {editable && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleContinuar("PRIORIDAD")}
              disabled={cambiarEstado.isPending}
              className="rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-60"
            >
              → Prioridad
            </button>
            <button
              type="button"
              onClick={() => handleContinuar("REPARADO")}
              disabled={cambiarEstado.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              → Reparado
            </button>
          </div>
        )}

        {!hasData && !editable && <p className="text-sm text-neutral-400">Sin SKUs asignados.</p>}
      </div>
    </Accordion>
  );
}

// ─── Sección 9: Devolución ────────────────────────────────────────────────────

const MOTIVOS = [
  { value: "CLIENTE_CANCELO", label: "Cliente canceló" },
  { value: "SIN_SOLUCION", label: "Sin solución técnica" },
  { value: "COSTO_ALTO", label: "Costo muy alto" },
  { value: "OTRO", label: "Otro" },
];

function SeccionDevolucion({ os }: { os: OrdenServicioDetalle }) {
  const editable = true;
  const isDev = os.estado === "DEVOLUCION";
  const hasData = isDev || !!os.motivo_devolucion;

  const [motivo, setMotivo] = useState("CLIENTE_CANCELO");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cambiarEstado = useCambiarEstado();

  async function handleDevolucion() {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({
        id: os.id,
        estado: "DEVOLUCION",
        motivo_devolucion: motivo,
        ...(observacion ? { observacion } : {}),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!editable && !hasData) return null;

  return (
    <Accordion title="9. Devolución" hasData={hasData} editable={editable} defaultOpen={isDev}>
      {isDev || (!editable && hasData) ? (
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-neutral-400">Motivo</p>
            <p className="font-medium">
              {MOTIVOS.find((m) => m.value === os.motivo_devolucion)?.label ??
                os.motivo_devolucion ??
                "—"}
            </p>
          </div>
          {os.venta_id && (
            <Link
              to={`/ventas/${os.venta_id}`}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver venta de revisión
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Se generará una mini-venta por el costo de revisión (S/{" "}
            {Number(os.costo_revision).toFixed(2)}).
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dev-edit-motivo" className="text-xs font-medium text-neutral-700">
              Motivo
            </label>
            <select
              id="dev-edit-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={INPUT}
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dev-edit-obs" className="text-xs font-medium text-neutral-700">
              Observación (opcional)
            </label>
            <input
              id="dev-edit-obs"
              type="text"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalle del motivo..."
              className={INPUT}
            />
          </div>
          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDevolucion}
              disabled={cambiarEstado.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {cambiarEstado.isPending ? "Procesando..." : "Confirmar devolución + Cobro revisión"}
            </button>
          </div>
        </div>
      )}
    </Accordion>
  );
}

// ─── Sección 10: Observaciones ────────────────────────────────────────────────

function SeccionObservaciones({ os }: { os: OrdenServicioDetalle }) {
  const { data: obsData } = useObservaciones(os.id);
  const observaciones = obsData?.data ?? os.observaciones;
  const hasData = observaciones.length > 0;

  const [text, setText] = useState("");
  const [etapa, setEtapa] = useState("GENERAL");
  const [error, setError] = useState<string | null>(null);
  const createObs = useCreateObservacion();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text) return;
    setError(null);
    try {
      await createObs.mutateAsync({ ordenId: os.id, etapa, texto: text });
      setText("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Accordion title="10. Observaciones" hasData={hasData} editable={true} defaultOpen={false}>
      <div className="space-y-3">
        {observaciones.length > 0 && (
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
        )}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Agregar observación..."
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
          />
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
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
            disabled={!text || createObs.isPending}
            className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
        {error !== null && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Accordion>
  );
}

// ─── Sección 11: Historial ────────────────────────────────────────────────────

function SeccionHistorial({ os }: { os: OrdenServicioDetalle }) {
  const { data: histData } = useHistorial(os.id);
  const historial = histData?.data ?? os.historial;

  return (
    <Accordion
      title="11. Historial de estados"
      hasData={historial.length > 0}
      editable={false}
      defaultOpen={false}
    >
      <div className="space-y-2">
        {historial.length === 0 ? (
          <p className="text-sm text-neutral-400">Sin historial.</p>
        ) : (
          historial.map((h) => (
            <div
              key={h.id}
              className="flex items-start justify-between rounded-lg border border-neutral-100 px-4 py-3 text-sm"
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
    </Accordion>
  );
}

// ─── Sección 12: Periféricos ──────────────────────────────────────────────────

function SeccionPerifericosSoloLectura(_: { os: OrdenServicioDetalle }) {
  return (
    <Accordion title="12. Periféricos" hasData={false} editable={false} defaultOpen={false}>
      <p className="text-sm text-neutral-400">
        Los periféricos se registran al crear la orden. Consulta el detalle en el kanban para
        verlos.
      </p>
    </Accordion>
  );
}

// ─── Sección 13: Aceptaciones ─────────────────────────────────────────────────

function SeccionAceptaciones({ os }: { os: OrdenServicioDetalle }) {
  const hasData = os.aceptaciones.length > 0;

  return (
    <Accordion title="13. Aceptaciones" hasData={hasData} editable={false} defaultOpen={false}>
      <div className="space-y-3">
        {!hasData ? (
          <p className="text-sm text-neutral-400">Sin aceptaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Canal</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2 text-center">Prev. aceptado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {os.aceptaciones.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-medium">{a.tipo}</td>
                    <td className="px-4 py-2 text-xs text-neutral-600">{a.canal_aceptacion}</td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{fmtDate(a.accepted_at)}</td>
                    <td className="px-4 py-2 text-center text-xs">
                      {a.preventivo_accepted === undefined
                        ? "—"
                        : a.preventivo_accepted
                          ? "Sí"
                          : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Accordion>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function OrdenServicioEditPage() {
  const { id } = useParams<{ id: string }>();
  const osId = id ?? "";
  const navigate = useNavigate();

  const { data, isLoading, isError } = useOrden(osId);
  const os = data?.data;

  const [estadoTarget, setEstadoTarget] = useState<EstadoOS | "">("");
  const [cambioError, setCambioError] = useState<string | null>(null);

  const cambiarEstado = useCambiarEstado();

  async function handleCambiarEstado() {
    if (!os || !estadoTarget) return;
    setCambioError(null);
    try {
      await cambiarEstado.mutateAsync({ id: os.id, estado: estadoTarget });
      setEstadoTarget("");
    } catch (err) {
      setCambioError((err as Error).message);
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

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <span className="text-neutral-300">/</span>
        <Link to="/servicios" className="text-sm text-neutral-500 hover:text-neutral-800">
          Servicios
        </Link>
        <span className="text-neutral-300">/</span>
        <Link to={`/servicios/${osId}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          {os.codigo}
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium text-neutral-900">Editar</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900 font-mono">{os.codigo}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[os.estado]}`}
              >
                {os.estado.replace(/_/g, " ")}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${os.canal === "DOMICILIO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
              >
                {os.canal}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-2 sm:gap-x-8">
              <p className="text-neutral-500">
                Cliente:{" "}
                <Link
                  to={`/clientes/${os.cliente_id}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {os.cliente_nombre ?? "—"}
                </Link>
              </p>
              <p className="text-neutral-500">
                Producto:{" "}
                <span className="font-medium text-neutral-800">
                  {os.producto_nombre ?? "—"}
                  {os.numero_serie ? ` · S/N: ${os.numero_serie}` : ""}
                </span>
              </p>
              <p className="text-neutral-500">
                Falla: <span className="text-neutral-700">{os.falla_ingreso}</span>
              </p>
              <p className="text-neutral-500">
                Costo revisión:{" "}
                <span className="font-medium">S/ {Number(os.costo_revision).toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[220px]">
            {/* Cambiar estado — cualquier estado disponible */}
            <div className="flex flex-col gap-1">
              <label htmlFor="hdr-estado" className="text-xs font-medium text-neutral-600">
                Cambiar estado
              </label>
              <div className="flex gap-2">
                <select
                  id="hdr-estado"
                  value={estadoTarget}
                  onChange={(e) => setEstadoTarget(e.target.value as EstadoOS | "")}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {ALL_ESTADOS.filter((e) => e !== os.estado).map((e) => (
                    <option key={e} value={e}>
                      {e.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCambiarEstado}
                  disabled={!estadoTarget || cambiarEstado.isPending}
                  className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {cambiarEstado.isPending ? "..." : "Aplicar"}
                </button>
              </div>
              {cambioError !== null && <p className="text-xs text-red-600">{cambioError}</p>}
            </div>

            {os.venta_id && (
              <Link
                to={`/ventas/${os.venta_id}`}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver venta ({os.venta_estado ?? "—"})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Secciones */}
      <SeccionValidacion os={os} />
      <SeccionDiagnostico os={os} />
      <SeccionComponentes os={os} />
      <SeccionEvidencias os={os} />
      <SeccionRequerimientos os={os} />
      <SeccionCotizacion os={os} />
      <SeccionAprobacion os={os} />
      <SeccionSkus os={os} />
      <SeccionDevolucion os={os} />
      <SeccionObservaciones os={os} />
      <SeccionHistorial os={os} />
      <SeccionPerifericosSoloLectura os={os} />
      <SeccionAceptaciones os={os} />
    </div>
  );
}
