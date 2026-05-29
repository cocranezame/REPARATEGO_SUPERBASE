import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateCategoriaInput,
  CreateComponenteInput,
  CreateMarcaInput,
  CreateModeloInput,
  UpdateCategoriaInput,
  UpdateComponenteInput,
  UpdateMarcaInput,
  UpdateModeloInput,
} from "@kallpasoft/validators";
import {
  createCategoriaSchema,
  createComponenteSchema,
  createMarcaSchema,
  createModeloSchema,
} from "@kallpasoft/validators";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
  useUpdateCategoria,
} from "../hooks/useCategorias";
import {
  useComponentes,
  useCreateComponente,
  useDeleteComponente,
  useUpdateComponente,
} from "../hooks/useComponentes";
import { useCreateMarca, useDeleteMarca, useMarcas, useUpdateMarca } from "../hooks/useMarcas";
import { useCreateModelo, useDeleteModelo, useModelos, useUpdateModelo } from "../hooks/useModelos";
import type { CategoriaDto, CategoriasParams } from "../types/categoria";
import type { ComponenteDto, ComponentesParams } from "../types/componente";
import type { MarcaDto, MarcasParams } from "../types/marca";
import type { ModeloDto, ModelosParams } from "../types/modelo";

// ─── Form schemas ─────────────────────────────────────────────────────────────

const categoriaFormSchema = createCategoriaSchema.extend({
  orden: z.number().int().min(0),
  descripcion: z.string().or(z.literal("")).optional(),
  categoria_padre_id: z.string().optional(),
});
type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

const componenteFormSchema = createComponenteSchema.extend({
  categoria_id: z.string().min(1, "Selecciona una categoría"),
  descripcion: z.string().or(z.literal("")).optional(),
});
type ComponenteFormValues = z.infer<typeof componenteFormSchema>;

const marcaFormSchema = createMarcaSchema.extend({
  logo_url: z.string().or(z.literal("")).optional(),
});
type MarcaFormValues = z.infer<typeof marcaFormSchema>;

const modeloFormSchema = createModeloSchema.extend({
  marca_id: z.string().min(1, "Selecciona una marca"),
  categoria_id: z.string().min(1, "Selecciona una categoría"),
});
type ModeloFormValues = z.infer<typeof modeloFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Shared components ────────────────────────────────────────────────────────

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

// ─── Categorías ───────────────────────────────────────────────────────────────

function CategoriaModal({
  categoria,
  onClose,
}: {
  categoria: CategoriaDto | null;
  onClose: () => void;
}) {
  const isEdit = categoria !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const allCatsQuery = useCategorias({ pageSize: 100 });
  const rootCategorias = (allCatsQuery.data?.data ?? []).filter(
    (c) => c.categoria_padre_id === null && c.id !== categoria?.id
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      descripcion: categoria?.descripcion ?? "",
      categoria_padre_id: categoria?.categoria_padre_id ?? "",
      orden: categoria?.orden ?? 0,
    },
  });

  async function onSubmit(values: CategoriaFormValues) {
    setServerError(null);
    const input: CreateCategoriaInput = {
      nombre: values.nombre,
      orden: values.orden,
      ...(values.descripcion !== "" && values.descripcion !== undefined
        ? { descripcion: values.descripcion }
        : {}),
      ...(values.categoria_padre_id !== "" && values.categoria_padre_id !== undefined
        ? { categoria_padre_id: values.categoria_padre_id }
        : {}),
    };
    if (isEdit) {
      const updateInput: UpdateCategoriaInput & { id: string } = { id: categoria.id, ...input };
      updateMutation.mutate(updateInput, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    } else {
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
            {isEdit ? "Editar categoría" : "Nueva categoría"}
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
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="cf-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="cf-nombre"
                type="text"
                placeholder="Pantallas"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="cf-descripcion" className="text-xs font-medium text-neutral-700">
                Descripción <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-descripcion"
                type="text"
                placeholder="Descripción de la categoría"
                className={INPUT}
                {...register("descripcion")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-padre" className="text-xs font-medium text-neutral-700">
                Categoría padre <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <select id="cf-padre" className={SELECT} {...register("categoria_padre_id")}>
                <option value="">Sin padre (raíz)</option>
                {rootCategorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-orden" className="text-xs font-medium text-neutral-700">
                Orden
              </label>
              <input
                id="cf-orden"
                type="number"
                min="0"
                className={INPUT}
                {...register("orden", { valueAsNumber: true })}
              />
              {errors.orden && (
                <span className="text-xs text-danger-600">{errors.orden.message}</span>
              )}
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

function CategoriasTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCategoria, setEditCategoria] = useState<CategoriaDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: CategoriasParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
  };

  const { data, isLoading, isError } = useCategorias(params);
  const allCatsQuery = useCategorias({ pageSize: 100 });
  const nombreMap = new Map(allCatsQuery.data?.data.map((c) => [c.id, c.nombre]) ?? []);
  const deleteMutation = useDeleteCategoria();

  function openCreate() {
    setEditCategoria(null);
    setShowModal(true);
  }
  function openEdit(c: CategoriaDto) {
    setEditCategoria(c);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
  }
  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setPendingDeleteId(null) });
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar categorías..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva
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
            Error al cargar categorías. Intenta recargar la página.
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
                  Descripción
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Padre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Orden
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
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    No se encontraron categorías.
                  </td>
                </tr>
              )}
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {c.categoria_padre_id !== null && (
                      <span className="mr-1 text-neutral-300">└</span>
                    )}
                    {c.nombre}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {c.descripcion ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {c.categoria_padre_id !== null
                      ? (nombreMap.get(c.categoria_padre_id) ??
                        `${c.categoria_padre_id.slice(0, 8)}…`)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{c.orden}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={c.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(c.id)}
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

      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} categoría{meta.total !== 1 ? "s" : ""}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar esta categoría? Esta acción la desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && <CategoriaModal categoria={editCategoria} onClose={closeModal} />}
    </div>
  );
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function ComponenteModal({
  componente,
  onClose,
}: {
  componente: ComponenteDto | null;
  onClose: () => void;
}) {
  const isEdit = componente !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateComponente();
  const updateMutation = useUpdateComponente();
  const allCatsQuery = useCategorias({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteFormSchema),
    defaultValues: {
      nombre: componente?.nombre ?? "",
      descripcion: componente?.descripcion ?? "",
      categoria_id: componente?.categoria_id ?? "",
    },
  });

  async function onSubmit(values: ComponenteFormValues) {
    setServerError(null);
    const input: CreateComponenteInput = {
      nombre: values.nombre,
      categoria_id: values.categoria_id,
      ...(values.descripcion !== "" && values.descripcion !== undefined
        ? { descripcion: values.descripcion }
        : {}),
    };
    if (isEdit) {
      const updateInput: UpdateComponenteInput & { id: string } = {
        id: componente.id,
        ...input,
      };
      updateMutation.mutate(updateInput, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    } else {
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
            {isEdit ? "Editar componente" : "Nuevo componente"}
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
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="comp-nombre"
                type="text"
                placeholder="Pantalla LCD"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-categoria" className="text-xs font-medium text-neutral-700">
                Categoría
              </label>
              <select id="comp-categoria" className={SELECT} {...register("categoria_id")}>
                <option value="">Selecciona una categoría</option>
                {(allCatsQuery.data?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.categoria_id && (
                <span className="text-xs text-danger-600">{errors.categoria_id.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comp-descripcion" className="text-xs font-medium text-neutral-700">
                Descripción <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="comp-descripcion"
                type="text"
                placeholder="Descripción del componente"
                className={INPUT}
                {...register("descripcion")}
              />
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

function ComponentesTab() {
  const [search, setSearch] = useState("");
  const [filterCategoriaId, setFilterCategoriaId] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editComponente, setEditComponente] = useState<ComponenteDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: ComponentesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
    ...(filterCategoriaId !== "" ? { categoria_id: filterCategoriaId } : {}),
  };

  const { data, isLoading, isError } = useComponentes(params);
  const allCatsQuery = useCategorias({ pageSize: 100 });
  const categoriaNombreMap = new Map(allCatsQuery.data?.data.map((c) => [c.id, c.nombre]) ?? []);
  const deleteMutation = useDeleteComponente();

  function openCreate() {
    setEditComponente(null);
    setShowModal(true);
  }
  function openEdit(c: ComponenteDto) {
    setEditComponente(c);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
  }
  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setPendingDeleteId(null) });
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar componentes..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={filterCategoriaId}
          onChange={(e) => {
            setFilterCategoriaId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Todas las categorías</option>
          {(allCatsQuery.data?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo
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
            Error al cargar componentes. Intenta recargar la página.
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
                  Categoría
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Descripción
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
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    No se encontraron componentes.
                  </td>
                </tr>
              )}
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {categoriaNombreMap.get(c.categoria_id) ?? `${c.categoria_id.slice(0, 8)}…`}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {c.descripcion ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={c.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(c.id)}
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

      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} componente{meta.total !== 1 ? "s" : ""}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar este componente? Esta acción lo desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && <ComponenteModal componente={editComponente} onClose={closeModal} />}
    </div>
  );
}

// ─── Marcas ───────────────────────────────────────────────────────────────────

function MarcaModal({ marca, onClose }: { marca: MarcaDto | null; onClose: () => void }) {
  const isEdit = marca !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateMarca();
  const updateMutation = useUpdateMarca();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaFormSchema),
    defaultValues: {
      nombre: marca?.nombre ?? "",
      logo_url: marca?.logo_url ?? "",
    },
  });

  async function onSubmit(values: MarcaFormValues) {
    setServerError(null);
    const input: CreateMarcaInput = {
      nombre: values.nombre,
      ...(values.logo_url !== "" && values.logo_url !== undefined
        ? { logo_url: values.logo_url }
        : {}),
    };
    if (isEdit) {
      const updateInput: UpdateMarcaInput & { id: string } = { id: marca.id, ...input };
      updateMutation.mutate(updateInput, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    } else {
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
            {isEdit ? "Editar marca" : "Nueva marca"}
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
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="mf-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="mf-nombre"
                type="text"
                placeholder="Samsung"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mf-logo" className="text-xs font-medium text-neutral-700">
                URL del logo <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="mf-logo"
                type="url"
                placeholder="https://ejemplo.com/logo.png"
                className={INPUT}
                {...register("logo_url")}
              />
              {errors.logo_url && (
                <span className="text-xs text-danger-600">{errors.logo_url.message}</span>
              )}
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

function MarcasTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editMarca, setEditMarca] = useState<MarcaDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: MarcasParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
  };

  const { data, isLoading, isError } = useMarcas(params);
  const deleteMutation = useDeleteMarca();

  function openCreate() {
    setEditMarca(null);
    setShowModal(true);
  }
  function openEdit(m: MarcaDto) {
    setEditMarca(m);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
  }
  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setPendingDeleteId(null) });
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar marcas..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva
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
            Error al cargar marcas. Intenta recargar la página.
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
                  Logo
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
                    No se encontraron marcas.
                  </td>
                </tr>
              )}
              {data?.data.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{m.nombre}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {m.logo_url !== null ? (
                      <img
                        src={m.logo_url}
                        alt={m.nombre}
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={m.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(m.id)}
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

      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} marca{meta.total !== 1 ? "s" : ""}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar esta marca? Esta acción la desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && <MarcaModal marca={editMarca} onClose={closeModal} />}
    </div>
  );
}

// ─── Modelos ──────────────────────────────────────────────────────────────────

function ModeloModal({ modelo, onClose }: { modelo: ModeloDto | null; onClose: () => void }) {
  const isEdit = modelo !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateModelo();
  const updateMutation = useUpdateModelo();
  const allMarcasQuery = useMarcas({ pageSize: 100 });
  const allCatsQuery = useCategorias({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModeloFormValues>({
    resolver: zodResolver(modeloFormSchema),
    defaultValues: {
      nombre: modelo?.nombre ?? "",
      marca_id: modelo?.marca_id ?? "",
      categoria_id: modelo?.categoria_id ?? "",
    },
  });

  async function onSubmit(values: ModeloFormValues) {
    setServerError(null);
    const input: CreateModeloInput = {
      nombre: values.nombre,
      marca_id: values.marca_id,
      categoria_id: values.categoria_id,
    };
    if (isEdit) {
      const updateInput: UpdateModeloInput & { id: string } = { id: modelo.id, ...input };
      updateMutation.mutate(updateInput, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    } else {
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
            {isEdit ? "Editar modelo" : "Nuevo modelo"}
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
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="mod-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="mod-nombre"
                type="text"
                placeholder="Galaxy S24"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mod-marca" className="text-xs font-medium text-neutral-700">
                Marca
              </label>
              <select id="mod-marca" className={SELECT} {...register("marca_id")}>
                <option value="">Selecciona una marca</option>
                {(allMarcasQuery.data?.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              {errors.marca_id && (
                <span className="text-xs text-danger-600">{errors.marca_id.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mod-categoria" className="text-xs font-medium text-neutral-700">
                Categoría
              </label>
              <select id="mod-categoria" className={SELECT} {...register("categoria_id")}>
                <option value="">Selecciona una categoría</option>
                {(allCatsQuery.data?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.categoria_id && (
                <span className="text-xs text-danger-600">{errors.categoria_id.message}</span>
              )}
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

function ModelosTab() {
  const [search, setSearch] = useState("");
  const [filterMarcaId, setFilterMarcaId] = useState("");
  const [filterCategoriaId, setFilterCategoriaId] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editModelo, setEditModelo] = useState<ModeloDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: ModelosParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
    ...(filterMarcaId !== "" ? { marca_id: filterMarcaId } : {}),
    ...(filterCategoriaId !== "" ? { categoria_id: filterCategoriaId } : {}),
  };

  const { data, isLoading, isError } = useModelos(params);
  const allMarcasQuery = useMarcas({ pageSize: 100 });
  const allCatsQuery = useCategorias({ pageSize: 100 });
  const marcaNombreMap = new Map(allMarcasQuery.data?.data.map((m) => [m.id, m.nombre]) ?? []);
  const categoriaNombreMap = new Map(allCatsQuery.data?.data.map((c) => [c.id, c.nombre]) ?? []);
  const deleteMutation = useDeleteModelo();

  function openCreate() {
    setEditModelo(null);
    setShowModal(true);
  }
  function openEdit(m: ModeloDto) {
    setEditModelo(m);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
  }
  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setPendingDeleteId(null) });
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar modelos..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={filterMarcaId}
          onChange={(e) => {
            setFilterMarcaId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Todas las marcas</option>
          {(allMarcasQuery.data?.data ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <select
          value={filterCategoriaId}
          onChange={(e) => {
            setFilterCategoriaId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Todas las categorías</option>
          {(allCatsQuery.data?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo
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
            Error al cargar modelos. Intenta recargar la página.
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
                  Marca
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Categoría
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
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    No se encontraron modelos.
                  </td>
                </tr>
              )}
              {data?.data.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{m.nombre}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {marcaNombreMap.get(m.marca_id) ?? `${m.marca_id.slice(0, 8)}…`}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {categoriaNombreMap.get(m.categoria_id) ?? `${m.categoria_id.slice(0, 8)}…`}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={m.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(m.id)}
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

      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} modelo{meta.total !== 1 ? "s" : ""}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar este modelo? Esta acción lo desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && <ModeloModal modelo={editModelo} onClose={closeModal} />}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "categorias" as const, label: "Categorías" },
  { id: "componentes" as const, label: "Componentes" },
  { id: "marcas" as const, label: "Marcas" },
  { id: "modelos" as const, label: "Modelos" },
];
type TabId = (typeof TABS)[number]["id"];

export function CatalogosPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categorias");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Catálogos</h1>

      <div className="flex border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "categorias" && <CategoriasTab />}
        {activeTab === "componentes" && <ComponentesTab />}
        {activeTab === "marcas" && <MarcasTab />}
        {activeTab === "modelos" && <ModelosTab />}
      </div>
    </div>
  );
}
