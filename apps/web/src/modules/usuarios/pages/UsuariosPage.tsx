import { zodResolver } from "@hookform/resolvers/zod";
import type { RolUsuario } from "@kallpasoft/shared";
import {
  RolUsuario as RolUsuarioEnum,
  TipoDocumento as TipoDocumentoEnum,
} from "@kallpasoft/shared";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "@kallpasoft/validators";
import { createUsuarioSchema } from "@kallpasoft/validators";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SucursalOption } from "../hooks/useUsuarios";
import {
  useCreateUsuario,
  useDeleteUsuario,
  useSucursalesOptions,
  useUpdateUsuario,
  useUsuarios,
} from "../hooks/useUsuarios";
import type { UsuarioDto, UsuariosParams } from "../types/usuario";

// ─── Form schemas ─────────────────────────────────────────────────────────────

const userFormSchema = createUsuarioSchema.omit({ password: true }).extend({
  password: z.string().min(8, "Mínimo 8 caracteres").or(z.literal("")),
  email: z.string().email("Email inválido").or(z.literal("")),
  telefono: z.string().max(20, "Máximo 20 caracteres").or(z.literal("")),
  sucursal_id: z.string().uuid("UUID inválido").or(z.literal("")),
});

const createFormSchema = userFormSchema.refine((d) => d.password !== "" && d.password.length >= 8, {
  message: "La contraseña es requerida (mínimo 8 caracteres)",
  path: ["password"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROL_COLORS: Record<RolUsuario, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  TECNICO: "bg-amber-100 text-amber-700",
  VENDEDOR: "bg-violet-100 text-violet-700",
  CAJERO: "bg-emerald-100 text-emerald-700",
  ASISTENTE: "bg-cyan-100 text-cyan-700",
  ALMACEN: "bg-orange-100 text-orange-700",
};

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Small components ─────────────────────────────────────────────────────────

function RolBadge({ rol }: { rol: RolUsuario }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROL_COLORS[rol]}`}
    >
      {rol}
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

// ─── UsuarioModal ─────────────────────────────────────────────────────────────

function UsuarioModal({
  usuario,
  sucursales,
  onClose,
}: {
  usuario: UsuarioDto | null;
  sucursales: SucursalOption[];
  onClose: () => void;
}) {
  const isEdit = usuario !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? userFormSchema : createFormSchema),
    defaultValues: {
      tipo_documento: usuario?.tipo_documento ?? TipoDocumentoEnum.DNI,
      numero_documento: usuario?.numero_documento ?? "",
      nombres: usuario?.nombres ?? "",
      apellidos: usuario?.apellidos ?? "",
      email: usuario?.email ?? "",
      telefono: usuario?.telefono ?? "",
      password: "",
      rol: usuario?.rol ?? RolUsuarioEnum.TECNICO,
      sucursal_id: usuario?.sucursal_id ?? "",
    },
  });

  async function onSubmit(values: UserFormValues) {
    setServerError(null);
    if (usuario !== null) {
      const input: UpdateUsuarioInput = {
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        nombres: values.nombres,
        apellidos: values.apellidos,
        rol: values.rol,
        ...(values.email !== "" ? { email: values.email } : {}),
        ...(values.telefono !== "" ? { telefono: values.telefono } : {}),
        ...(values.sucursal_id !== "" ? { sucursal_id: values.sucursal_id } : {}),
      };
      updateMutation.mutate(
        { id: usuario.id, ...input },
        {
          onSuccess: onClose,
          onError: (err) => setServerError(err.message),
        }
      );
    } else {
      const input: CreateUsuarioInput = {
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        nombres: values.nombres,
        apellidos: values.apellidos,
        password: values.password,
        rol: values.rol,
        ...(values.email !== "" ? { email: values.email } : {}),
        ...(values.telefono !== "" ? { telefono: values.telefono } : {}),
        ...(values.sucursal_id !== "" ? { sucursal_id: values.sucursal_id } : {}),
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
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
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
            {/* tipo_documento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-tipo_documento" className="text-xs font-medium text-neutral-700">
                Tipo doc.
              </label>
              <select id="f-tipo_documento" className={SELECT} {...register("tipo_documento")}>
                <option value={TipoDocumentoEnum.DNI}>DNI</option>
                <option value={TipoDocumentoEnum.RUC}>RUC</option>
                <option value={TipoDocumentoEnum.CE}>CE</option>
              </select>
              {errors.tipo_documento && (
                <span className="text-xs text-danger-600">{errors.tipo_documento.message}</span>
              )}
            </div>

            {/* numero_documento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-numero_documento" className="text-xs font-medium text-neutral-700">
                Número de documento
              </label>
              <input
                id="f-numero_documento"
                type="text"
                placeholder="12345678"
                className={INPUT}
                {...register("numero_documento")}
              />
              {errors.numero_documento && (
                <span className="text-xs text-danger-600">{errors.numero_documento.message}</span>
              )}
            </div>

            {/* nombres */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-nombres" className="text-xs font-medium text-neutral-700">
                Nombres
              </label>
              <input
                id="f-nombres"
                type="text"
                placeholder="Juan"
                className={INPUT}
                {...register("nombres")}
              />
              {errors.nombres && (
                <span className="text-xs text-danger-600">{errors.nombres.message}</span>
              )}
            </div>

            {/* apellidos */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-apellidos" className="text-xs font-medium text-neutral-700">
                Apellidos
              </label>
              <input
                id="f-apellidos"
                type="text"
                placeholder="Pérez"
                className={INPUT}
                {...register("apellidos")}
              />
              {errors.apellidos && (
                <span className="text-xs text-danger-600">{errors.apellidos.message}</span>
              )}
            </div>

            {/* email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-email" className="text-xs font-medium text-neutral-700">
                Email <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="f-email"
                type="email"
                placeholder="juan@ejemplo.com"
                className={INPUT}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-danger-600">{errors.email.message}</span>
              )}
            </div>

            {/* telefono */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-telefono" className="text-xs font-medium text-neutral-700">
                Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="f-telefono"
                type="tel"
                placeholder="987654321"
                className={INPUT}
                {...register("telefono")}
              />
              {errors.telefono && (
                <span className="text-xs text-danger-600">{errors.telefono.message}</span>
              )}
            </div>

            {/* rol */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-rol" className="text-xs font-medium text-neutral-700">
                Rol
              </label>
              <select id="f-rol" className={SELECT} {...register("rol")}>
                {Object.values(RolUsuarioEnum).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.rol && <span className="text-xs text-danger-600">{errors.rol.message}</span>}
            </div>

            {/* sucursal_id */}
            <div className="flex flex-col gap-1">
              <label htmlFor="f-sucursal_id" className="text-xs font-medium text-neutral-700">
                Sucursal <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <select id="f-sucursal_id" className={SELECT} {...register("sucursal_id")}>
                <option value="">— Sin asignar —</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errors.sucursal_id && (
                <span className="text-xs text-danger-600">{errors.sucursal_id.message}</span>
              )}
            </div>

            {/* password (create only) */}
            {!isEdit && (
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="f-password" className="text-xs font-medium text-neutral-700">
                  Contraseña
                </label>
                <input
                  id="f-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className={INPUT}
                  {...register("password")}
                />
                {errors.password && (
                  <span className="text-xs text-danger-600">{errors.password.message}</span>
                )}
              </div>
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

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState<RolUsuario | "">("");
  const [activoFilter, setActivoFilter] = useState<"" | "false" | "true">("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUsuario, setEditUsuario] = useState<UsuarioDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: UsuariosParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
    ...(rolFilter !== "" ? { rol: rolFilter } : {}),
    ...(activoFilter !== "" ? { activo: activoFilter === "true" } : {}),
  };

  const { data, isLoading, isError } = useUsuarios(params);
  const { data: sucursalesResp } = useSucursalesOptions();
  const deleteMutation = useDeleteUsuario();

  const sucursalMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of sucursalesResp?.data ?? []) {
      map[s.id] = s.nombre;
    }
    return map;
  }, [sucursalesResp]);

  function openCreate() {
    setEditUsuario(null);
    setShowModal(true);
  }

  function openEdit(u: UsuarioDto) {
    setEditUsuario(u);
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
        <h1 className="text-xl font-semibold text-neutral-900">Usuarios</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre o documento..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={rolFilter}
          onChange={(e) => {
            setRolFilter(e.target.value as RolUsuario | "");
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todos los roles</option>
          {Object.values(RolUsuarioEnum).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={activoFilter}
          onChange={(e) => {
            setActivoFilter(e.target.value as "" | "false" | "true");
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todos</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
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
            Error al cargar usuarios. Intenta recargar la página.
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
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Rol
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Sucursal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Estado
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Último login
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
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
              {data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {u.nombres} {u.apellidos}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {u.tipo_documento} {u.numero_documento}
                  </td>
                  <td className="px-4 py-3">
                    <RolBadge rol={u.rol} />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {u.sucursal_id !== null ? (sucursalMap[u.sucursal_id] ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={u.activo} />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {u.ultimo_login !== null ? formatDate(u.ultimo_login) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(u.id)}
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
            {meta.total} usuario{meta.total !== 1 ? "s" : ""}
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
          message="¿Eliminar este usuario? Esta acción desactivará la cuenta (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Create / edit modal */}
      {showModal && (
        <UsuarioModal
          usuario={editUsuario}
          sucursales={sucursalesResp?.data ?? []}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
