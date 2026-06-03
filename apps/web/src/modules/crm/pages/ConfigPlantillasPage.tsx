import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useCreatePlantilla, usePlantillas, useUpdatePlantilla } from "../hooks/useCrm";
import type { PlantillaDto } from "../types/crm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

function renderPreview(contenido: string, variables: string[]): string {
  let result = contenido;
  for (const v of variables) {
    result = result.replaceAll(`{{${v}}}`, `[${v}]`);
  }
  return result;
}

// ─── TagsInput ────────────────────────────────────────────────────────────────

function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  return (
    <div className="border border-neutral-200 rounded-lg px-3 py-2 min-h-10 flex flex-wrap gap-1 focus-within:ring-2 focus-within:ring-primary-500">
      {value.map((v) => (
        <span
          key={v}
          className="flex items-center gap-1 text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5"
        >
          {`{{${v}}}`}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="ml-0.5 text-primary-500 hover:text-primary-800"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-20 text-sm outline-none bg-transparent"
        placeholder="nombre, equipo… + Enter"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

// ─── PlantillaModal ───────────────────────────────────────────────────────────

function PlantillaModal({
  editing,
  onClose,
}: {
  editing: PlantillaDto | null;
  onClose: () => void;
}) {
  const { mutate: create, isPending: creating } = useCreatePlantilla();
  const { mutate: update, isPending: updating } = useUpdatePlantilla();

  const [form, setForm] = useState({
    nombre: editing?.nombre ?? "",
    contenido: editing?.contenido ?? "",
    variables: editing?.variables ?? [],
    meta_template_name: editing?.meta_template_name ?? "",
    estado_meta: editing?.estado_meta ?? "PENDIENTE",
  });

  const isPending = creating || updating;

  function handleSubmit() {
    const payload = {
      nombre: form.nombre,
      contenido: form.contenido,
      variables: form.variables.length > 0 ? form.variables : undefined,
      meta_template_name: form.meta_template_name || undefined,
    };

    if (editing) {
      update(
        {
          id: editing.id,
          data: payload,
        },
        { onSuccess: onClose }
      );
    } else {
      create(payload, { onSuccess: onClose });
    }
  }

  const preview = renderPreview(form.contenido, form.variables);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-4">
        <h3 className="text-base font-semibold mb-5">
          {editing ? "Editar plantilla" : "Nueva plantilla"}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: form */}
          <div className="space-y-3">
            <div>
              <label htmlFor="pla-nombre" className="text-xs font-medium text-neutral-600">
                Nombre *
              </label>
              <input
                id="pla-nombre"
                type="text"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="pla-contenido" className="text-xs font-medium text-neutral-600">
                Contenido (usa {"{{variable}}"} para variables)
              </label>
              <textarea
                id="pla-contenido"
                rows={5}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-y font-mono"
                value={form.contenido}
                onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                placeholder="Hola {{nombre}}, tu equipo {{equipo}} está listo..."
              />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-600">
                Variables (escribe y presiona Enter)
              </p>
              <div className="mt-1">
                <TagsInput
                  value={form.variables}
                  onChange={(v) => setForm((f) => ({ ...f, variables: v }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="pla-meta" className="text-xs font-medium text-neutral-600">
                Nombre template Meta (HSM)
              </label>
              <input
                id="pla-meta"
                type="text"
                className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono"
                value={form.meta_template_name}
                onChange={(e) => setForm((f) => ({ ...f, meta_template_name: e.target.value }))}
                placeholder="reparatego_listo"
              />
            </div>
            {editing && (
              <div>
                <label htmlFor="pla-estado" className="text-xs font-medium text-neutral-600">
                  Estado Meta
                </label>
                <select
                  id="pla-estado"
                  className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={form.estado_meta}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estado_meta: e.target.value as "PENDIENTE" | "APROBADA" | "RECHAZADA",
                    }))
                  }
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="APROBADA">APROBADA</option>
                  <option value="RECHAZADA">RECHAZADA</option>
                </select>
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div>
            <p className="text-xs font-medium text-neutral-600 mb-2">Preview</p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-700 min-h-32 whitespace-pre-wrap">
              {preview || <span className="text-neutral-400 italic">Escribe el contenido...</span>}
            </div>
            {form.variables.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-neutral-500 mb-1">Variables detectadas:</p>
                <div className="flex flex-wrap gap-1">
                  {form.variables.map((v) => (
                    <span
                      key={v}
                      className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full"
                    >
                      {`{{${v}}}`} → <span className="italic">[{v}]</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            disabled={!form.nombre || !form.contenido || isPending}
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

// ─── ConfigPlantillasPage ─────────────────────────────────────────────────────

export function ConfigPlantillasPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = usePlantillas();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PlantillaDto | null>(null);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  const plantillas = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Plantillas HSM</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-700"
        >
          + Nueva plantilla
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="text-left text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado Meta</th>
                <th className="px-4 py-3 font-medium">Variables</th>
                <th className="px-4 py-3 font-medium">Creación</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plantillas.map((p) => (
                <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        ESTADO_BADGE[p.estado_meta] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {p.estado_meta}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.variables ?? []).map((v) => (
                        <span
                          key={v}
                          className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(p.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setShowModal(true);
                      }}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {plantillas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                    Sin plantillas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <PlantillaModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
