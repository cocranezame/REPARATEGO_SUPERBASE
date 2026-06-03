import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";

function formatDistanceToNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

import { useNavigate } from "react-router-dom";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  useEtapas,
  useEtiquetas,
  useLeads,
  useMoverEtapaLead,
  useTransiciones,
} from "../hooks/useCrm";
import type { CrmEtapaDto, LeadDto, LeadsParams } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function activityBorder(updatedAt: string): string {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const hrs = diff / (1000 * 3600);
  if (hrs < 24) return "border-l-4 border-l-green-400";
  if (hrs < 48) return "border-l-4 border-l-yellow-400";
  return "border-l-4 border-l-red-400";
}

function utmIcon(source: string | null): string | null {
  if (!source) return null;
  if (source.toLowerCase().includes("meta") || source.toLowerCase().includes("facebook"))
    return "📘";
  if (source.toLowerCase().includes("tiktok")) return "🎵";
  if (source.toLowerCase().includes("google")) return "🔍";
  return "🌐";
}

function operadorIcon(operador: string): string {
  if (operador === "IA") return "🤖";
  if (operador === "BOT") return "⚙️";
  if (operador === "HUMANO") return "👤";
  return "⚡";
}

// ─── LeadCard (draggable) ─────────────────────────────────────────────────────

function LeadCard({ lead, isDragging = false }: { lead: LeadDto; isDragging?: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const visibleEtiquetas = lead.etiquetas.slice(0, 3);
  const extraEtiquetas = lead.etiquetas.length - 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-3 mb-2 cursor-grab select-none ${activityBorder(lead.updated_at)} ${
        isDragging ? "opacity-50" : "hover:shadow-md"
      }`}
    >
      {/* Drag handle area */}
      <div {...listeners} className="mb-2">
        <div className="flex items-start justify-between gap-1">
          <span className="text-sm font-medium text-neutral-900 truncate">
            {lead.nombre ?? lead.celular}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {utmIcon(lead.utm_source) && (
              <span title={lead.utm_source ?? ""}>{utmIcon(lead.utm_source)}</span>
            )}
            {lead.vendedor_nombre && (
              <span
                className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center shrink-0"
                title={lead.vendedor_nombre}
              >
                {lead.vendedor_nombre[0]}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">{formatDistanceToNow(lead.updated_at)}</p>
      </div>

      {/* Etiquetas */}
      {lead.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleEtiquetas.map((e) => (
            <span
              key={e.etiqueta_id}
              className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full truncate max-w-20"
            >
              {e.nombre}
            </span>
          ))}
          {extraEtiquetas > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-neutral-200 text-neutral-500 rounded-full">
              +{extraEtiquetas}
            </span>
          )}
        </div>
      )}

      {/* Click to navigate — separate from drag */}
      <button
        type="button"
        className="mt-2 text-xs text-primary-600 hover:underline w-full text-left"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => navigate(`/crm/leads/${lead.id}`)}
      >
        Ver ficha →
      </button>
    </div>
  );
}

// ─── KanbanColumn (droppable) ─────────────────────────────────────────────────

function KanbanColumn({
  etapa,
  leads,
  dragError,
}: {
  etapa: CrmEtapaDto;
  leads: LeadDto[];
  dragError: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });

  const bgColor = etapa.color ? `${etapa.color}20` : "#f8fafc";

  return (
    <div className="shrink-0 w-60 flex flex-col rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-1"
        style={{ backgroundColor: etapa.color ? `${etapa.color}30` : "#f1f5f9" }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span title={etapa.operador}>{operadorIcon(etapa.operador)}</span>
          <span
            className="text-xs font-semibold truncate"
            style={{ color: etapa.color ?? "#374151" }}
          >
            {etapa.nombre}
          </span>
        </div>
        <span className="shrink-0 text-xs bg-white rounded-full px-2 py-0.5 font-medium text-neutral-600">
          {leads.length}
        </span>
      </div>

      {dragError && <div className="bg-red-50 text-red-600 text-xs px-2 py-1">{dragError}</div>}

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 min-h-24 transition-colors ${
          isOver ? "bg-primary-50" : ""
        }`}
        style={{ backgroundColor: isOver ? undefined : bgColor }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

// ─── DragValidation — reads transitions for origin etapa ─────────────────────

function useDragValidation(draggedLeadId: string | null, leads: LeadDto[]) {
  const draggedLead = leads.find((l) => l.id === draggedLeadId);
  const origenEtapaId = draggedLead?.etapa_id ?? "";
  const { data: transData } = useTransiciones(origenEtapaId);
  const allowedDestinos = new Set((transData?.data ?? []).map((t) => t.etapa_destino_id));
  return { allowedDestinos, origenEtapaId };
}

// ─── LeadsKanbanPage ──────────────────────────────────────────────────────────

export function LeadsKanbanPage() {
  const { data: etapasData } = useEtapas();
  const etapas = (etapasData?.data ?? []).filter((e) => e.activo).sort((a, b) => a.orden - b.orden);

  const [filterParams, setFilterParams] = useState<LeadsParams>({ activo: true, pageSize: 200 });
  const [search, setSearch] = useState("");
  const { data: leadsData, isLoading } = useLeads(filterParams);

  const { data: etiquetasData } = useEtiquetas();
  const { data: usuariosData } = useUsuarios({});

  const { mutate: moverEtapa } = useMoverEtapaLead();

  const allLeads = leadsData?.data ?? [];
  const filtered = search
    ? allLeads.filter(
        (l) =>
          (l.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
          l.celular.includes(search)
      )
    : allLeads;

  const leadsByEtapa: Record<string, LeadDto[]> = {};
  for (const etapa of etapas) {
    leadsByEtapa[etapa.id] = filtered.filter((l) => l.etapa_id === etapa.id);
  }

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragErrors, setDragErrors] = useState<Record<string, string>>({});
  const { allowedDestinos } = useDragValidation(activeDragId, allLeads);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activeLead = allLeads.find((l) => l.id === activeDragId);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDragErrors({});
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const leadId = active.id as string;
    const destinoEtapaId = over.id as string;
    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead || lead.etapa_id === destinoEtapaId) return;

    if (!allowedDestinos.has(destinoEtapaId)) {
      const origen = etapas.find((e) => e.id === lead.etapa_id)?.nombre ?? "origen";
      const destino = etapas.find((e) => e.id === destinoEtapaId)?.nombre ?? "destino";
      setDragErrors({
        [destinoEtapaId]: `No permitido: ${origen} → ${destino}`,
      });
      setTimeout(() => setDragErrors({}), 3000);
      return;
    }

    moverEtapa({ id: leadId, data: { etapa_destino_id: destinoEtapaId } });
  }

  const etiquetas = etiquetasData?.data ?? [];
  const vendedores = (usuariosData?.data ?? []).filter(
    (u) => u.rol === "VENDEDOR" || u.rol === "ADMIN"
  );

  return (
    <div className="flex flex-col h-full min-h-0 -m-4 lg:-m-6 overflow-hidden">
      {/* Filters bar */}
      <div className="shrink-0 bg-white border-b border-neutral-200 px-4 py-3 flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Buscar lead..."
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
          value={filterParams.vendedor_id ?? ""}
          onChange={(e) =>
            setFilterParams((p) => ({
              ...p,
              ...(e.target.value ? { vendedor_id: e.target.value } : { vendedor_id: undefined }),
            }))
          }
        >
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombres} {v.apellidos}
            </option>
          ))}
        </select>

        <select
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
          value={filterParams.utm_source ?? ""}
          onChange={(e) =>
            setFilterParams((p) => ({
              ...p,
              ...(e.target.value ? { utm_source: e.target.value } : { utm_source: undefined }),
            }))
          }
        >
          <option value="">Todos los canales UTM</option>
          <option value="meta">Meta</option>
          <option value="tiktok">TikTok</option>
          <option value="google">Google</option>
          <option value="organic">Orgánico</option>
        </select>

        {isLoading && <span className="text-xs text-neutral-400">Cargando...</span>}
        <span className="text-xs text-neutral-400 ml-auto">{filtered.length} leads</span>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-4 h-full min-w-max">
            {etapas.map((etapa) => (
              <KanbanColumn
                key={etapa.id}
                etapa={etapa}
                leads={leadsByEtapa[etapa.id] ?? []}
                dragError={dragErrors[etapa.id] ?? null}
              />
            ))}
          </div>

          <DragOverlay>{activeLead ? <LeadCard lead={activeLead} isDragging /> : null}</DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
