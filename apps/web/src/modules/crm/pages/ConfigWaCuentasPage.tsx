import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  useCreateWaCuenta,
  useDeleteWaCuenta,
  useUpdateWaCuenta,
  useWaCuentas,
} from "../hooks/useCrm";
import type { WaCuentaDto } from "../types/crm";

// ─── WaCuentaModal ────────────────────────────────────────────────────────────

function WaCuentaModal({ editing, onClose }: { editing: WaCuentaDto | null; onClose: () => void }) {
  const { mutate: create, isPending: creating } = useCreateWaCuenta();
  const { mutate: update, isPending: updating } = useUpdateWaCuenta();

  const [form, setForm] = useState({
    negocio_nombre: editing?.negocio_nombre ?? "",
    phone_number_id: editing?.phone_number_id ?? "",
    waba_id: editing?.waba_id ?? "",
    access_token: "",
    webhook_verify_token: editing?.webhook_verify_token ?? "",
    nombre: editing?.nombre ?? "",
    activo: editing?.activo ?? true,
  });

  const isPending = creating || updating;

  function handleSubmit() {
    if (editing) {
      update(
        {
          id: editing.id,
          data: {
            negocio_nombre: form.negocio_nombre || undefined,
            ...(form.access_token ? { access_token: form.access_token } : {}),
            webhook_verify_token: form.webhook_verify_token || undefined,
            nombre: form.nombre || undefined,
            activo: form.activo,
          },
        },
        { onSuccess: onClose }
      );
    } else {
      create(
        {
          negocio_nombre: form.negocio_nombre,
          phone_number_id: form.phone_number_id,
          waba_id: form.waba_id,
          access_token: form.access_token,
          webhook_verify_token: form.webhook_verify_token,
          ...(form.nombre ? { nombre: form.nombre } : {}),
        },
        { onSuccess: onClose }
      );
    }
  }

  const canSubmit =
    !isPending &&
    form.negocio_nombre &&
    form.webhook_verify_token &&
    (editing || (form.phone_number_id && form.waba_id && form.access_token));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold mb-5">
          {editing ? "Editar cuenta WhatsApp" : "Nueva cuenta WhatsApp"}
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="wa-negocio" className="text-xs font-medium text-neutral-600">
              Negocio *
            </label>
            <input
              id="wa-negocio"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.negocio_nombre}
              onChange={(e) => setForm((f) => ({ ...f, negocio_nombre: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="wa-nombre" className="text-xs font-medium text-neutral-600">
              Nombre descriptivo
            </label>
            <input
              id="wa-nombre"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Línea principal"
            />
          </div>
          {!editing && (
            <>
              <div>
                <label htmlFor="wa-phone" className="text-xs font-medium text-neutral-600">
                  Phone Number ID *
                </label>
                <input
                  id="wa-phone"
                  type="text"
                  className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono"
                  value={form.phone_number_id}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="wa-waba" className="text-xs font-medium text-neutral-600">
                  WABA ID *
                </label>
                <input
                  id="wa-waba"
                  type="text"
                  className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono"
                  value={form.waba_id}
                  onChange={(e) => setForm((f) => ({ ...f, waba_id: e.target.value }))}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="wa-token" className="text-xs font-medium text-neutral-600">
              Access Token {editing ? "(dejar vacío para no cambiar)" : "*"}
            </label>
            <input
              id="wa-token"
              type="password"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              value={form.access_token}
              placeholder={editing ? "••••••••••••" : ""}
              onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="wa-verify" className="text-xs font-medium text-neutral-600">
              Webhook Verify Token *
            </label>
            <input
              id="wa-verify"
              type="text"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono"
              value={form.webhook_verify_token}
              onChange={(e) => setForm((f) => ({ ...f, webhook_verify_token: e.target.value }))}
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

// ─── ConfigWaCuentasPage ──────────────────────────────────────────────────────

export function ConfigWaCuentasPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useWaCuentas();
  const { mutate: deleteCuenta } = useDeleteWaCuenta();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WaCuentaDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  const cuentas = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Cuentas WhatsApp</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-700"
        >
          + Nueva cuenta
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
                <th className="px-4 py-3 font-medium">Phone Number ID</th>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creación</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50">
                  <td className="px-4 py-3 font-medium">{c.nombre ?? c.negocio_nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    {c.phone_number_id}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.negocio_nombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.activo ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(c.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(c);
                          setShowModal(true);
                        }}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(c.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cuentas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                    No hay cuentas configuradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <WaCuentaModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-sm font-medium mb-4">
              ¿Eliminar esta cuenta WhatsApp? Esta acción no se puede deshacer.
            </p>
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
                  deleteCuenta(deleteId);
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
