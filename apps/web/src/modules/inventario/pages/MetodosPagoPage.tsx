import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateMetodoPago,
  useDeleteMetodoPago,
  useMetodosPago,
  useUpdateMetodoPago,
} from "../hooks/useInventario";
import type { MetodoPagoDto } from "../types/inventario";

const metodoPagoFormSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(50),
  activo: z.boolean(),
});
type MetodoPagoFormValues = z.infer<typeof metodoPagoFormSchema>;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

function MetodoPagoModal({
  metodo,
  onClose,
}: {
  metodo: MetodoPagoDto | null;
  onClose: () => void;
}) {
  const isEdit = metodo !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateMetodoPago();
  const updateMutation = useUpdateMetodoPago();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MetodoPagoFormValues>({
    resolver: zodResolver(metodoPagoFormSchema),
    defaultValues: {
      nombre: metodo?.nombre ?? "",
      activo: metodo?.activo ?? true,
    },
  });

  function onSubmit(values: MetodoPagoFormValues) {
    setServerError(null);
    if (isEdit) {
      updateMutation.mutate(
        { id: metodo.id, nombre: values.nombre, activo: values.activo },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
      );
    } else {
      createMutation.mutate(
        { nombre: values.nombre },
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
            {isEdit ? "Editar método de pago" : "Nuevo método de pago"}
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
              <label htmlFor="mp-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="mp-nombre"
                type="text"
                placeholder="Efectivo, Yape, Plin..."
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            {isEdit && (
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  {...register("activo")}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600"
                />
                Activo
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

export function MetodosPagoPage() {
  const { data, isLoading, isError } = useMetodosPago();
  const deleteMutation = useDeleteMetodoPago();
  const [modal, setModal] = useState<MetodoPagoDto | null | "new">(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Métodos de pago</h1>
        <button
          type="button"
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo método
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger-600">
            Error al cargar métodos de pago.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
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
                  <td colSpan={3} className="py-10 text-center text-neutral-500">
                    No hay métodos de pago registrados.
                  </td>
                </tr>
              )}
              {data?.data.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{m.nombre}</td>
                  <td className="px-4 py-3">
                    {m.activo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal(m)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(m.id)}
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
            <p className="text-sm text-neutral-900">¿Eliminar este método de pago?</p>
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
        <MetodoPagoModal metodo={modal === "new" ? null : modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
