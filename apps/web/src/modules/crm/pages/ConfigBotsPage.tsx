import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useBots, useUpdateBot } from "../hooks/useCrm";
import type { BotDto } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_BADGE: Record<string, string> = {
  COTIZACION_REPUESTO: "bg-blue-100 text-blue-700",
  SERVICIO_PROCESO: "bg-green-100 text-green-700",
  RECORDATORIO: "bg-yellow-100 text-yellow-700",
};

// ─── RecordatorioEditor ───────────────────────────────────────────────────────

type RecordatorioConfig = {
  mensaje?: string;
  intervalo_horas?: number;
  max_intentos?: number;
};

function RecordatorioEditor({
  config,
  onChange,
}: {
  config: RecordatorioConfig;
  onChange: (c: RecordatorioConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="rec-mensaje" className="text-xs font-medium text-neutral-600">
          Mensaje de recordatorio
        </label>
        <textarea
          id="rec-mensaje"
          rows={3}
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
          value={config.mensaje ?? ""}
          onChange={(e) => onChange({ ...config, mensaje: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rec-intervalo" className="text-xs font-medium text-neutral-600">
            Intervalo (horas)
          </label>
          <input
            id="rec-intervalo"
            type="number"
            min={1}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            value={config.intervalo_horas ?? 24}
            onChange={(e) => onChange({ ...config, intervalo_horas: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="rec-intentos" className="text-xs font-medium text-neutral-600">
            Max intentos
          </label>
          <input
            id="rec-intentos"
            type="number"
            min={1}
            max={10}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            value={config.max_intentos ?? 3}
            onChange={(e) => onChange({ ...config, max_intentos: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── FlowNodeEditor ───────────────────────────────────────────────────────────

type FlowNode = {
  id: string;
  tipo: string;
  mensaje?: string;
  tipo_respuesta?: string;
  opciones?: { label: string; siguiente_id: string }[];
  accion_especial?: string;
  es_inicial?: boolean;
  timeout_minutos?: number;
};

type FlowConfig = {
  nodo_inicial_id?: string | undefined;
  nodos?: FlowNode[] | undefined;
};

function FlowNodeEditor({
  config,
  onChange,
}: {
  config: FlowConfig;
  onChange: (c: FlowConfig) => void;
}) {
  const nodos = config.nodos ?? [];

  function updateNode(id: string, patch: Partial<FlowNode>) {
    onChange({
      ...config,
      nodos: nodos.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  }

  function addNode() {
    const newId = `nodo_${Date.now()}`;
    onChange({
      ...config,
      nodos: [...nodos, { id: newId, tipo: "MENSAJE", tipo_respuesta: "NINGUNA" }],
    });
  }

  function removeNode(id: string) {
    onChange({
      ...config,
      nodos: nodos.filter((n) => n.id !== id),
      ...(config.nodo_inicial_id === id ? { nodo_inicial_id: undefined } : {}),
    });
  }

  const NODE_TIPOS = ["MENSAJE", "CONSULTA_INVENTARIO", "CONSULTA_SERVICIO", "RESULTADO", "FIN"];
  const RESPUESTA_TIPOS = ["BOTONES", "LETRA", "TEXTO_LIBRE", "NINGUNA"];
  const ACCIONES = ["", "DERIVAR_VENDEDOR", "MOVER_ETAPA", "FINALIZAR", "INICIAR_BOT"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Nodos del flujo
        </p>
        <button
          type="button"
          onClick={addNode}
          className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
        >
          + Nodo
        </button>
      </div>

      {nodos.map((node, idx) => (
        <div
          key={node.id}
          className="border border-neutral-200 rounded-xl p-4 space-y-3 bg-neutral-50"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {config.nodo_inicial_id === node.id && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  INICIO
                </span>
              )}
              <span className="text-xs text-neutral-400">Nodo {idx + 1}</span>
              <code className="text-xs text-neutral-500">{node.id}</code>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...config, nodo_inicial_id: node.id })}
                disabled={config.nodo_inicial_id === node.id}
                className="text-xs text-green-600 hover:underline disabled:opacity-40"
              >
                Marcar inicio
              </button>
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`tipo-${node.id}`} className="text-xs font-medium text-neutral-600">
                Tipo
              </label>
              <select
                id={`tipo-${node.id}`}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs"
                value={node.tipo}
                onChange={(e) => updateNode(node.id, { tipo: e.target.value })}
              >
                {NODE_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`resp-${node.id}`} className="text-xs font-medium text-neutral-600">
                Tipo respuesta
              </label>
              <select
                id={`resp-${node.id}`}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs"
                value={node.tipo_respuesta ?? "NINGUNA"}
                onChange={(e) => updateNode(node.id, { tipo_respuesta: e.target.value })}
              >
                {RESPUESTA_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`msg-${node.id}`} className="text-xs font-medium text-neutral-600">
              Mensaje
            </label>
            <textarea
              id={`msg-${node.id}`}
              rows={2}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs resize-none"
              value={node.mensaje ?? ""}
              onChange={(e) => updateNode(node.id, { mensaje: e.target.value })}
            />
          </div>

          {(node.tipo_respuesta === "BOTONES" || node.tipo_respuesta === "LETRA") && (
            <div>
              <p className="text-xs font-medium text-neutral-600">Opciones</p>
              <div className="space-y-1 mt-1">
                {(node.opciones ?? []).map((opt, oi) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: opciones sin id estable
                  <div key={`${node.id}-opt-${oi}`} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-neutral-200 rounded px-2 py-1 text-xs"
                      placeholder="Label"
                      value={opt.label}
                      onChange={(e) => {
                        const newOpts = [...(node.opciones ?? [])];
                        newOpts[oi] = { ...opt, label: e.target.value };
                        updateNode(node.id, { opciones: newOpts });
                      }}
                    />
                    <input
                      type="text"
                      className="flex-1 border border-neutral-200 rounded px-2 py-1 text-xs font-mono"
                      placeholder="siguiente_id"
                      value={opt.siguiente_id}
                      onChange={(e) => {
                        const newOpts = [...(node.opciones ?? [])];
                        newOpts[oi] = { ...opt, siguiente_id: e.target.value };
                        updateNode(node.id, { opciones: newOpts });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = (node.opciones ?? []).filter((_, i) => i !== oi);
                        updateNode(node.id, { opciones: newOpts });
                      }}
                      className="text-xs text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOpts = [...(node.opciones ?? []), { label: "", siguiente_id: "" }];
                    updateNode(node.id, { opciones: newOpts });
                  }}
                  className="text-xs text-primary-600 hover:underline"
                >
                  + Opción
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor={`accion-${node.id}`} className="text-xs font-medium text-neutral-600">
              Acción especial
            </label>
            <select
              id={`accion-${node.id}`}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs"
              value={node.accion_especial ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  updateNode(node.id, { accion_especial: val });
                } else {
                  const found = nodos.find((n) => n.id === node.id);
                  if (found) {
                    const { accion_especial: _a, ...rest } = found;
                    onChange({ ...config, nodos: nodos.map((n) => (n.id === node.id ? rest : n)) });
                  }
                }
              }}
            >
              {ACCIONES.map((a) => (
                <option key={a} value={a}>
                  {a || "Ninguna"}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {nodos.length === 0 && (
        <p className="text-xs text-neutral-400 py-3 text-center">Sin nodos. Agrega uno.</p>
      )}
    </div>
  );
}

// ─── BotDetail ────────────────────────────────────────────────────────────────

function BotDetail({ bot }: { bot: BotDto }) {
  const { mutate: update, isPending } = useUpdateBot();

  const [nombre, setNombre] = useState(bot.nombre);
  const [activo, setActivo] = useState(bot.activo);
  const [config, setConfig] = useState<Record<string, unknown>>(
    (bot.config as Record<string, unknown>) ?? {}
  );

  function handleSave() {
    update({ id: bot.id, data: { nombre, activo, config } });
  }

  const isRecordatorio = bot.tipo === "RECORDATORIO";

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              TIPO_BADGE[bot.tipo] ?? "bg-neutral-100 text-neutral-600"
            }`}
          >
            {bot.tipo}
          </span>
          <span className="text-xs font-mono text-neutral-400">{bot.codigo}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              onClick={() => setActivo((v) => !v)}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                activo ? "bg-green-500" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  activo ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-neutral-600">{activo ? "Activo" : "Inactivo"}</span>
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

      <div>
        <label htmlFor={`bot-nombre-${bot.id}`} className="text-xs font-medium text-neutral-600">
          Nombre
        </label>
        <input
          id={`bot-nombre-${bot.id}`}
          type="text"
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {/* Config editor */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Configuración del flujo
        </p>
        {isRecordatorio ? (
          <RecordatorioEditor
            config={config as RecordatorioConfig}
            onChange={(c) => setConfig(c as Record<string, unknown>)}
          />
        ) : (
          <FlowNodeEditor
            config={config as FlowConfig}
            onChange={(c) => setConfig(c as Record<string, unknown>)}
          />
        )}
      </div>
    </div>
  );
}

// ─── ConfigBotsPage ───────────────────────────────────────────────────────────

export function ConfigBotsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useBots();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  const bots = data?.data ?? [];
  const selected = bots.find((b) => b.id === selectedId) ?? bots[0];

  if (isLoading) return <div className="text-sm text-neutral-400">Cargando bots...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Configuración de bots</h1>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr className="text-left text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((b) => (
              <tr
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={`border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 transition-colors ${
                  selected?.id === b.id ? "bg-primary-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium">{b.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{b.codigo}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      TIPO_BADGE[b.tipo] ?? "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {b.tipo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      b.activo ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {b.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <BotDetail key={selected.id} bot={selected} />}
    </div>
  );
}
