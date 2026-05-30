import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateProveedorInput } from "@kallpasoft/validators";
import { Eye, Pencil, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  useCreateProveedor,
  useDeleteProveedor,
  useProveedores,
  useUpdateProveedor,
} from "../hooks/useProveedores";
import type { ProveedorDto, ProveedoresParams } from "../types/proveedor";

// ─── Form schema ──────────────────────────────────────────────────────────────

const proveedorFormSchema = z.object({
  ruc: z.string().length(11, "RUC debe tener 11 dígitos").regex(/^\d+$/, "Solo números"),
  razon_social: z.string().min(1, "Requerido").max(200),
  nombre_comercial: z.string().max(200).optional(),
  direccion: z.string().max(255).optional(),
  distrito: z.string().max(100).optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  telefono: z.string().max(20).optional(),
  web: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
  notas: z.string().optional(),
  calificacion: z.string().optional(),
});

type ProveedorFormValues = z.infer<typeof proveedorFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-neutral-400">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
        />
      ))}
    </div>
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

// ─── ProveedorModal ───────────────────────────────────────────────────────────

function ProveedorModal({
  proveedor,
  onClose,
}: {
  proveedor: ProveedorDto | null;
  onClose: () => void;
}) {
  const isEdit = proveedor !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorFormSchema),
    defaultValues: {
      ruc: proveedor?.ruc ?? "",
      razon_social: proveedor?.razon_social ?? "",
      nombre_comercial: proveedor?.nombre_comercial ?? "",
      direccion: proveedor?.direccion ?? "",
      distrito: proveedor?.distrito ?? "",
      email: proveedor?.email ?? "",
      telefono: proveedor?.telefono ?? "",
      web: proveedor?.web ?? "",
      notas: proveedor?.notas ?? "",
      calificacion:
        proveedor?.calificacion !== null && proveedor?.calificacion !== undefined
          ? String(proveedor.calificacion)
          : "",
    },
  });

  function buildBody(values: ProveedorFormValues) {
    return {
      ruc: values.ruc,
      razon_social: values.razon_social,
      ...(values.nombre_comercial ? { nombre_comercial: values.nombre_comercial } : {}),
      ...(values.direccion ? { direccion: values.direccion } : {}),
      ...(values.distrito ? { distrito: values.distrito } : {}),
      ...(values.email && values.email !== "" ? { email: values.email } : {}),
      ...(values.telefono ? { telefono: values.telefono } : {}),
      ...(values.web && values.web !== "" ? { web: values.web } : {}),
      ...(values.notas ? { notas: values.notas } : {}),
      ...(values.calificacion ? { calificacion: Number.parseInt(values.calificacion, 10) } : {}),
    };
  }

  async function onSubmit(values: ProveedorFormValues) {
    setServerError(null);
    const body = buildBody(values);

    if (isEdit) {
      updateMutation.mutate(
        { id: proveedor.id, ...body },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
      );
    } else {
      createMutation.mutate(body as CreateProveedorInput, {
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
            {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
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
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              {/* ruc */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-ruc" className="text-xs font-medium text-neutral-700">
                  RUC
                </label>
                <input
                  id="pf-ruc"
                  type="text"
                  placeholder="20123456789"
                  maxLength={11}
                  className={INPUT}
                  {...register("ruc")}
                />
                {errors.ruc && (
                  <span className="text-xs text-danger-600">{errors.ruc.message}</span>
                )}
              </div>

              {/* calificacion */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-calificacion" className="text-xs font-medium text-neutral-700">
                  Calificación <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <select id="pf-calificacion" className={SELECT} {...register("calificacion")}>
                  <option value="">Sin calificar</option>
                  <option value="1">1 ★</option>
                  <option value="2">2 ★★</option>
                  <option value="3">3 ★★★</option>
                  <option value="4">4 ★★★★</option>
                  <option value="5">5 ★★★★★</option>
                </select>
              </div>

              {/* razon_social */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-razon" className="text-xs font-medium text-neutral-700">
                  Razón social
                </label>
                <input
                  id="pf-razon"
                  type="text"
                  placeholder="Empresa SAC"
                  className={INPUT}
                  {...register("razon_social")}
                />
                {errors.razon_social && (
                  <span className="text-xs text-danger-600">{errors.razon_social.message}</span>
                )}
              </div>

              {/* nombre_comercial */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-nombre-com" className="text-xs font-medium text-neutral-700">
                  Nombre comercial <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-nombre-com"
                  type="text"
                  placeholder="Nombre conocido"
                  className={INPUT}
                  {...register("nombre_comercial")}
                />
              </div>

              {/* email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-email" className="text-xs font-medium text-neutral-700">
                  Email <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-email"
                  type="email"
                  placeholder="ventas@empresa.com"
                  className={INPUT}
                  {...register("email")}
                />
                {errors.email && (
                  <span className="text-xs text-danger-600">{errors.email.message}</span>
                )}
              </div>

              {/* telefono */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-telefono" className="text-xs font-medium text-neutral-700">
                  Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-telefono"
                  type="tel"
                  placeholder="01 234 5678"
                  className={INPUT}
                  {...register("telefono")}
                />
              </div>

              {/* web */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-web" className="text-xs font-medium text-neutral-700">
                  Web <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-web"
                  type="url"
                  placeholder="https://empresa.com"
                  className={INPUT}
                  {...register("web")}
                />
                {errors.web && (
                  <span className="text-xs text-danger-600">{errors.web.message}</span>
                )}
              </div>

              {/* distrito */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-distrito" className="text-xs font-medium text-neutral-700">
                  Distrito <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-distrito"
                  type="text"
                  placeholder="Los Olivos"
                  className={INPUT}
                  {...register("distrito")}
                />
              </div>

              {/* direccion */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-direccion" className="text-xs font-medium text-neutral-700">
                  Dirección <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-direccion"
                  type="text"
                  placeholder="Av. Industrial 123"
                  className={INPUT}
                  {...register("direccion")}
                />
              </div>

              {/* notas */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-notas" className="text-xs font-medium text-neutral-700">
                  Notas <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-notas"
                  type="text"
                  placeholder="Observaciones"
                  className={INPUT}
                  {...register("notas")}
                />
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

export function ProveedoresPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProveedor, setEditProveedor] = useState<ProveedorDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: ProveedoresParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
    ...(filterActivo !== "" ? { activo: filterActivo === "true" } : {}),
  };

  const { data, isLoading, isError } = useProveedores(params);
  const deleteMutation = useDeleteProveedor();

  function openCreate() {
    setEditProveedor(null);
    setShowModal(true);
  }

  function openEdit(p: ProveedorDto) {
    setEditProveedor(p);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setPendingDeleteId(null) });
  }

  function resetFilters() {
    setSearch("");
    setFilterActivo("");
    setPage(1);
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Proveedores</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Star className="h-4 w-4" />
          Nuevo proveedor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por RUC, razón social, nombre comercial..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={filterActivo}
          onChange={(e) => {
            setFilterActivo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Activos + Inactivos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        {(search !== "" || filterActivo !== "") && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            Limpiar
          </button>
        )}
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
            Error al cargar proveedores. Intenta recargar la página.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  RUC
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Razón social
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Nombre comercial
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Teléfono
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Calificación
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
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-neutral-900">{p.ruc}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.razon_social}</td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {p.nombre_comercial ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {p.telefono ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <StarRating value={p.calificacion} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={p.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/proveedores/${p.id}`)}
                        title="Ver detalle"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(p.id)}
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
            {meta.total} proveedor{meta.total !== 1 ? "es" : ""}
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
          message="¿Eliminar este proveedor? Esta acción lo desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Create / edit modal */}
      {showModal && <ProveedorModal proveedor={editProveedor} onClose={closeModal} />}
    </div>
  );
}
