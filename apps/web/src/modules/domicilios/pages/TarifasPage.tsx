import { AlertCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCreateTarifaDistrito,
  useDeleteTarifaDistrito,
  useTarifasDistrito,
  useUpdateTarifaDistrito,
} from "../hooks/useDomicilios";
import type { TarifaDistritoDto } from "../types/domicilios";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

type FormState = {
  distrito: string;
  provincia: string;
  tarifa: string;
};

const EMPTY_FORM: FormState = { distrito: "", provincia: "Lima", tarifa: "" };

export function TarifasPage() {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TarifaDistritoDto | null>(null);

  const { data, isLoading } = useTarifasDistrito({
    ...(search ? { search } : {}),
    activo: true,
  });
  const createMutation = useCreateTarifaDistrito();
  const updateMutation = useUpdateTarifaDistrito();
  const deleteMutation = useDeleteTarifaDistrito();

  const tarifas = data?.data ?? [];

  useEffect(() => {
    if (!editId) return;
    const tarifa = tarifas.find((t) => t.id === editId);
    if (tarifa) {
      setForm({
        distrito: tarifa.distrito,
        provincia: tarifa.provincia,
        tarifa: tarifa.tarifa,
      });
    }
  }, [editId, tarifas]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowCreate(false);
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const tarifa = Number(form.tarifa);
    if (Number.isNaN(tarifa) || tarifa <= 0) {
      setServerError("La tarifa debe ser un número positivo");
      return;
    }

    if (editId) {
      updateMutation.mutate(
        { id: editId, distrito: form.distrito, provincia: form.provincia, tarifa },
        {
          onSuccess: () => resetForm(),
          onError: (e) => setServerError(e.message),
        }
      );
    } else {
      createMutation.mutate(
        { distrito: form.distrito, provincia: form.provincia, tarifa },
        {
          onSuccess: () => resetForm(),
          onError: (e) => setServerError(e.message),
        }
      );
    }
  }

  function handleDelete(tarifa: TarifaDistritoDto) {
    setDeleteConfirm(tarifa);
  }

  function confirmDelete() {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm.id, {
      onSuccess: () => setDeleteConfirm(null),
      onError: (e) => setServerError(e.message),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Tarifas por distrito</h1>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm(EMPTY_FORM);
            setShowCreate(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva tarifa
        </button>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Buscador */}
      <div className="max-w-xs">
        <input
          id="search_tarifas"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar distrito…"
          className={INPUT}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Distrito
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Provincia
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                Tarifa (S/)
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : tarifas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-neutral-400">
                  Sin tarifas registradas
                </td>
              </tr>
            ) : (
              tarifas.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{t.distrito}</td>
                  <td className="px-4 py-3 text-neutral-600">{t.provincia}</td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {Number(t.tarifa).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => {
                          setShowCreate(true);
                          setEditId(t.id);
                        }}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => handleDelete(t)}
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {(showCreate || editId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editId ? "Editar tarifa" : "Nueva tarifa"}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {serverError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="modal_distrito"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Distrito *
                </label>
                <input
                  id="modal_distrito"
                  type="text"
                  required
                  value={form.distrito}
                  onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="modal_provincia"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Provincia
                </label>
                <input
                  id="modal_provincia"
                  type="text"
                  value={form.provincia}
                  onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="modal_tarifa"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Tarifa (S/) *
                </label>
                <input
                  id="modal_tarifa"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.tarifa}
                  onChange={(e) => setForm((f) => ({ ...f, tarifa: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isPending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Desactivar tarifa</h2>
            <p className="mb-4 text-sm text-neutral-600">
              ¿Desactivar la tarifa del distrito <strong>{deleteConfirm.distrito}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Eliminando…" : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
