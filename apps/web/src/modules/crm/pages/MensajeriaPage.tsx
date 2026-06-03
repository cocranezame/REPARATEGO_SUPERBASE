import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  useEnviarMensajeInterno,
  useMarcarLeido,
  useMensajeriaInterna,
  useMensajesConUsuario,
} from "../hooks/useCrm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── ChatInterno ──────────────────────────────────────────────────────────────

function ChatInterno({ usuarioId, onBack }: { usuarioId: string; onBack?: () => void }) {
  const me = useAuthStore((s) => s.user);
  const { data: mensajesData } = useMensajesConUsuario(usuarioId);
  const { mutate: enviar, isPending } = useEnviarMensajeInterno();
  const { mutate: marcarLeido } = useMarcarLeido();

  const [texto, setTexto] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const { data: usuariosData } = useUsuarios({});
  const destUser = (usuariosData?.data ?? []).find((u) => u.id === usuarioId);

  const mensajes = mensajesData?.data ?? [];

  // Mark unread messages as read
  useEffect(() => {
    for (const m of mensajes) {
      if (!m.leido && m.remitente_id === usuarioId) {
        marcarLeido(m.id);
      }
    }
  }, [mensajes, usuarioId, marcarLeido]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when message count changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  function handleSend() {
    if (!texto.trim() || isPending) return;
    enviar(
      { destinatario_id: usuarioId, contenido: texto.trim() },
      { onSuccess: () => setTexto("") }
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-neutral-500 hover:text-neutral-900 text-sm mr-1"
          >
            ←
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
          {destUser?.nombres?.[0] ?? "?"}
        </div>
        <div>
          <p className="text-sm font-medium">
            {destUser ? `${destUser.nombres} ${destUser.apellidos}` : usuarioId}
          </p>
          {destUser && <p className="text-xs text-neutral-400">{destUser.rol}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-neutral-50">
        {mensajes.map((m) => {
          const isMe = m.remitente_id === me?.id;
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-xs lg:max-w-sm ${
                isMe ? "items-end self-end" : "items-start self-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-green-100 text-green-900 rounded-tr-none"
                    : "bg-white text-neutral-900 border border-neutral-200 rounded-tl-none"
                }`}
              >
                {m.contenido}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-neutral-400">{msgTime(m.created_at)}</span>
                {isMe && (
                  <span className={`text-xs ${m.leido ? "text-blue-500" : "text-neutral-300"}`}>
                    {m.leido ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {mensajes.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">Sin mensajes aún</p>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Escribe un mensaje..."
            value={texto}
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
            disabled={!texto.trim() || isPending}
            onClick={handleSend}
            className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-primary-700"
          >
            {isPending ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MensajeriaPage ───────────────────────────────────────────────────────────

export function MensajeriaPage() {
  const { usuarioId: paramId } = useParams<{ usuarioId?: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");

  const { data: convData } = useMensajeriaInterna();
  const { data: usuariosData } = useUsuarios({ pageSize: 100 });

  const convs = convData?.data ?? [];
  const allUsers = (usuariosData?.data ?? []).filter((u) => u.id !== me?.id);

  // Merge: conversations + users not yet in conversations
  const convUserIds = new Set(convs.map((c) => c.usuario_id));
  const newUsers = allUsers.filter((u) => !convUserIds.has(u.id));

  const selectedId = paramId ?? "";
  const showList = !selectedId;

  const filteredConvs = search
    ? convs.filter((c) => (c.usuario_nombre ?? "").toLowerCase().includes(search.toLowerCase()))
    : convs;

  const filteredNew = search
    ? newUsers.filter((u) =>
        `${u.nombres} ${u.apellidos}`.toLowerCase().includes(search.toLowerCase())
      )
    : newUsers;

  return (
    <div className="flex h-full min-h-0 overflow-hidden -m-4 lg:-m-6">
      {/* LEFT PANEL */}
      <div
        className={`flex flex-col border-r border-neutral-200 bg-white ${
          selectedId ? "hidden lg:flex lg:w-72" : "flex w-full lg:w-72"
        }`}
      >
        <div className="shrink-0 p-3 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-900 mb-2">Mensajería interna</p>
          <input
            type="search"
            placeholder="Buscar empleado..."
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Active conversations */}
          {filteredConvs.map((conv) => (
            <button
              key={conv.usuario_id}
              type="button"
              onClick={() => navigate(`/crm/mensajeria/${conv.usuario_id}`)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-neutral-50 transition-colors hover:bg-neutral-50 ${
                selectedId === conv.usuario_id ? "bg-primary-50" : ""
              }`}
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                {(conv.usuario_nombre ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium truncate">
                    {conv.usuario_nombre ?? conv.usuario_id}
                  </span>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {relTime(conv.ultimo_at)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">{conv.ultimo_mensaje ?? "—"}</p>
              </div>
              {conv.no_leidos > 0 && (
                <span className="shrink-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {conv.no_leidos}
                </span>
              )}
            </button>
          ))}

          {/* Users without conversations */}
          {filteredNew.length > 0 && (
            <>
              <div className="px-3 py-2 bg-neutral-50 border-y border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Otros empleados
                </p>
              </div>
              {filteredNew.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => navigate(`/crm/mensajeria/${u.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${
                    selectedId === u.id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="shrink-0 w-9 h-9 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-semibold">
                    {u.nombres[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {u.nombres} {u.apellidos}
                    </p>
                    <p className="text-xs text-neutral-400">{u.rol}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {filteredConvs.length === 0 && filteredNew.length === 0 && (
            <p className="p-4 text-sm text-neutral-400 text-center">Sin resultados</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`flex-1 flex flex-col min-h-0 min-w-0 ${showList ? "hidden lg:flex" : "flex"}`}
      >
        {selectedId ? (
          <ChatInterno
            key={selectedId}
            usuarioId={selectedId}
            onBack={() => navigate("/crm/mensajeria")}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
            Selecciona un empleado para chatear
          </div>
        )}
      </div>
    </div>
  );
}
