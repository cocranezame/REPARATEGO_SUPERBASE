import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useAccionesAgente, useAgentes, useCreateAgente, useUpdateAgente } from "../hooks/useCrm";
import type { AgenteDto } from "../types/crm";

// ─── Modelos Claude disponibles ───────────────────────────────────────────────

const CLAUDE_MODELS = [
  {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    cost: "$1 / $5 por 1M tokens",
    badge: "Más económico",
    badgeClass: "bg-green-100 text-green-700",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    cost: "$3 / $15 por 1M tokens",
    badge: "Balanceado",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  {
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    cost: "$5 / $25 por 1M tokens",
    badge: "Más capaz",
    badgeClass: "bg-purple-100 text-purple-700",
  },
] as const;

type ClaudeModelId = (typeof CLAUDE_MODELS)[number]["id"];

function ModelIaSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: ClaudeModelId) => void;
  id?: string;
}) {
  return (
    <div className="mt-1 space-y-1">
      {CLAUDE_MODELS.map((m) => (
        <label
          key={m.id}
          className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
            value === m.id
              ? "border-primary-500 bg-primary-50"
              : "border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name={id ?? "modelo_ia"}
              value={m.id}
              checked={value === m.id}
              onChange={() => onChange(m.id)}
              className="accent-primary-600"
            />
            <span className="text-sm font-medium">{m.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.badgeClass}`}>{m.badge}</span>
          </div>
          <span className="text-xs text-neutral-500 font-mono">{m.cost}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOOL_COLORS: Record<string, string> = {
  guardarDato: "bg-blue-100 text-blue-700",
  moverEtapa: "bg-indigo-100 text-indigo-700",
  buscarCliente: "bg-green-100 text-green-700",
  crearCliente: "bg-emerald-100 text-emerald-700",
  crearServicio: "bg-yellow-100 text-yellow-700",
  derivarVendedor: "bg-orange-100 text-orange-700",
  enviarLink: "bg-pink-100 text-pink-700",
  consultarRepuesto: "bg-purple-100 text-purple-700",
};

function toolBadgeClass(tool: string): string {
  return TOOL_COLORS[tool] ?? "bg-neutral-100 text-neutral-700";
}

// ─── JsonViewer ───────────────────────────────────────────────────────────────

function JsonViewer({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-primary-600 underline"
      >
        {open ? "Ocultar" : "Ver JSON"}
      </button>
      {open && (
        <pre className="mt-1 text-xs bg-neutral-50 border border-neutral-200 rounded p-2 overflow-x-auto max-h-32">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── NuevoAgenteModal ─────────────────────────────────────────────────────────

function NuevoAgenteModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateAgente();
  const [form, setForm] = useState({
    nombre: "",
    modelo_ia: "claude-haiku-4-5-20251001",
    tono: "",
    prompt_base: "",
    max_mensajes_contexto: 20,
  });

  const canSubmit = !isPending && form.nombre.trim() && form.modelo_ia.trim();

  function handleSubmit() {
    create(
      {
        nombre: form.nombre,
        modelo_ia: form.modelo_ia,
        canal: "WHATSAPP",
        ...(form.tono ? { tono: form.tono } : {}),
        ...(form.prompt_base ? { prompt_base: form.prompt_base } : {}),
        max_mensajes_contexto: form.max_mensajes_contexto,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-base font-semibold">Nuevo agente IA</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="nuevo-agente-nombre" className="text-xs font-medium text-neutral-600">
              Nombre *
            </label>
            <input
              id="nuevo-agente-nombre"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Nico"
            />
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-neutral-600">Modelo IA *</p>
            <ModelIaSelect
              id="nuevo-agente-modelo"
              value={form.modelo_ia}
              onChange={(v) => setForm((f) => ({ ...f, modelo_ia: v }))}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="nuevo-agente-max" className="text-xs font-medium text-neutral-600">
              Max mensajes contexto
            </label>
            <input
              id="nuevo-agente-max"
              type="number"
              min={5}
              max={100}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.max_mensajes_contexto}
              onChange={(e) =>
                setForm((f) => ({ ...f, max_mensajes_contexto: Number(e.target.value) }))
              }
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="nuevo-agente-tono" className="text-xs font-medium text-neutral-600">
              Tono
            </label>
            <textarea
              id="nuevo-agente-tono"
              rows={2}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-y"
              value={form.tono}
              onChange={(e) => setForm((f) => ({ ...f, tono: e.target.value }))}
              placeholder="Amigable, directo..."
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="nuevo-agente-prompt" className="text-xs font-medium text-neutral-600">
              Prompt base
            </label>
            <textarea
              id="nuevo-agente-prompt"
              rows={4}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono resize-y"
              value={form.prompt_base}
              onChange={(e) => setForm((f) => ({ ...f, prompt_base: e.target.value }))}
              placeholder="Instrucciones generales para el agente..."
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-neutral-200 rounded-lg py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear agente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AgenteDetail ─────────────────────────────────────────────────────────────

function AgenteDetail({ agente }: { agente: AgenteDto }) {
  const { mutate: update, isPending } = useUpdateAgente();
  const [form, setForm] = useState({
    nombre: agente.nombre,
    modelo_ia: agente.modelo_ia,
    tono: agente.tono ?? "",
    prompt_base: agente.prompt_base ?? "",
    max_mensajes_contexto: agente.max_mensajes_contexto,
    activo: agente.activo,
  });
  const [toolFilter, setToolFilter] = useState("");
  const [soloErrores, setSoloErrores] = useState(false);
  const [accionPage, setAccionPage] = useState(1);

  const { data: accionesData } = useAccionesAgente(agente.id, {
    ...(toolFilter ? { tool_name: toolFilter } : {}),
    ...(soloErrores ? { exitoso: false } : {}),
    page: accionPage,
    pageSize: 20,
  });

  function handleSave() {
    update({
      id: agente.id,
      data: {
        modelo_ia: form.modelo_ia,
        tono: form.tono || undefined,
        prompt_base: form.prompt_base || undefined,
        max_mensajes_contexto: form.max_mensajes_contexto,
        activo: form.activo,
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700">Configuración del agente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="agente-nombre" className="text-xs font-medium text-neutral-600">
              Nombre
            </label>
            <input
              id="agente-nombre"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="agente-canal" className="text-xs font-medium text-neutral-600">
              Canal
            </label>
            <div className="mt-1 flex items-center h-9">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {agente.canal}
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-neutral-600">Modelo IA</p>
            <ModelIaSelect
              id="agente-modelo"
              value={form.modelo_ia}
              onChange={(v) => setForm((f) => ({ ...f, modelo_ia: v }))}
            />
          </div>
          <div>
            <label htmlFor="agente-max" className="text-xs font-medium text-neutral-600">
              Max mensajes contexto
            </label>
            <input
              id="agente-max"
              type="number"
              min={5}
              max={100}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.max_mensajes_contexto}
              onChange={(e) =>
                setForm((f) => ({ ...f, max_mensajes_contexto: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <div>
          <label htmlFor="agente-tono" className="text-xs font-medium text-neutral-600">
            Tono (personalidad y estilo)
          </label>
          <textarea
            id="agente-tono"
            rows={3}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            value={form.tono}
            onChange={(e) => setForm((f) => ({ ...f, tono: e.target.value }))}
            placeholder="Ej: Amigable, directo, habla en primera persona como Nico..."
          />
        </div>

        <div>
          <label htmlFor="agente-prompt" className="text-xs font-medium text-neutral-600">
            Prompt base (instrucciones generales)
          </label>
          <textarea
            id="agente-prompt"
            rows={6}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            value={form.prompt_base}
            onChange={(e) => setForm((f) => ({ ...f, prompt_base: e.target.value }))}
            placeholder="Instrucciones que se inyectan en cada llamada al LLM..."
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={form.activo}
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                form.activo ? "bg-green-500" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-neutral-600">{form.activo ? "Activo" : "Inactivo"}</span>
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-primary-700"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Log de acciones */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-neutral-700">Log de acciones</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Filtrar por tool..."
              className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 w-36"
              value={toolFilter}
              onChange={(e) => {
                setToolFilter(e.target.value);
                setAccionPage(1);
              }}
            />
            <label className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={soloErrores}
                onChange={(e) => {
                  setSoloErrores(e.target.checked);
                  setAccionPage(1);
                }}
              />
              Solo errores
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-neutral-500">
                <th className="pb-2 pr-3 font-medium">Fecha/Hora</th>
                <th className="pb-2 pr-3 font-medium">Tool</th>
                <th className="pb-2 pr-3 font-medium">Input</th>
                <th className="pb-2 pr-3 font-medium">Output</th>
                <th className="pb-2 pr-3 font-medium">Estado</th>
                <th className="pb-2 pr-3 font-medium">Duración</th>
                <th className="pb-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {(accionesData?.data ?? []).map((a) => (
                <tr key={a.id} className="border-b border-neutral-50">
                  <td className="py-2 pr-3 whitespace-nowrap text-neutral-500">
                    {new Date(a.created_at).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded-full ${toolBadgeClass(a.tool_name)}`}>
                      {a.tool_name}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <JsonViewer data={a.tool_input} />
                  </td>
                  <td className="py-2 pr-3">
                    <JsonViewer data={a.tool_output} />
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-1.5 py-0.5 rounded-full ${
                        a.exitoso ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.exitoso ? "OK" : "Error"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {a.duracion_ms !== null ? `${a.duracion_ms}ms` : "—"}
                  </td>
                  <td className="py-2 text-red-600 max-w-xs truncate">{a.error ?? "—"}</td>
                </tr>
              ))}
              {(accionesData?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-400">
                    Sin acciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Total: {accionesData?.total ?? 0}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={accionPage === 1}
              onClick={() => setAccionPage((p) => p - 1)}
              className="px-2 py-1 border border-neutral-200 rounded disabled:opacity-40"
            >
              ←
            </button>
            <span className="px-2 py-1">p.{accionPage}</span>
            <button
              type="button"
              disabled={(accionesData?.data ?? []).length < 20}
              onClick={() => setAccionPage((p) => p + 1)}
              className="px-2 py-1 border border-neutral-200 rounded disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ConfigAgentesPage ────────────────────────────────────────────────────────

export function ConfigAgentesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useAgentes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  const agentes = data?.data ?? [];
  const selected = agentes.find((a) => a.id === selectedId) ?? agentes[0];

  if (isLoading) {
    return <div className="text-sm text-neutral-400">Cargando agentes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Configuración de agentes</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-700"
        >
          + Nuevo agente
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr className="text-left text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Modelo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {agentes.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 transition-colors ${
                  selected?.id === a.id ? "bg-primary-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium">{a.nombre}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {a.canal}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{a.modelo_ia}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      a.activo ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {agentes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400 text-sm">
                  No hay agentes configurados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <AgenteDetail agente={selected} />}

      {showCreate && <NuevoAgenteModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
