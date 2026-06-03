import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  useAsignarEtiquetasLead,
  useAsignarVendedorLead,
  useConversacion,
  useCreateNotaLead,
  useEtiquetas,
  useLead,
  useMensajesConversacion,
  useMoverEtapaLead,
  useTransiciones,
} from "../hooks/useCrm";
import type { EventoCrmDto, LeadDto, MensajeDto } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function msgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function _msgDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoy";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

// ─── Tab — Información ────────────────────────────────────────────────────────

function TabInfo({ lead }: { lead: LeadDto }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === "ADMIN";

  const { mutate: moverEtapa, isPending: moviendo } = useMoverEtapaLead();
  const { mutate: asignarVendedor } = useAsignarVendedorLead();
  const { data: transData } = useTransiciones(lead.etapa_id);
  const { data: usuariosData } = useUsuarios({});

  const transiciones = transData?.data ?? [];
  const vendedores = (usuariosData?.data ?? []).filter(
    (u) => u.rol === "VENDEDOR" || u.rol === "ADMIN"
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Datos personales */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Datos personales
        </h3>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-neutral-500">Nombre</dt>
            <dd className="text-sm font-medium">{lead.nombre ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Celular</dt>
            <dd className="text-sm font-medium">{lead.celular}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Ubicación</dt>
            <dd className="text-sm font-medium">{lead.ubicacion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Creado</dt>
            <dd className="text-sm">{fmtDateTime(lead.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Última actividad</dt>
            <dd className="text-sm">{fmtDateTime(lead.updated_at)}</dd>
          </div>
        </dl>
      </section>

      {/* Datos capturados */}
      {(lead.equipo_descripcion || lead.falla_descripcion) && (
        <section>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            Datos capturados
          </h3>
          <dl className="grid grid-cols-1 gap-2">
            {lead.equipo_descripcion && (
              <div>
                <dt className="text-xs text-neutral-500">Equipo</dt>
                <dd className="text-sm">{lead.equipo_descripcion}</dd>
              </div>
            )}
            {lead.falla_descripcion && (
              <div>
                <dt className="text-xs text-neutral-500">Falla</dt>
                <dd className="text-sm">{lead.falla_descripcion}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* UTM */}
      {(lead.utm_source || lead.utm_campaign || lead.utm_medium) && (
        <section>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            UTM
          </h3>
          <div className="flex flex-wrap gap-2">
            {lead.utm_source && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                source: {lead.utm_source}
              </span>
            )}
            {lead.utm_campaign && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                campaign: {lead.utm_campaign}
              </span>
            )}
            {lead.utm_medium && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                medium: {lead.utm_medium}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Etapa */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Etapa
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            {lead.etapa_nombre ?? "—"}
          </span>
          {transiciones.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {transiciones.map((t) => (
                <button
                  key={t.etapa_destino_id}
                  type="button"
                  disabled={moviendo}
                  onClick={() =>
                    moverEtapa({ id: lead.id, data: { etapa_destino_id: t.etapa_destino_id } })
                  }
                  className="text-xs px-2 py-1 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  → {t.destino_nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vendedor */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Vendedor asignado
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm">{lead.vendedor_nombre ?? "Sin asignar"}</span>
          {isAdmin && (
            <select
              className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
              value={lead.vendedor_id ?? ""}
              onChange={(e) => {
                if (!e.target.value) return;
                asignarVendedor({ id: lead.id, data: { vendedor_id: e.target.value } });
              }}
            >
              <option value="">Cambiar vendedor...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombres} {v.apellidos}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {/* Cliente vinculado */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Cliente vinculado
        </h3>
        {lead.cliente_id ? (
          <Link to={`/clientes/${lead.cliente_id}`} className="text-sm text-primary-600 underline">
            Ver cliente →
          </Link>
        ) : (
          <p className="text-sm text-neutral-500">Lead aún no convertido a cliente.</p>
        )}
      </section>

      {/* Actions */}
      <section className="flex gap-2 pt-2">
        <Link
          to={`/crm/inbox`}
          className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Ir al inbox
        </Link>
      </section>
    </div>
  );
}

// ─── Tab — Conversación (solo lectura + notas) ────────────────────────────────

function TabConversacion({ lead }: { lead: LeadDto }) {
  const convId = lead.eventos.find((e) => e.conversacion_id)?.conversacion_id ?? "";

  const { data: convData } = useConversacion(convId);
  const { data: mensajesData } = useMensajesConversacion(convId);
  const { mutate: crearNota, isPending } = useCreateNotaLead();

  const [notaTexto, setNotaTexto] = useState("");

  const conv = convData?.data;
  const allMensajes = (mensajesData?.pages ?? []).flatMap((p) => p.data).reverse();

  type Item =
    | { kind: "msg"; data: MensajeDto }
    | { kind: "nota"; data: (typeof lead.notas)[number] };

  const timeline: Item[] = [
    ...allMensajes.map((m): Item => ({ kind: "msg", data: m })),
    ...lead.notas.map((n): Item => ({ kind: "nota", data: n })),
  ].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());

  if (!convId) {
    return <p className="text-sm text-neutral-500">Este lead no tiene conversación registrada.</p>;
  }

  const BUBBLE_CLASSES: Record<string, string> = {
    CLIENTE: "self-start bg-neutral-100 text-neutral-900 rounded-tl-none",
    NICO: "self-end bg-blue-100 text-blue-900 rounded-tr-none",
    VENDEDOR: "self-end bg-green-100 text-green-900 rounded-tr-none",
    BOT: "self-end bg-purple-100 text-purple-900 rounded-tr-none",
    SISTEMA: "self-center bg-neutral-200 text-neutral-600 text-xs rounded-full px-3 py-1",
  };

  return (
    <div className="flex flex-col max-w-2xl gap-4">
      {/* Status */}
      {conv && (
        <p className="text-xs text-neutral-400">
          Estado: <span className="font-medium">{conv.estado}</span> · Modo:{" "}
          <span className="font-medium">{conv.modo}</span>
        </p>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto border border-neutral-100 rounded-xl p-3 bg-neutral-50">
        {timeline.map((item) => {
          if (item.kind === "nota") {
            const n = item.data;
            const isNico = n.origen === "NICO";
            return (
              <div
                key={n.id}
                className={`flex flex-col px-3 py-2 rounded-xl text-xs max-w-xs lg:max-w-sm ${
                  isNico
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <span className="font-semibold mb-0.5">
                  📝 {isNico ? "Nota de Nico:" : `Nota de vendedor:`}
                </span>
                <span>{n.contenido}</span>
                <span className="text-neutral-400 mt-1">{fmtDateTime(n.created_at)}</span>
              </div>
            );
          }

          const m = item.data;
          const isSistema = m.origen === "SISTEMA";
          const cls = BUBBLE_CLASSES[m.origen] ?? BUBBLE_CLASSES.CLIENTE;
          const isOut = m.direccion === "SALIENTE";

          if (isSistema) {
            return (
              <div key={m.id} className="flex justify-center">
                <span className={cls}>{m.contenido}</span>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-xs lg:max-w-sm ${isOut ? "items-end self-end" : "items-start self-start"}`}
            >
              <div className={`px-3 py-2 rounded-2xl text-sm ${cls}`}>{m.contenido}</div>
              <span className="text-xs text-neutral-400 mt-0.5">{msgTime(m.created_at)}</span>
            </div>
          );
        })}

        {timeline.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">Sin mensajes</p>
        )}
      </div>

      {/* Add note */}
      <div className="border border-neutral-200 rounded-xl p-3 bg-white">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Agregar nota interna</p>
        <div className="flex gap-2">
          <textarea
            rows={2}
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Escribe una nota..."
            value={notaTexto}
            onChange={(e) => setNotaTexto(e.target.value)}
          />
          <button
            type="button"
            disabled={!notaTexto.trim() || isPending}
            onClick={() => {
              crearNota(
                { id: lead.id, data: { contenido: notaTexto.trim(), origen: "VENDEDOR" } },
                { onSuccess: () => setNotaTexto("") }
              );
            }}
            className="text-sm px-3 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700 self-end"
          >
            {isPending ? "..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab — Etiquetas ──────────────────────────────────────────────────────────

const GRUPOS = ["IDENTIFICACION", "RUTA_ACTIVA", "CAPTURA_DATOS", "ESTADO_OPERATIVO"] as const;

const GRUPO_LABELS: Record<string, string> = {
  IDENTIFICACION: "Identificación",
  RUTA_ACTIVA: "Ruta activa",
  CAPTURA_DATOS: "Captura de datos",
  ESTADO_OPERATIVO: "Estado operativo",
};

function TabEtiquetas({ lead }: { lead: LeadDto }) {
  const { data: etiquetasData } = useEtiquetas();
  const { mutate: asignarEtiquetas } = useAsignarEtiquetasLead();

  const allEtiquetas = etiquetasData?.data ?? [];
  const asignadasIds = new Set(lead.etiquetas.map((e) => e.etiqueta_id));

  function toggle(etiquetaId: string) {
    const set = new Set(asignadasIds);
    if (set.has(etiquetaId)) {
      set.delete(etiquetaId);
    } else {
      set.add(etiquetaId);
    }
    asignarEtiquetas({
      id: lead.id,
      data: { etiqueta_ids: Array.from(set), asignado_por: "VENDEDOR" },
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {GRUPOS.map((grupo) => {
        const etiquetasGrupo = allEtiquetas.filter((e) => e.grupo === grupo && e.activo);
        if (etiquetasGrupo.length === 0) return null;
        return (
          <section key={grupo}>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              {GRUPO_LABELS[grupo]}
            </h3>
            <div className="flex flex-wrap gap-2">
              {etiquetasGrupo.map((e) => {
                const isActive = asignadasIds.has(e.id);
                const asignacion = lead.etiquetas.find((le) => le.etiqueta_id === e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggle(e.id)}
                    className={`flex flex-col items-start px-3 py-2 rounded-xl border text-xs transition-colors ${
                      isActive
                        ? "bg-primary-100 border-primary-400 text-primary-800"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="font-medium">{e.nombre}</span>
                    {isActive && asignacion && (
                      <span className="text-neutral-400 text-xs mt-0.5">
                        por {asignacion.asignado_por}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Tab — Servicios ──────────────────────────────────────────────────────────

function TabServicios({ lead }: { lead: LeadDto }) {
  if (!lead.cliente_id) {
    return <p className="text-sm text-neutral-500">Lead no convertido a cliente aún.</p>;
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-neutral-500 mb-2">
        Para ver los servicios vinculados, visita el perfil del cliente.
      </p>
      <Link to={`/clientes/${lead.cliente_id}`} className="text-sm text-primary-600 underline">
        Ver servicios del cliente →
      </Link>
    </div>
  );
}

// ─── Tab — Timeline ───────────────────────────────────────────────────────────

const TIPO_ICONS: Record<string, string> = {
  ETAPA_CAMBIADA: "↗️",
  DERIVACION: "👤",
  CLIENTE_CREADO: "✅",
  SERVICIO_CREADO: "🔧",
  ERROR_AGENTE: "🚨",
  MENSAJE_ENVIADO: "💬",
  MENSAJE_RECIBIDO: "📩",
};

function TabTimeline({ lead }: { lead: LeadDto }) {
  const eventos: EventoCrmDto[] = [...lead.eventos].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (eventos.length === 0) {
    return <p className="text-sm text-neutral-500">Sin eventos registrados.</p>;
  }

  return (
    <div className="max-w-2xl">
      <ol className="relative border-l border-neutral-200 ml-3 space-y-4">
        {eventos.map((ev) => {
          const icon = TIPO_ICONS[ev.tipo] ?? "📌";
          const isError = ev.tipo === "ERROR_AGENTE";
          return (
            <li key={ev.id} className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-neutral-200 text-sm">
                {icon}
              </span>
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isError ? "bg-red-50 border-red-200" : "bg-white border-neutral-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-medium ${isError ? "text-red-700" : "text-neutral-900"}`}>
                    {ev.tipo.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {fmtDateTime(ev.created_at)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Por: <span className="font-medium">{ev.origen}</span>
                </p>
                {ev.datos !== null && typeof ev.datos === "object" ? (
                  <pre className="text-xs text-neutral-500 mt-1 overflow-x-auto">
                    {JSON.stringify(ev.datos, null, 2)}
                  </pre>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── LeadDetallePage ──────────────────────────────────────────────────────────

type Tab = "info" | "conversacion" | "etiquetas" | "servicios" | "timeline";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Información" },
  { id: "conversacion", label: "Conversación" },
  { id: "etiquetas", label: "Etiquetas" },
  { id: "servicios", label: "Servicios" },
  { id: "timeline", label: "Timeline" },
];

export function LeadDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { data, isLoading, isError } = useLead(id ?? "");
  const lead = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-neutral-400 text-sm">
        Cargando...
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="p-4">
        <p className="text-red-600 text-sm">Lead no encontrado.</p>
        <button
          type="button"
          onClick={() => navigate("/crm/leads")}
          className="mt-2 text-sm text-primary-600 underline"
        >
          ← Volver al kanban
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/crm/leads")}
            className="text-sm text-neutral-500 hover:text-neutral-900 mb-1"
          >
            ← Volver al kanban
          </button>
          <h1 className="text-xl font-bold text-neutral-900">{lead.nombre ?? lead.celular}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-neutral-500">{lead.celular}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {lead.etapa_nombre ?? "—"}
            </span>
            {lead.vendedor_nombre && (
              <span className="text-xs text-neutral-400">Vendedor: {lead.vendedor_nombre}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600 font-medium"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === "info" && <TabInfo lead={lead} />}
        {activeTab === "conversacion" && <TabConversacion lead={lead} />}
        {activeTab === "etiquetas" && <TabEtiquetas lead={lead} />}
        {activeTab === "servicios" && <TabServicios lead={lead} />}
        {activeTab === "timeline" && <TabTimeline lead={lead} />}
      </div>
    </div>
  );
}
