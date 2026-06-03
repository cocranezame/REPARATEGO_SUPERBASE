import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  useCambiarModo,
  useConversacion,
  useConversaciones,
  useEnviarMensaje,
  useEnviarPlantilla,
  useLead,
  useMensajesConversacion,
  useMoverEtapaLead,
  usePlantillas,
  useTransiciones,
} from "../hooks/useCrm";
import type { ConversacionDto, ConversacionesParams, MensajeDto } from "../types/crm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

function msgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function msgDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoy";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function avatarInitial(name: string | null, celular: string): string {
  if (name) return name[0]?.toUpperCase() ?? "?";
  return celular[0] ?? "?";
}

// ─── BubbleColors ─────────────────────────────────────────────────────────────

const BUBBLE_MAP: Record<string, string> = {
  CLIENTE: "self-start bg-neutral-100 text-neutral-900 rounded-tl-none",
  NICO: "self-end bg-blue-600 text-white rounded-tr-none",
  VENDEDOR: "self-end bg-green-600 text-white rounded-tr-none",
  BOT: "self-end bg-purple-100 text-purple-900 rounded-tr-none",
  SISTEMA:
    "self-center bg-neutral-200 text-neutral-600 text-xs rounded-full px-3 py-1 max-w-xs text-center",
};

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: MensajeDto }) {
  const isSistema = msg.origen === "SISTEMA";
  const bubbleClass = BUBBLE_MAP[msg.origen] ?? BUBBLE_MAP.CLIENTE;

  if (isSistema) {
    return (
      <div className="flex justify-center my-1">
        <span className={bubbleClass}>{msg.contenido}</span>
      </div>
    );
  }

  const isOutgoing = msg.direccion === "SALIENTE";

  return (
    <div
      className={`flex flex-col max-w-xs lg:max-w-sm ${isOutgoing ? "items-end self-end" : "items-start self-start"}`}
    >
      {msg.origen === "NICO" && (
        <span className="text-xs text-neutral-400 mb-0.5 flex items-center gap-1">
          <span>🤖</span> Nico
        </span>
      )}
      {msg.origen === "BOT" && (
        <span className="text-xs text-neutral-400 mb-0.5 flex items-center gap-1">
          <span>⚙️</span> Bot
        </span>
      )}
      <div className={`px-3 py-2 rounded-2xl text-sm ${bubbleClass}`}>
        {msg.tipo === "LINK" ? (
          <a
            href={msg.contenido ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {msg.contenido}
          </a>
        ) : msg.tipo === "PLANTILLA" ? (
          <span className="flex items-center gap-1">
            <span>📋</span> {msg.contenido}
          </span>
        ) : msg.tipo === "IMAGEN" ? (
          <span className="italic text-sm opacity-70">(imagen)</span>
        ) : (
          <span>{msg.contenido}</span>
        )}
      </div>
      <span className={`text-xs mt-0.5 ${isOutgoing ? "text-neutral-400" : "text-neutral-400"}`}>
        {msgTime(msg.created_at)}
      </span>
    </div>
  );
}

// ─── ConversacionItem ─────────────────────────────────────────────────────────

function ConversacionItem({
  conv,
  selected,
  onClick,
}: {
  conv: ConversacionDto;
  selected: boolean;
  onClick: () => void;
}) {
  const etapaColor = conv.lead_etapa_id ? "#6366f1" : "#9ca3af";
  const displayName = conv.lead_nombre ?? conv.lead_celular;
  const hasOnlyNumber = !conv.lead_nombre;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-3 text-left border-b border-neutral-100 transition-colors ${
        selected ? "bg-primary-50 border-l-4 border-l-primary-500" : "hover:bg-neutral-50"
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-sm font-semibold text-neutral-700">
        {hasOnlyNumber ? "📱" : avatarInitial(conv.lead_nombre, conv.celular)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium text-neutral-900 truncate">{displayName}</span>
          <span className="text-xs text-neutral-400 shrink-0">
            {relativeTime(conv.ultimo_mensaje_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-neutral-500 truncate">
            {conv.ultimo_mensaje?.contenido ?? "—"}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {conv.mensajes_sin_leer > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {conv.mensajes_sin_leer}
              </span>
            )}
            <span title={conv.modo === "NICO" ? "Nico" : "Vendedor"}>
              {conv.modo === "NICO" ? "🤖" : "👤"}
            </span>
          </div>
        </div>
        {conv.lead_etapa_nombre && (
          <span
            className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: etapaColor }}
          >
            {conv.lead_etapa_nombre}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── ModalDerivacion ──────────────────────────────────────────────────────────

function ModalDerivacion({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (vendedorId: string, motivo: string) => void;
}) {
  const { data: usuariosData } = useUsuarios({});
  const [vendedorId, setVendedorId] = useState("");
  const [motivo, setMotivo] = useState("");

  const vendedores = (usuariosData?.data ?? []).filter(
    (u) => u.rol === "VENDEDOR" || u.rol === "ADMIN"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold mb-4">Derivar conversación</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="sel-vendedor" className="text-xs font-medium text-neutral-600">
              Vendedor
            </label>
            <select
              id="sel-vendedor"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="">Seleccionar vendedor...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombres} {v.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="txt-motivo" className="text-xs font-medium text-neutral-600">
              Motivo *
            </label>
            <textarea
              id="txt-motivo"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo de la derivación..."
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-neutral-200 rounded-lg py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!vendedorId || !motivo.trim()}
            onClick={() => onConfirm(vendedorId, motivo)}
            className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50"
          >
            Derivar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ModalPlantilla ───────────────────────────────────────────────────────────

function ModalPlantilla({
  conversacionId,
  onClose,
}: {
  conversacionId: string;
  onClose: () => void;
}) {
  const { data: plantillasData } = usePlantillas();
  const { mutate: enviarPlantilla, isPending } = useEnviarPlantilla();
  const [selectedId, setSelectedId] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});

  const aprobadas = (plantillasData?.data ?? []).filter((p) => p.estado_meta === "APROBADA");
  const selected = aprobadas.find((p) => p.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold mb-4">Enviar plantilla HSM</h3>
        <div className="space-y-3">
          <select
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setVars({});
            }}
          >
            <option value="">Seleccionar plantilla...</option>
            {aprobadas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {selected && (
            <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700">
              {selected.contenido}
            </div>
          )}
          {(selected?.variables ?? []).map((v) => (
            <div key={v}>
              <label
                htmlFor={`var-${v}`}
                className="text-xs font-medium text-neutral-600"
              >{`{{${v}}}`}</label>
              <input
                id={`var-${v}`}
                type="text"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={vars[v] ?? ""}
                onChange={(e) => setVars((prev) => ({ ...prev, [v]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-neutral-200 rounded-lg py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedId || isPending}
            onClick={() => {
              if (!selectedId) return;
              enviarPlantilla(
                {
                  id: selectedId,
                  data: { conversacion_id: conversacionId, variables_valores: vars },
                },
                { onSuccess: onClose }
              );
            }}
            className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

function ChatPanel({ conversacionId, onBack }: { conversacionId: string; onBack?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: convData } = useConversacion(conversacionId);
  const conv = convData?.data;

  const {
    data: mensajesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMensajesConversacion(conversacionId);

  const { mutate: enviarMensaje, isPending: enviando } = useEnviarMensaje();
  const { mutate: cambiarModo } = useCambiarModo();
  const { mutate: moverEtapa } = useMoverEtapaLead();
  const { data: transData } = useTransiciones(conv?.lead_etapa_id ?? "");

  const leadId = conv?.lead_id ?? "";
  const { data: leadData } = useLead(leadId);
  const lead = leadData?.data;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState("");
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [showDerivacion, setShowDerivacion] = useState(false);
  const [showPlantilla, setShowPlantilla] = useState(false);
  const [showCambiarEtapa, setShowCambiarEtapa] = useState(false);

  // Flatten pages — pages are ordered newest-first from API, reverse to show oldest on top
  const allMensajes = (mensajesData?.pages ?? []).flatMap((p) => p.data).reverse();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when message count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMensajes.length]);

  // Infinite scroll upward
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  // Check 24h window
  const ultimoEntrante = allMensajes
    .slice()
    .reverse()
    .find((m) => m.direccion === "ENTRANTE");
  const isVentanaCerrada =
    !ultimoEntrante ||
    Date.now() - new Date(ultimoEntrante.created_at).getTime() > 24 * 60 * 60 * 1000;

  function handleSend() {
    if (!texto.trim() || enviando) return;
    enviarMensaje(
      { id: conversacionId, data: { contenido: texto.trim() } },
      { onSuccess: () => setTexto("") }
    );
  }

  // Group messages by day for date separators
  const groupedMensajes: { date: string; msgs: MensajeDto[] }[] = [];
  for (const m of allMensajes) {
    const d = msgDate(m.created_at);
    const last = groupedMensajes[groupedMensajes.length - 1];
    if (last && last.date === d) {
      last.msgs.push(m);
    } else {
      groupedMensajes.push({ date: d, msgs: [m] });
    }
  }

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
        Cargando...
      </div>
    );
  }

  const displayName = conv.lead_nombre ?? conv.lead_celular;
  const transiciones = transData?.data ?? [];

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-neutral-200 bg-white flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-1 text-neutral-500 hover:text-neutral-900 text-sm"
            >
              ← Volver
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-neutral-900">{displayName}</span>
              <span className="text-xs text-neutral-500">{conv.lead_celular}</span>
              {conv.lead_etapa_nombre && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {conv.lead_etapa_nombre}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  conv.modo === "NICO" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}
              >
                {conv.modo === "NICO" ? "🤖 Nico" : "👤 Vendedor"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setShowDerivacion(true)}
              className="text-xs px-2 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              Derivar
            </button>
            {conv.modo === "NICO" ? null : (
              <button
                type="button"
                onClick={() => cambiarModo({ id: conversacionId, data: { modo: "NICO" } })}
                className="text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                → Nico
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCambiarEtapa((v) => !v)}
              className="relative text-xs px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              Etapa
              {showCambiarEtapa && transiciones.length > 0 && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-40">
                  {transiciones.map((t) => (
                    <button
                      key={t.etapa_destino_id}
                      type="button"
                      onClick={() => {
                        if (!leadId) return;
                        moverEtapa(
                          { id: leadId, data: { etapa_destino_id: t.etapa_destino_id } },
                          { onSuccess: () => setShowCambiarEtapa(false) }
                        );
                      }}
                      className="block w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      → {t.destino_nombre}
                    </button>
                  ))}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowPlantilla(true)}
              className="text-xs px-2 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              Plantilla
            </button>
            {user?.rol === "ADMIN" && (
              <button
                type="button"
                onClick={() => navigate(`/crm/leads/${leadId}`)}
                className="text-xs px-2 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                Ver lead
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSidePanel((v) => !v)}
              className="text-xs px-2 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hidden lg:block"
            >
              {showSidePanel ? "⊙" : "☰"}
            </button>
          </div>
        </div>

        {/* Banners */}
        {conv.modo === "NICO" && (
          <div className="shrink-0 bg-blue-50 text-blue-700 text-xs px-4 py-2 border-b border-blue-100">
            🤖 Nico está atendiendo esta conversación
          </div>
        )}
        {isVentanaCerrada && (
          <div className="shrink-0 bg-amber-50 text-amber-700 text-xs px-4 py-2 border-b border-amber-100 flex items-center justify-between">
            <span>⚠️ Ventana de 24h cerrada. Solo plantillas HSM disponibles.</span>
            <button type="button" onClick={() => setShowPlantilla(true)} className="ml-2 underline">
              Enviar plantilla
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-neutral-50"
        >
          <div ref={messagesTopRef} />
          {isFetchingNextPage && (
            <div className="text-center text-xs text-neutral-400 py-2">Cargando más...</div>
          )}
          {groupedMensajes.map(({ date, msgs }) => (
            <div key={date} className="flex flex-col gap-2">
              <div className="flex justify-center">
                <span className="text-xs text-neutral-400 bg-white px-3 py-1 rounded-full border border-neutral-200">
                  {date}
                </span>
              </div>
              {msgs.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-neutral-200 bg-white p-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-neutral-50"
              placeholder={isVentanaCerrada ? "Ventana 24h cerrada..." : "Escribe un mensaje..."}
              value={texto}
              disabled={isVentanaCerrada || conv.estado === "CERRADA"}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              disabled={!texto.trim() || enviando || isVentanaCerrada || conv.estado === "CERRADA"}
              onClick={handleSend}
              className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-primary-700"
            >
              {enviando ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {showSidePanel && lead && (
        <aside className="hidden lg:flex w-64 flex-col border-l border-neutral-200 bg-white overflow-y-auto shrink-0">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                Contacto
              </p>
              <p className="text-sm font-medium">{lead.nombre ?? "Sin nombre"}</p>
              <p className="text-xs text-neutral-500">{lead.celular}</p>
            </div>

            {(lead.equipo_descripcion || lead.falla_descripcion || lead.ubicacion) && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  Datos capturados
                </p>
                {lead.equipo_descripcion && (
                  <p className="text-xs">
                    <span className="font-medium">Equipo:</span> {lead.equipo_descripcion}
                  </p>
                )}
                {lead.falla_descripcion && (
                  <p className="text-xs">
                    <span className="font-medium">Falla:</span> {lead.falla_descripcion}
                  </p>
                )}
                {lead.ubicacion && (
                  <p className="text-xs">
                    <span className="font-medium">Ubicación:</span> {lead.ubicacion}
                  </p>
                )}
              </div>
            )}

            {(lead.utm_source || lead.utm_campaign) && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  UTM
                </p>
                <div className="flex flex-wrap gap-1">
                  {lead.utm_source && (
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                      {lead.utm_source}
                    </span>
                  )}
                  {lead.utm_campaign && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {lead.utm_campaign}
                    </span>
                  )}
                </div>
              </div>
            )}

            {lead.etiquetas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  Etiquetas
                </p>
                <div className="flex flex-wrap gap-1">
                  {lead.etiquetas.map((e) => (
                    <span
                      key={e.etiqueta_id}
                      className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full"
                    >
                      {e.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lead.vendedor_nombre && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  Vendedor
                </p>
                <p className="text-sm">{lead.vendedor_nombre}</p>
              </div>
            )}

            {lead.cliente_id && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  Cliente
                </p>
                <a
                  href={`/clientes/${lead.cliente_id}`}
                  className="text-xs text-primary-600 underline"
                >
                  Ver cliente →
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(`/crm/leads/${leadId}`)}
              className="w-full text-xs bg-primary-50 text-primary-700 rounded-lg py-2 hover:bg-primary-100"
            >
              Ver ficha completa →
            </button>
          </div>
        </aside>
      )}

      {/* Modals */}
      {showDerivacion && (
        <ModalDerivacion
          onClose={() => setShowDerivacion(false)}
          onConfirm={(_vendedorId, _motivo) => {
            cambiarModo(
              { id: conversacionId, data: { modo: "VENDEDOR" } },
              { onSuccess: () => setShowDerivacion(false) }
            );
          }}
        />
      )}
      {showPlantilla && (
        <ModalPlantilla conversacionId={conversacionId} onClose={() => setShowPlantilla(false)} />
      )}
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

function FilterBar({
  params,
  onChange,
}: {
  params: ConversacionesParams;
  onChange: (p: ConversacionesParams) => void;
}) {
  const { data: usuariosData } = useUsuarios({});

  const vendedores = (usuariosData?.data ?? []).filter(
    (u) => u.rol === "VENDEDOR" || u.rol === "ADMIN"
  );

  return (
    <div className="shrink-0 border-b border-neutral-100 bg-neutral-50 p-3 flex flex-wrap gap-2">
      <select
        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
        value={params.estado ?? ""}
        onChange={(e) =>
          onChange({
            ...params,
            ...(e.target.value
              ? { estado: e.target.value as "ACTIVA" | "CERRADA" }
              : { estado: undefined }),
          })
        }
      >
        <option value="">Todos los estados</option>
        <option value="ACTIVA">Activa</option>
        <option value="CERRADA">Cerrada</option>
      </select>

      <select
        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
        value={params.modo ?? ""}
        onChange={(e) =>
          onChange({
            ...params,
            ...(e.target.value
              ? { modo: e.target.value as "NICO" | "VENDEDOR" }
              : { modo: undefined }),
          })
        }
      >
        <option value="">Todos los modos</option>
        <option value="NICO">🤖 Nico</option>
        <option value="VENDEDOR">👤 Vendedor</option>
      </select>

      <select
        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
        value={params.vendedor_id ?? ""}
        onChange={(e) =>
          onChange({
            ...params,
            ...(e.target.value ? { vendedor_id: e.target.value } : { vendedor_id: undefined }),
          })
        }
      >
        <option value="">Todos los vendedores</option>
        {vendedores.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombres} {v.apellidos}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── InboxPage ────────────────────────────────────────────────────────────────

export function InboxPage() {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [params, setParams] = useState<ConversacionesParams>({ estado: "ACTIVA", pageSize: 50 });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useConversaciones(params);
  const conversaciones = data?.data ?? [];

  const filtered = search
    ? conversaciones.filter(
        (c) =>
          (c.lead_nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
          c.lead_celular.includes(search)
      )
    : conversaciones;

  const selectedId = paramId ?? "";

  // On mobile: show list when no conv selected, show chat when selected
  const showList = !selectedId;
  const showChat = !!selectedId;

  return (
    <div className="flex h-full min-h-0 overflow-hidden -m-4 lg:-m-6">
      {/* LEFT PANEL */}
      <div
        className={`flex flex-col border-r border-neutral-200 bg-white ${
          showChat ? "hidden lg:flex lg:w-80 xl:w-96" : "flex w-full lg:w-80 xl:w-96"
        }`}
      >
        {/* Search */}
        <div className="shrink-0 p-3 border-b border-neutral-100">
          <input
            type="search"
            placeholder="Buscar por nombre o número..."
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <FilterBar params={params} onChange={setParams} />

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="p-4 text-center text-sm text-neutral-400">Cargando...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-neutral-400">No hay conversaciones</div>
          )}
          {filtered.map((conv) => (
            <ConversacionItem
              key={conv.id}
              conv={conv}
              selected={conv.id === selectedId}
              onClick={() => navigate(`/crm/inbox/${conv.id}`)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`flex-1 flex flex-col min-h-0 min-w-0 ${showList ? "hidden lg:flex" : "flex"}`}
      >
        {selectedId ? (
          <ChatPanel conversacionId={selectedId} onBack={() => navigate("/crm/inbox")} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
            Selecciona una conversación
          </div>
        )}
      </div>
    </div>
  );
}
