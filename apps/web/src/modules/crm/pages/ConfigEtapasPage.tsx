import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  useBots,
  useCreateEtapa,
  useCreateTransicion,
  useDeleteEtapa,
  useDeleteTransicion,
  useEtapas,
  useTransiciones,
  useUpdateEtapa,
} from "../hooks/useCrm";
import type { CrmEtapaDto } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPERADOR_ICONS: Record<string, string> = {
  IA: "🤖",
  BOT: "⚙️",
  HUMANO: "👤",
  SISTEMA: "⚡",
};

const PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

// ─── Transiciones section ─────────────────────────────────────────────────────

function TransicionesSection({
  etapa,
  allEtapas,
}: {
  etapa: CrmEtapaDto;
  allEtapas: CrmEtapaDto[];
}) {
  const { data: transData } = useTransiciones(etapa.id);
  const { mutate: createTrans, isPending: creating } = useCreateTransicion();
  const { mutate: deleteTrans, isPending: deleting } = useDeleteTransicion();

  const transiciones = transData?.data ?? [];
  const allowedIds = new Set(transiciones.map((t) => t.etapa_destino_id));

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        Transiciones permitidas desde "{etapa.nombre}"
      </p>
      <div className="flex flex-wrap gap-2">
        {allEtapas
          .filter((e) => e.id !== etapa.id)
          .map((dest) => {
            const isAllowed = allowedIds.has(dest.id);
            return (
              <button
                key={dest.id}
                type="button"
                disabled={creating || deleting}
                onClick={() => {
                  if (isAllowed) {
                    deleteTrans({ origenId: etapa.id, destinoId: dest.id });
                  } else {
                    createTrans({ etapaOrigenId: etapa.id, data: { etapa_destino_id: dest.id } });
                  }
                }}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                  isAllowed
                    ? "bg-primary-100 border-primary-400 text-primary-700"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {isAllowed ? "✓" : "+"} {dest.nombre}
              </button>
            );
          })}
      </div>
      {transiciones.length > 0 && (
        <p className="text-xs text-neutral-400 mt-2">
          Puede ir a: {transiciones.map((t) => t.destino_nombre).join(", ")}
        </p>
      )}
    </div>
  );
}

// ─── EtapaModal ───────────────────────────────────────────────────────────────

function EtapaModal({
  editing,
  nextOrden,
  onClose,
}: {
  editing: CrmEtapaDto | null;
  nextOrden: number;
  onClose: () => void;
}) {
  const { mutate: create, isPending: creating } = useCreateEtapa();
  const { mutate: update, isPending: updating } = useUpdateEtapa();
  const { data: botsData } = useBots();

  const bots = (botsData?.data ?? []).filter((b) => b.activo);

  const [form, setForm] = useState({
    nombre: editing?.nombre ?? "",
    codigo: editing?.codigo ?? "",
    orden: editing?.orden ?? nextOrden,
    objetivo: editing?.objetivo ?? "",
    operador: (editing?.operador ?? "IA") as "IA" | "BOT" | "HUMANO" | "SISTEMA",
    bot_id: editing?.bot_id ?? "",
    tiempo_espera_horas: editing?.tiempo_espera_horas ?? 24,
    max_intentos_recordatorio: editing?.max_intentos_recordatorio ?? 3,
    color: editing?.color ?? PALETTE[0],
    activo: editing?.activo ?? true,
  });

  const isPending = creating || updating;

  function handleSubmit() {
    const payload = {
      nombre: form.nombre,
      orden: form.orden,
      objetivo: form.objetivo || undefined,
      operador: form.operador,
      ...(form.bot_id ? { bot_id: form.bot_id } : {}),
      tiempo_espera_horas: form.tiempo_espera_horas,
      max_intentos_recordatorio: form.max_intentos_recordatorio,
      color: form.color,
    };
    if (editing) {
      update({ id: editing.id, data: { ...payload, activo: form.activo } }, { onSuccess: onClose });
    } else {
      create({ ...payload, codigo: form.codigo }, { onSuccess: onClose });
    }
  }

  const canSubmit = !isPending && form.nombre && (editing || form.codigo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-4">
        <h3 className="text-base font-semibold mb-5">{editing ? "Editar etapa" : "Nueva etapa"}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="etapa-nombre" className="text-xs font-medium text-neutral-600">
                Nombre *
              </label>
              <input
                id="etapa-nombre"
                type="text"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="etapa-codigo" className="text-xs font-medium text-neutral-600">
                Código *
              </label>
              <input
                id="etapa-codigo"
                type="text"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono uppercase disabled:bg-neutral-50"
                value={form.codigo}
                disabled={!!editing}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                placeholder="PRIMER_CONTACTO"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="etapa-orden" className="text-xs font-medium text-neutral-600">
                Orden
              </label>
              <input
                id="etapa-orden"
                type="number"
                min={1}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.orden}
                onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label htmlFor="etapa-operador" className="text-xs font-medium text-neutral-600">
                Operador
              </label>
              <select
                id="etapa-operador"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.operador}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    operador: e.target.value as "IA" | "BOT" | "HUMANO" | "SISTEMA",
                  }))
                }
              >
                <option value="IA">🤖 IA (Nico)</option>
                <option value="BOT">⚙️ BOT</option>
                <option value="HUMANO">👤 HUMANO</option>
                <option value="SISTEMA">⚡ SISTEMA</option>
              </select>
            </div>
          </div>

          {form.operador === "BOT" && (
            <div>
              <label htmlFor="etapa-bot" className="text-xs font-medium text-neutral-600">
                Bot vinculado
              </label>
              <select
                id="etapa-bot"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.bot_id}
                onChange={(e) => setForm((f) => ({ ...f, bot_id: e.target.value }))}
              >
                <option value="">Sin bot</option>
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="etapa-objetivo" className="text-xs font-medium text-neutral-600">
              Objetivo (se inyecta en prompt de Nico)
            </label>
            <textarea
              id="etapa-objetivo"
              rows={2}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.objetivo}
              onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
              placeholder="Ej: Identificar nombre y número de documento del lead"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="etapa-espera" className="text-xs font-medium text-neutral-600">
                Tiempo espera (horas)
              </label>
              <input
                id="etapa-espera"
                type="number"
                min={1}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.tiempo_espera_horas}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tiempo_espera_horas: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label htmlFor="etapa-intentos" className="text-xs font-medium text-neutral-600">
                Max intentos recordatorio
              </label>
              <input
                id="etapa-intentos"
                type="number"
                min={1}
                max={10}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.max_intentos_recordatorio}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_intentos_recordatorio: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-600 mb-1">Color</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    form.color === c ? "border-neutral-900 scale-125" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {editing && (
            <label className="flex items-center gap-2 cursor-pointer text-sm pt-1">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              />
              Activo
            </label>
          )}
        </div>

        <div className="flex gap-2 mt-5">
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
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SortableEtapaRow ─────────────────────────────────────────────────────────

function SortableEtapaRow({
  etapa,
  allEtapas,
  onEdit,
  onDelete,
}: {
  etapa: CrmEtapaDto;
  allEtapas: CrmEtapaDto[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showTrans, setShowTrans] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: etapa.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-neutral-300 hover:text-neutral-500 shrink-0"
          title="Arrastrar para reordenar"
        >
          ⠿
        </button>

        <span className="w-6 text-xs text-neutral-400 text-center shrink-0">{etapa.orden}</span>

        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: etapa.color ?? "#9ca3af" }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{etapa.nombre}</span>
            <span className="text-xs text-neutral-400 font-mono">{etapa.codigo}</span>
          </div>
        </div>

        <span className="shrink-0 text-sm" title={etapa.operador}>
          {OPERADOR_ICONS[etapa.operador]}
        </span>

        <span className="shrink-0 text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
          {etapa.leads_count} leads
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowTrans((v) => !v)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Transiciones
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-primary-600 hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={etapa.leads_count > 0}
            className="text-xs text-red-500 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
            title={etapa.leads_count > 0 ? "No se puede eliminar con leads activos" : "Eliminar"}
          >
            Eliminar
          </button>
        </div>
      </div>

      {showTrans && (
        <div className="px-12 pb-3">
          <TransicionesSection etapa={etapa} allEtapas={allEtapas} />
        </div>
      )}
    </div>
  );
}

// ─── ConfigEtapasPage ─────────────────────────────────────────────────────────

export function ConfigEtapasPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useEtapas();
  const { mutate: deleteEtapa } = useDeleteEtapa();
  const { mutate: updateEtapa } = useUpdateEtapa();

  const [sorted, setSorted] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CrmEtapaDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rawEtapas = (data?.data ?? []).sort((a, b) => a.orden - b.orden);
  const etapas =
    sorted.length > 0
      ? sorted.map((id) => rawEtapas.find((e) => e.id === id)!).filter(Boolean)
      : rawEtapas;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = etapas.map((e) => e.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, oldIdx, newIdx);
    setSorted(newIds);
    // Update orden for each moved etapa
    newIds.forEach((id: string, idx: number) => {
      updateEtapa({ id, data: { orden: idx + 1 } });
    });
  }

  if (isLoading) return <div className="text-sm text-neutral-400">Cargando etapas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Etapas del pipeline</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-700"
        >
          + Nueva etapa
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-500">
          <span className="w-4 shrink-0" />
          <span className="w-6 shrink-0">#</span>
          <span className="w-3 shrink-0" />
          <span className="flex-1">Nombre / Código</span>
          <span>Op.</span>
          <span>Leads</span>
          <span>Acciones</span>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={etapas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {etapas.map((etapa) => (
              <SortableEtapaRow
                key={etapa.id}
                etapa={etapa}
                allEtapas={etapas}
                onEdit={() => {
                  setEditing(etapa);
                  setShowModal(true);
                }}
                onDelete={() => setDeleteId(etapa.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {etapas.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">No hay etapas</p>
        )}
      </div>

      {showModal && (
        <EtapaModal
          editing={editing}
          nextOrden={etapas.length + 1}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-sm font-medium mb-4">¿Eliminar esta etapa?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-neutral-200 rounded-lg py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEtapa(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
