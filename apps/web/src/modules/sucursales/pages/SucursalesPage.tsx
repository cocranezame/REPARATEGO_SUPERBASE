import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateSucursalInput, UpdateSucursalInput } from "@kallpasoft/validators";
import { createSucursalSchema } from "@kallpasoft/validators";
import { Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateSucursal,
  useDeleteSucursal,
  useSucursales,
  useUpdateSucursal,
} from "../hooks/useSucursales";
import type { SucursalDto, SucursalesParams } from "../types/sucursal";

// ─── Form schema ──────────────────────────────────────────────────────────────

const sucursalFormSchema = createSucursalSchema.extend({
  direccion: z.string().max(255, "Máximo 255 caracteres").or(z.literal("")),
  distrito: z.string().max(100, "Máximo 100 caracteres").or(z.literal("")),
  telefono: z.string().max(20, "Máximo 20 caracteres").or(z.literal("")),
  es_principal: z.boolean(),
});

type SucursalFormValues = z.infer<typeof sucursalFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Small components ─────────────────────────────────────────────────────────

function PrincipalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      Principal
    </span>
  );
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      Inactivo
    </span>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <p className="text-sm text-neutral-900">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-500 disabled:opacity-60"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SucursalModal ────────────────────────────────────────────────────────────

function SucursalModal({
  sucursal,
  onClose,
}: {
  sucursal: SucursalDto | null;
  onClose: () => void;
}) {
  const isEdit = sucursal !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateSucursal();
  const updateMutation = useUpdateSucursal();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SucursalFormValues>({
    resolver: zodResolver(sucursalFormSchema),
    defaultValues: {
      nombre: sucursal?.nombre ?? "",
      direccion: sucursal?.direccion ?? "",
      distrito: sucursal?.distrito ?? "",
      telefono: sucursal?.telefono ?? "",
      es_principal: sucursal?.es_principal ?? false,
    },
  });

  async function onSubmit(values: SucursalFormValues) {
    setServerError(null);
    if (sucursal !== null) {
      const input: UpdateSucursalInput = {
        nombre: values.nombre,
        es_principal: values.es_principal,
        ...(values.direccion !== "" ? { direccion: values.direccion } : {}),
        ...(values.distrito !== "" ? { distrito: values.distrito } : {}),
        ...(values.telefono !== "" ? { telefono: values.telefono } : {}),
      };
      updateMutation.mutate(
        { id: sucursal.id, ...input },
        {
          onSuccess: onClose,
          onError: (err) => setServerError(err.message),
        }
      );
    } else {
      const input: CreateSucursalInput = {
        nombre: values.nombre,
        es_principal: values.es_principal,
        ...(values.direccion !== "" ? { direccion: values.direccion } : {}),
        ...(values.distrito !== "" ? { distrito: values.distrito } : {}),
        ...(values.telefono !== "" ? { telefono: values.telefono } : {}),
      };
      createMutation.mutate(input, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Editar sucursal" : "Nueva sucursal"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            {/* nombre */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="sf-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="sf-nombre"
                type="text"
                placeholder="Sede Central"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>

            {/* direccion */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="sf-direccion" className="text-xs font-medium text-neutral-700">
                Dirección <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="sf-direccion"
                type="text"
                placeholder="Av. Lima 123"
                className={INPUT}
                {...register("direccion")}
              />
              {errors.direccion && (
                <span className="text-xs text-danger-600">{errors.direccion.message}</span>
              )}
            </div>

            {/* distrito */}
            <div className="flex flex-col gap-1">
              <label htmlFor="sf-distrito" className="text-xs font-medium text-neutral-700">
                Distrito <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="sf-distrito"
                type="text"
                placeholder="Los Olivos"
                className={INPUT}
                {...register("distrito")}
              />
              {errors.distrito && (
                <span className="text-xs text-danger-600">{errors.distrito.message}</span>
              )}
            </div>

            {/* telefono */}
            <div className="flex flex-col gap-1">
              <label htmlFor="sf-telefono" className="text-xs font-medium text-neutral-700">
                Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="sf-telefono"
                type="tel"
                placeholder="01 234 5678"
                className={INPUT}
                {...register("telefono")}
              />
              {errors.telefono && (
                <span className="text-xs text-danger-600">{errors.telefono.message}</span>
              )}
            </div>

            {/* es_principal */}
            <div className="col-span-2 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <input
                id="sf-es_principal"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                {...register("es_principal")}
              />
              <div>
                <label
                  htmlFor="sf-es_principal"
                  className="text-sm font-medium text-neutral-900 cursor-pointer"
                >
                  Sucursal principal
                </label>
                <p className="text-xs text-neutral-500">
                  Solo puede haber una sucursal principal por tenant.
                </p>
              </div>
            </div>
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

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export function SucursalesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editSucursal, setEditSucursal] = useState<SucursalDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: SucursalesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
  };

  const { data, isLoading, isError } = useSucursales(params);
  const deleteMutation = useDeleteSucursal();

  function openCreate() {
    setEditSucursal(null);
    setShowModal(true);
  }

  function openEdit(s: SucursalDto) {
    setEditSucursal(s);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setPendingDeleteId(null),
    });
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Sucursales</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva sucursal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, distrito o dirección..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Table card */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger-600">
            Error al cargar sucursales. Intenta recargar la página.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Dirección
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Distrito
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Principal
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
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No se encontraron sucursales.
                  </td>
                </tr>
              )}
              {data?.data.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-neutral-50 ${s.es_principal ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">{s.nombre}</td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {s.direccion ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {s.distrito ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {s.telefono ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.es_principal ? (
                      <PrincipalBadge />
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={s.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(s.id)}
                        title="Eliminar"
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

      {/* Pagination */}
      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} sucursal{meta.total !== 1 ? "es" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-xs">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar esta sucursal? Esta acción la desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Create / edit modal */}
      {showModal && <SucursalModal sucursal={editSucursal} onClose={closeModal} />}
    </div>
  );
}
