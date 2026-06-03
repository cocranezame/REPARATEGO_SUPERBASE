import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  useCreateEtiqueta,
  useDeleteEtiqueta,
  useEtiquetas,
  useUpdateEtiqueta,
} from "../hooks/useCrm";
import type { CrmEtiquetaDto } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Grupo = "IDENTIFICACION" | "RUTA_ACTIVA" | "CAPTURA_DATOS" | "ESTADO_OPERATIVO";

const GRUPOS: { id: Grupo; label: string; headerColor: string }[] = [
  {
    id: "IDENTIFICACION",
    label: "Identificación",
    headerColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "RUTA_ACTIVA",
    label: "Ruta activa",
    headerColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "CAPTURA_DATOS",
    label: "Captura de datos",
    headerColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "ESTADO_OPERATIVO",
    label: "Estado operativo",
    headerColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
];

// ─── EtiquetaModal ────────────────────────────────────────────────────────────

function EtiquetaModal({
  editing,
  defaultGrupo,
  onClose,
}: {
  editing: CrmEtiquetaDto | null;
  defaultGrupo: Grupo;
  onClose: () => void;
}) {
  const { mutate: create, isPending: creating } = useCreateEtiqueta();
  const { mutate: update, isPending: updating } = useUpdateEtiqueta();

  const [form, setForm] = useState({
    nombre: editing?.nombre ?? "",
    codigo: editing?.codigo ?? "",
    grupo: (editing?.grupo ?? defaultGrupo) as Grupo,
    descripcion: editing?.descripcion ?? "",
    activo: editing?.activo ?? true,
  });

  const isPending = creating || updating;

  function handleSubmit() {
    if (editing) {
      update(
        {
          id: editing.id,
          data: {
            nombre: form.nombre,
            grupo: form.grupo,
            descripcion: form.descripcion || undefined,
            activo: form.activo,
          },
        },
        { onSuccess: onClose }
      );
    } else {
      create(
        {
          nombre: form.nombre,
          codigo: form.codigo,
          grupo: form.grupo,
          descripcion: form.descripcion || undefined,
        },
        { onSuccess: onClose }
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold mb-5">
          {editing ? "Editar etiqueta" : "Nueva etiqueta"}
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="etq-nombre" className="text-xs font-medium text-neutral-600">
              Nombre *
            </label>
            <input
              id="etq-nombre"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="etq-codigo" className="text-xs font-medium text-neutral-600">
              Código *
            </label>
            <input
              id="etq-codigo"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono uppercase disabled:bg-neutral-50"
              value={form.codigo}
              disabled={!!editing}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label htmlFor="etq-grupo" className="text-xs font-medium text-neutral-600">
              Grupo
            </label>
            <select
              id="etq-grupo"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.grupo}
              onChange={(e) => setForm((f) => ({ ...f, grupo: e.target.value as Grupo }))}
            >
              {GRUPOS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="etq-desc" className="text-xs font-medium text-neutral-600">
              Descripción (criterio de asignación)
            </label>
            <textarea
              id="etq-desc"
              rows={2}
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          {editing && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
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
            disabled={!form.nombre || (!editing && !form.codigo) || isPending}
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

// ─── ConfigEtiquetasPage ──────────────────────────────────────────────────────

export function ConfigEtiquetasPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useEtiquetas();
  const { mutate: deleteEtq } = useDeleteEtiqueta();
  const { mutate: updateEtq } = useUpdateEtiqueta();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CrmEtiquetaDto | null>(null);
  const [defaultGrupo, setDefaultGrupo] = useState<Grupo>("IDENTIFICACION");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  const etiquetas = data?.data ?? [];

  function toggleCollapse(grupo: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(grupo)) next.delete(grupo);
      else next.add(grupo);
      return next;
    });
  }

  if (isLoading) return <div className="text-sm text-neutral-400">Cargando etiquetas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Etiquetas</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDefaultGrupo("IDENTIFICACION");
            setShowModal(true);
          }}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-700"
        >
          + Nueva etiqueta
        </button>
      </div>

      <div className="space-y-4">
        {GRUPOS.map(({ id: grupoId, label, headerColor }) => {
          const items = etiquetas.filter((e) => e.grupo === grupoId);
          const isOpen = !collapsed.has(grupoId);

          return (
            <div
              key={grupoId}
              className={`rounded-xl border overflow-hidden ${headerColor.split(" ").find((c) => c.startsWith("border-")) ?? "border-neutral-200"}`}
            >
              <button
                type="button"
                onClick={() => toggleCollapse(grupoId)}
                className={`w-full flex items-center justify-between px-4 py-3 font-medium text-sm border-b ${headerColor}`}
              >
                <span>
                  {label}
                  <span className="ml-2 text-xs font-normal opacity-70">
                    ({items.length} etiquetas)
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(null);
                      setDefaultGrupo(grupoId);
                      setShowModal(true);
                    }}
                    className="text-xs underline opacity-80 hover:opacity-100"
                  >
                    + Agregar
                  </button>
                  <span>{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="bg-white divide-y divide-neutral-50">
                  {items.map((etq) => (
                    <div
                      key={etq.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{etq.nombre}</span>
                          <span className="text-xs text-neutral-400 font-mono">{etq.codigo}</span>
                        </div>
                        {etq.descripcion && (
                          <p className="text-xs text-neutral-500 truncate mt-0.5">
                            {etq.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Toggle activo */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={etq.activo}
                        onClick={() => updateEtq({ id: etq.id, data: { activo: !etq.activo } })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                          etq.activo ? "bg-green-500" : "bg-neutral-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            etq.activo ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditing(etq);
                          setShowModal(true);
                        }}
                        className="text-xs text-primary-600 hover:underline shrink-0"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(etq.id)}
                        className="text-xs text-red-500 hover:underline shrink-0"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="px-4 py-3 text-sm text-neutral-400">
                      Sin etiquetas en este grupo
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <EtiquetaModal
          editing={editing}
          defaultGrupo={defaultGrupo}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-sm font-medium mb-4">¿Eliminar esta etiqueta?</p>
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
                  deleteEtq(deleteId);
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
