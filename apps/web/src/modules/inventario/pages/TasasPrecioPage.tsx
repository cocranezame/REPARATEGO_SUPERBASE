import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateTasaPrecio,
  useDeleteTasaPrecio,
  useTasasPrecio,
  useUpdateTasaPrecio,
} from "../hooks/useInventario";
import type { TasaPrecioDto } from "../types/inventario";

const tasaFormSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(50),
  porcentaje: z.string().min(1, "Requerido"),
  activo: z.boolean(),
});
type TasaFormValues = z.infer<typeof tasaFormSchema>;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

function TasaModal({ tasa, onClose }: { tasa: TasaPrecioDto | null; onClose: () => void }) {
  const isEdit = tasa !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateTasaPrecio();
  const updateMutation = useUpdateTasaPrecio();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TasaFormValues>({
    resolver: zodResolver(tasaFormSchema),
    defaultValues: {
      nombre: tasa?.nombre ?? "",
      porcentaje: tasa?.porcentaje ?? "",
      activo: tasa?.activo ?? true,
    },
  });

  function onSubmit(values: TasaFormValues) {
    setServerError(null);
    const porcentaje = Number.parseFloat(values.porcentaje);
    if (Number.isNaN(porcentaje)) {
      setServerError("Porcentaje inválido.");
      return;
    }
    if (isEdit) {
      updateMutation.mutate(
        { id: tasa.id, nombre: values.nombre, porcentaje, activo: values.activo },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
      );
    } else {
      createMutation.mutate(
        { nombre: values.nombre, porcentaje },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Editar tasa" : "Nueva tasa de precio"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="tf-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="tf-nombre"
                type="text"
                placeholder="Precio mayorista"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="tf-pct" className="text-xs font-medium text-neutral-700">
                Porcentaje (%)
              </label>
              <input
                id="tf-pct"
                type="number"
                step="0.01"
                min="0"
                placeholder="15.00"
                className={INPUT}
                {...register("porcentaje")}
              />
              {errors.porcentaje && (
                <span className="text-xs text-danger-600">{errors.porcentaje.message}</span>
              )}
            </div>
            {isEdit && (
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  {...register("activo")}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600"
                />
                Activa
              </label>
            )}
          </div>
          {serverError !== null && (
            <div className="mx-6 mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
              {serverError}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || isSubmitting}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TasasPrecioPage() {
  const { data, isLoading, isError } = useTasasPrecio();
  const deleteMutation = useDeleteTasaPrecio();
  const [modal, setModal] = useState<TasaPrecioDto | null | "new">(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Tasas de precio</h1>
        <button
          type="button"
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva tasa
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger-600">Error al cargar tasas.</p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Porcentaje
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-neutral-500">
                    No hay tasas registradas.
                  </td>
                </tr>
              )}
              {data?.data.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{t.nombre}</td>
                  <td className="px-4 py-3 text-right text-neutral-700">
                    {Number(t.porcentaje).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    {t.activo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal(t)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(t.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <p className="text-sm text-neutral-900">¿Eliminar esta tasa de precio?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingDeleteId !== null) {
                    deleteMutation.mutate(pendingDeleteId, {
                      onSuccess: () => setPendingDeleteId(null),
                    });
                  }
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-500 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal !== null && (
        <TasaModal tasa={modal === "new" ? null : modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
