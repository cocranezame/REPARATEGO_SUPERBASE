import { ArrowLeft, CheckCircle2, Image, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  useAddComponentes,
  useAddCotizacion,
  useAddEvidencia,
  useAprobarCotizacion,
  useDeleteEvidencia,
  useOrdenServicio,
  useOrdenServicioComponentes,
  useOrdenServicioCotizacion,
  useOrdenServicioEvidencias,
  useUpdateEstadoOrdenServicio,
  useUpdateOrdenServicio,
} from "../hooks/useOrdenesServicio";
import type { EstadoOrdenServicio, OrdenServicioCotizacionDto } from "../types/orden-servicio";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<EstadoOrdenServicio, string> = {
  RECEPCION: "bg-blue-100 text-blue-700",
  EN_DIAGNOSTICO: "bg-purple-100 text-purple-700",
  DIAGNOSTICADO: "bg-indigo-100 text-indigo-700",
  COTIZADO: "bg-yellow-100 text-yellow-700",
  APROBADO: "bg-orange-100 text-orange-700",
  EN_REPARACION: "bg-cyan-100 text-cyan-700",
  REPARADO: "bg-teal-100 text-teal-700",
  LISTO_ENTREGA: "bg-green-100 text-green-700",
  ENTREGADO: "bg-neutral-100 text-neutral-600",
  DEVOLUCION: "bg-red-100 text-red-700",
  CANCELADO: "bg-neutral-100 text-neutral-400",
};

const NEXT_ESTADOS: Partial<
  Record<EstadoOrdenServicio, { estado: EstadoOrdenServicio; label: string }[]>
> = {
  RECEPCION: [{ estado: "EN_DIAGNOSTICO", label: "Iniciar diagnóstico" }],
  EN_DIAGNOSTICO: [{ estado: "DIAGNOSTICADO", label: "Marcar diagnosticado" }],
  DIAGNOSTICADO: [
    { estado: "COTIZADO", label: "Enviar cotización" },
    { estado: "EN_REPARACION", label: "Iniciar reparación" },
  ],
  COTIZADO: [{ estado: "APROBADO", label: "Aprobar cotización" }],
  APROBADO: [{ estado: "EN_REPARACION", label: "Iniciar reparación" }],
  EN_REPARACION: [{ estado: "REPARADO", label: "Marcar reparado" }],
  REPARADO: [{ estado: "LISTO_ENTREGA", label: "Listo para entrega" }],
  LISTO_ENTREGA: [
    { estado: "ENTREGADO", label: "Marcar entregado" },
    { estado: "DEVOLUCION", label: "Devolución" },
  ],
};

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none";

type TabId = "info" | "componentes" | "cotizacion" | "evidencias";

// ─── Sub-components ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoOrdenServicio }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {estado.replace(/_/g, " ")}
    </span>
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Tab Cotización ───────────────────────────────────────────────────────────

function TabCotizacion({ osId, estado }: { osId: string; estado: EstadoOrdenServicio }) {
  const { data, isLoading } = useOrdenServicioCotizacion(osId);
  const addMutation = useAddCotizacion();
  const aprobarMutation = useAprobarCotizacion();

  const nextKey = useRef(2);
  type Row = {
    key: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    tipo: string;
    producto_id?: string;
  };
  const [items, setItems] = useState<Row[]>([
    { key: "1", descripcion: "", cantidad: 1, precio_unitario: 0, tipo: "MANO_OBRA" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cotizacion = data?.data ?? [];
  const totales = data?.totales;

  function addRow() {
    const k = String(nextKey.current++);
    setItems((prev) => [
      ...prev,
      { key: k, descripcion: "", cantidad: 1, precio_unitario: 0, tipo: "MANO_OBRA" },
    ]);
  }

  function removeRow(k: string) {
    setItems((prev) => prev.filter((it) => it.key !== k));
  }

  function updateRow(k: string, field: keyof Omit<Row, "key">, value: string | number) {
    setItems((prev) => prev.map((it) => (it.key === k ? { ...it, [field]: value } : it)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const filtered = items.filter(
      (it) => it.descripcion.trim() && it.cantidad > 0 && it.precio_unitario > 0
    );
    if (filtered.length === 0) {
      setErr("Agrega al menos un item válido");
      return;
    }
    try {
      await addMutation.mutateAsync({
        id: osId,
        items: filtered.map((it) => ({
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          tipo: it.tipo as "REPUESTO" | "MANO_OBRA",
        })),
      });
      setShowForm(false);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function handleAprobar(aprobado: boolean) {
    setErr(null);
    try {
      await aprobarMutation.mutateAsync({ id: osId, aprobado });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (isLoading)
    return <div className="py-10 text-center text-sm text-neutral-400">Cargando...</div>;

  const puedeCotizar = ["DIAGNOSTICADO", "COTIZADO", "APROBADO"].includes(estado);
  const puedaAprobar = estado === "COTIZADO" && cotizacion.length > 0;

  return (
    <div className="space-y-4">
      {cotizacion.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-2 text-left text-xs text-neutral-500">Descripción</th>
                  <th className="px-4 py-2 text-right text-xs text-neutral-500">Tipo</th>
                  <th className="px-4 py-2 text-right text-xs text-neutral-500">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs text-neutral-500">P.U.</th>
                  <th className="px-4 py-2 text-right text-xs text-neutral-500">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs text-neutral-500">Aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cotizacion.map((it: OrdenServicioCotizacionDto) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">{it.descripcion}</td>
                    <td className="px-4 py-2 text-right text-xs text-neutral-500">{it.tipo}</td>
                    <td className="px-4 py-2 text-right">{it.cantidad}</td>
                    <td className="px-4 py-2 text-right">
                      S/ {Number(it.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      S/ {Number(it.subtotal).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {it.aprobado_cliente === null ? (
                        "—"
                      ) : it.aprobado_cliente ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-danger-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totales && (
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-8">
                <span className="text-neutral-500">Subtotal</span>
                <span>S/ {totales.subtotal}</span>
              </div>
              <div className="flex gap-8">
                <span className="text-neutral-500">IGV (18%)</span>
                <span>S/ {totales.igv}</span>
              </div>
              <div className="flex gap-8 text-base font-bold">
                <span>Total</span>
                <span>S/ {totales.total}</span>
              </div>
            </div>
          )}
          {puedaAprobar && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleAprobar(true)}
                disabled={aprobarMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Aprobar cotización
              </button>
              <button
                type="button"
                onClick={() => handleAprobar(false)}
                disabled={aprobarMutation.isPending}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-400">Sin cotización registrada.</p>
      )}

      {puedeCotizar && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" />
          Agregar items
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-200 p-4 space-y-3"
        >
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.key}
                className="grid grid-cols-[1fr_80px_90px_90px_auto] items-center gap-2"
              >
                <input
                  type="text"
                  value={it.descripcion}
                  onChange={(e) => updateRow(it.key, "descripcion", e.target.value)}
                  placeholder="Descripción"
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <select
                  value={it.tipo}
                  onChange={(e) => updateRow(it.key, "tipo", e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="MANO_OBRA">M.O.</option>
                  <option value="REPUESTO">Rep.</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={it.cantidad}
                  onChange={(e) => updateRow(it.key, "cantidad", Number(e.target.value))}
                  placeholder="Qty"
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={it.precio_unitario}
                  onChange={(e) => updateRow(it.key, "precio_unitario", Number(e.target.value))}
                  placeholder="Precio"
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(it.key)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-danger-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-primary-600 hover:underline"
          >
            + Agregar línea
          </button>
          {err !== null && <p className="text-xs text-danger-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {addMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Tab Componentes ──────────────────────────────────────────────────────────

function TabComponentes({ osId }: { osId: string }) {
  const { data, isLoading } = useOrdenServicioComponentes(osId);
  const { data: componentesData } = useComponentes({ activo: true, pageSize: 200 });
  const addMutation = useAddComponentes();
  const [showForm, setShowForm] = useState(false);
  const [compId, setCompId] = useState("");
  const [estado, setEstado] = useState("DAÑADO");
  const [notas, setNotas] = useState("");
  const [esPreliminar, setEsPreliminar] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const items = data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!compId) {
      setErr("Selecciona un componente");
      return;
    }
    setErr(null);
    try {
      await addMutation.mutateAsync({
        id: osId,
        items: [
          {
            componente_id: compId,
            es_preliminar: esPreliminar,
            estado_componente: estado as "DAÑADO" | "FALTANTE" | "OK",
            ...(notas ? { notas } : {}),
          },
        ],
      });
      setShowForm(false);
      setCompId("");
      setNotas("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (isLoading)
    return <div className="py-10 text-center text-sm text-neutral-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-2 text-left text-xs text-neutral-500">Componente</th>
                <th className="px-4 py-2 text-center text-xs text-neutral-500">Fase</th>
                <th className="px-4 py-2 text-center text-xs text-neutral-500">Estado</th>
                <th className="px-4 py-2 text-left text-xs text-neutral-500">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2">{c.componente_nombre ?? c.componente_id}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${c.es_preliminar ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}
                    >
                      {c.es_preliminar ? "Preliminar" : "Final"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs">{c.estado_componente}</td>
                  <td className="px-4 py-2 text-xs text-neutral-500">{c.notas ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-400">Sin componentes registrados.</p>
      )}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" /> Agregar componente
        </button>
      )}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-componente" className="text-xs text-neutral-700">
                Componente
              </label>
              <select
                id="comp-componente"
                value={compId}
                onChange={(e) => setCompId(e.target.value)}
                className={SELECT}
              >
                <option value="">Seleccionar...</option>
                {(componentesData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-estado" className="text-xs text-neutral-700">
                Estado
              </label>
              <select
                id="comp-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={SELECT}
              >
                <option value="DAÑADO">Dañado</option>
                <option value="FALTANTE">Faltante</option>
                <option value="OK">OK</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-fase" className="text-xs text-neutral-700">
                Fase
              </label>
              <select
                id="comp-fase"
                value={esPreliminar ? "1" : "0"}
                onChange={(e) => setEsPreliminar(e.target.value === "1")}
                className={SELECT}
              >
                <option value="1">Preliminar (recepción)</option>
                <option value="0">Final (diagnóstico)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-notas" className="text-xs text-neutral-700">
                Notas
              </label>
              <input
                id="comp-notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className={INPUT}
                placeholder="Opcional"
              />
            </div>
          </div>
          {err !== null && <p className="text-xs text-danger-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {addMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Tab Evidencias ───────────────────────────────────────────────────────────

function TabEvidencias({ osId }: { osId: string }) {
  const { data, isLoading } = useOrdenServicioEvidencias(osId);
  const addMutation = useAddEvidencia();
  const deleteMutation = useDeleteEvidencia();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [tipoArchivo, setTipoArchivo] = useState("IMAGE");
  const [momento, setMomento] = useState("RECEPCION");
  const [descripcion, setDescripcion] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const items = data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) {
      setErr("Ingresa una URL");
      return;
    }
    setErr(null);
    try {
      await addMutation.mutateAsync({
        id: osId,
        url,
        tipo_archivo: tipoArchivo as "IMAGE" | "VIDEO",
        momento: momento as "RECEPCION" | "DIAGNOSTICO" | "REPARACION" | "ENTREGA",
        ...(descripcion ? { descripcion } : {}),
      });
      setShowForm(false);
      setUrl("");
      setDescripcion("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (isLoading)
    return <div className="py-10 text-center text-sm text-neutral-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((ev) => (
            <div
              key={ev.id}
              className="group relative rounded-lg border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-700 truncate">{ev.momento}</span>
              </div>
              <p className="text-xs text-neutral-500 truncate">{ev.descripcion ?? "—"}</p>
              <a
                href={ev.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-primary-600 hover:underline"
              >
                Ver archivo
              </a>
              <button
                type="button"
                onClick={() => deleteMutation.mutate({ osId, evidenciaId: ev.id })}
                disabled={deleteMutation.isPending}
                className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-danger-600 group-hover:flex"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-400">Sin evidencias registradas.</p>
      )}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" /> Agregar evidencia
        </button>
      )}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="ev-url" className="text-xs text-neutral-700">
                URL del archivo
              </label>
              <input
                id="ev-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ev-tipo" className="text-xs text-neutral-700">
                Tipo
              </label>
              <select
                id="ev-tipo"
                value={tipoArchivo}
                onChange={(e) => setTipoArchivo(e.target.value)}
                className={SELECT}
              >
                <option value="IMAGE">Imagen</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ev-momento" className="text-xs text-neutral-700">
                Momento
              </label>
              <select
                id="ev-momento"
                value={momento}
                onChange={(e) => setMomento(e.target.value)}
                className={SELECT}
              >
                <option value="RECEPCION">Recepción</option>
                <option value="DIAGNOSTICO">Diagnóstico</option>
                <option value="REPARACION">Reparación</option>
                <option value="ENTREGA">Entrega</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="ev-descripcion" className="text-xs text-neutral-700">
                Descripción
              </label>
              <input
                id="ev-descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Opcional"
                className={INPUT}
              />
            </div>
          </div>
          {err !== null && <p className="text-xs text-danger-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {addMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Tab Info ─────────────────────────────────────────────────────────────────

function TabInfo({ osId }: { osId: string }) {
  const { data } = useOrdenServicio(osId);
  const { data: usuariosData } = useUsuarios({ rol: "TECNICO", pageSize: 50 });
  const updateMutation = useUpdateOrdenServicio();
  const [editDiag, setEditDiag] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");
  const [solucion, setSolucion] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const os = data?.data;
  if (!os) return null;

  async function handleSaveDiag(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await updateMutation.mutateAsync({
        id: osId,
        ...(diagnostico ? { diagnostico_tecnico: diagnostico } : {}),
        ...(solucion ? { solucion_aplicada: solucion } : {}),
        ...(tecnicoId ? { tecnico_id: tecnicoId } : {}),
      });
      setEditDiag(false);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        {[
          { label: "Código", value: os.codigo },
          { label: "Cliente", value: os.cliente_nombre ?? "—" },
          { label: "Técnico", value: os.tecnico_nombre ?? "Sin asignar" },
          { label: "Categoría", value: os.categoria_nombre ?? "—" },
          { label: "Marca", value: os.marca_nombre ?? "—" },
          { label: "Modelo", value: os.modelo_nombre ?? "—" },
          { label: "Serie", value: os.serie_equipo ?? "—" },
          { label: "Color", value: os.color_equipo ?? "—" },
          { label: "Tipo servicio", value: os.tipo_servicio },
          { label: "Prioridad", value: os.prioridad },
          { label: "Recepción", value: new Date(os.fecha_recepcion).toLocaleDateString("es-PE") },
          {
            label: "Terminado",
            value: os.fecha_terminado
              ? new Date(os.fecha_terminado).toLocaleDateString("es-PE")
              : "—",
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="font-medium text-neutral-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
        <p className="text-xs font-medium text-neutral-700">Problema reportado</p>
        <p className="text-sm text-neutral-800">{os.problema_reportado}</p>
      </div>

      {!editDiag ? (
        <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-700">Diagnóstico y solución</p>
            <button
              type="button"
              onClick={() => {
                setDiagnostico(os.diagnostico_tecnico ?? "");
                setSolucion(os.solucion_aplicada ?? "");
                setTecnicoId(os.tecnico_id ?? "");
                setEditDiag(true);
              }}
              className="text-xs text-primary-600 hover:underline"
            >
              Editar
            </button>
          </div>
          <p className="text-sm text-neutral-600">
            {os.diagnostico_tecnico ?? "Sin diagnóstico aún."}
          </p>
          {os.solucion_aplicada && (
            <div>
              <p className="text-xs text-neutral-500">Solución</p>
              <p className="text-sm">{os.solucion_aplicada}</p>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSaveDiag}
          className="rounded-lg border border-neutral-200 p-4 space-y-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="info-tecnico" className="text-xs font-medium text-neutral-700">
              Técnico asignado
            </label>
            <select
              id="info-tecnico"
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className={SELECT}
            >
              <option value="">Sin asignar</option>
              {(usuariosData?.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombres} {u.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="info-diagnostico" className="text-xs font-medium text-neutral-700">
              Diagnóstico técnico
            </label>
            <textarea
              id="info-diagnostico"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows={3}
              className={INPUT}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="info-solucion" className="text-xs font-medium text-neutral-700">
              Solución aplicada
            </label>
            <textarea
              id="info-solucion"
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              rows={2}
              className={INPUT}
            />
          </div>
          {err !== null && <p className="text-xs text-danger-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditDiag(false)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OrdenServicioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const osId = id ?? "";

  const { data, isLoading, isError } = useOrdenServicio(osId);
  const os = data?.data;

  const updateEstadoMutation = useUpdateEstadoOrdenServicio();
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [actionError, setActionError] = useState<string | null>(null);

  function handleEstado(estado: EstadoOrdenServicio) {
    setActionError(null);
    updateEstadoMutation.mutate(
      { id: osId, estado },
      { onError: (err) => setActionError(err.message) }
    );
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
      <div className="py-10 text-center text-sm text-danger-600">
        Orden no encontrada.{" "}
        <Link to="/servicios" className="text-primary-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  const siguientes = NEXT_ESTADOS[os.estado] ?? [];
  const tabs: { id: TabId; label: string }[] = [
    { id: "info", label: "Info" },
    { id: "componentes", label: "Componentes" },
    { id: "cotizacion", label: "Cotización" },
    { id: "evidencias", label: "Evidencias" },
  ];

  return (
    <div className="space-y-4">
      {/* Back + title */}
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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900">{os.codigo}</h1>
              <EstadoBadge estado={os.estado} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Cliente:{" "}
              <span className="font-medium text-neutral-800">{os.cliente_nombre ?? "—"}</span>
            </p>
            <p className="text-sm text-neutral-500">
              Equipo:{" "}
              <span className="font-medium text-neutral-800">
                {[os.categoria_nombre, os.marca_nombre, os.modelo_nombre]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {actionError !== null && <span className="text-xs text-danger-600">{actionError}</span>}
            <div className="flex flex-wrap gap-2">
              {siguientes.map(({ estado, label }) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => handleEstado(estado)}
                  disabled={updateEstadoMutation.isPending}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {updateEstadoMutation.isPending ? "..." : label}
                </button>
              ))}
              {!["ENTREGADO", "CANCELADO"].includes(os.estado) && (
                <button
                  type="button"
                  onClick={() => handleEstado("CANCELADO")}
                  disabled={updateEstadoMutation.isPending}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                >
                  Cancelar OS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
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
          {activeTab === "info" && <TabInfo osId={osId} />}
          {activeTab === "componentes" && <TabComponentes osId={osId} />}
          {activeTab === "cotizacion" && <TabCotizacion osId={osId} estado={os.estado} />}
          {activeTab === "evidencias" && <TabEvidencias osId={osId} />}
        </div>
      </div>
    </div>
  );
}
