import { zodResolver } from "@hookform/resolvers/zod";
import { TipoDocumento } from "@kallpasoft/shared";
import type { CreateClienteInput } from "@kallpasoft/validators";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  useClientes,
  useCreateCliente,
  useDeleteCliente,
  useUpdateCliente,
} from "../hooks/useClientes";
import type { ClienteDto, ClientesParams } from "../types/cliente";

// ─── Form schema ──────────────────────────────────────────────────────────────

const clienteFormSchema = z
  .object({
    tipo_persona: z.enum(["NATURAL", "JURIDICA"] as const),
    tipo_documento: z.enum(["DNI", "RUC", "CE"] as const),
    numero_documento: z.string().min(1, "Requerido").max(20),
    nombres: z.string().max(100).optional(),
    apellidos: z.string().max(100).optional(),
    razon_social: z.string().max(200).optional(),
    email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
    telefono: z.string().max(20).optional(),
    telefono_secundario: z.string().max(20).optional(),
    notas: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_persona === "NATURAL") {
      if (!data.nombres || data.nombres.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["nombres"], message: "Requerido" });
      }
      if (!data.apellidos || data.apellidos.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["apellidos"], message: "Requerido" });
      }
    } else {
      if (!data.razon_social || data.razon_social.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["razon_social"], message: "Requerido" });
      }
    }
  });

type ClienteFormValues = z.infer<typeof clienteFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nombreDisplay(c: ClienteDto): string {
  if (c.tipo_persona === "NATURAL") {
    return [c.nombres, c.apellidos].filter(Boolean).join(" ") || "—";
  }
  return c.razon_social ?? "—";
}

// ─── Shared components ────────────────────────────────────────────────────────

function TipoPersonaBadge({ tipo }: { tipo: "NATURAL" | "JURIDICA" }) {
  return tipo === "NATURAL" ? (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      Natural
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
      Jurídica
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

// ─── ClienteModal ─────────────────────────────────────────────────────────────

function ClienteModal({ cliente, onClose }: { cliente: ClienteDto | null; onClose: () => void }) {
  const isEdit = cliente !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      tipo_persona: (cliente?.tipo_persona ?? "NATURAL") as "NATURAL" | "JURIDICA",
      tipo_documento: (cliente?.tipo_documento ?? TipoDocumento.DNI) as "DNI" | "RUC" | "CE",
      numero_documento: cliente?.numero_documento ?? "",
      nombres: cliente?.nombres ?? "",
      apellidos: cliente?.apellidos ?? "",
      razon_social: cliente?.razon_social ?? "",
      email: cliente?.email ?? "",
      telefono: cliente?.telefono ?? "",
      telefono_secundario: cliente?.telefono_secundario ?? "",
      notas: cliente?.notas ?? "",
    },
  });

  const tipoPersona = useWatch({ control, name: "tipo_persona" });

  async function onSubmit(values: ClienteFormValues) {
    setServerError(null);

    const optional = {
      ...(values.email && values.email !== "" ? { email: values.email } : {}),
      ...(values.telefono && values.telefono !== "" ? { telefono: values.telefono } : {}),
      ...(values.telefono_secundario && values.telefono_secundario !== ""
        ? { telefono_secundario: values.telefono_secundario }
        : {}),
      ...(values.notas && values.notas !== "" ? { notas: values.notas } : {}),
    };

    if (isEdit) {
      const body = {
        id: cliente.id,
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        tipo_persona: values.tipo_persona,
        ...(values.tipo_persona === "NATURAL"
          ? { nombres: values.nombres ?? "", apellidos: values.apellidos ?? "" }
          : { razon_social: values.razon_social ?? "" }),
        ...optional,
      };
      updateMutation.mutate(body, {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      });
    } else {
      const body: CreateClienteInput =
        values.tipo_persona === "NATURAL"
          ? {
              tipo_persona: "NATURAL",
              tipo_documento: values.tipo_documento as "DNI" | "CE",
              numero_documento: values.numero_documento,
              nombres: values.nombres ?? "",
              apellidos: values.apellidos ?? "",
              ...optional,
            }
          : {
              tipo_persona: "JURIDICA",
              tipo_documento: "RUC",
              numero_documento: values.numero_documento,
              razon_social: values.razon_social ?? "",
              ...optional,
            };
      createMutation.mutate(body, {
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
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
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
            {/* tipo_persona */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="cf-tipo-persona" className="text-xs font-medium text-neutral-700">
                Tipo de persona
              </label>
              <select id="cf-tipo-persona" className={SELECT} {...register("tipo_persona")}>
                <option value="NATURAL">Persona Natural</option>
                <option value="JURIDICA">Persona Jurídica</option>
              </select>
            </div>

            {/* tipo_documento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-tipo-doc" className="text-xs font-medium text-neutral-700">
                Tipo de documento
              </label>
              <select id="cf-tipo-doc" className={SELECT} {...register("tipo_documento")}>
                {tipoPersona === "NATURAL" ? (
                  <>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de extranjería</option>
                  </>
                ) : (
                  <option value="RUC">RUC</option>
                )}
              </select>
              {errors.tipo_documento && (
                <span className="text-xs text-danger-600">{errors.tipo_documento.message}</span>
              )}
            </div>

            {/* numero_documento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-num-doc" className="text-xs font-medium text-neutral-700">
                Número de documento
              </label>
              <input
                id="cf-num-doc"
                type="text"
                placeholder={tipoPersona === "NATURAL" ? "12345678" : "20123456789"}
                className={INPUT}
                {...register("numero_documento")}
              />
              {errors.numero_documento && (
                <span className="text-xs text-danger-600">{errors.numero_documento.message}</span>
              )}
            </div>

            {/* Condicional: NATURAL → nombres + apellidos */}
            {tipoPersona === "NATURAL" && (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cf-nombres" className="text-xs font-medium text-neutral-700">
                    Nombres
                  </label>
                  <input
                    id="cf-nombres"
                    type="text"
                    placeholder="Juan Carlos"
                    className={INPUT}
                    {...register("nombres")}
                  />
                  {errors.nombres && (
                    <span className="text-xs text-danger-600">{errors.nombres.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cf-apellidos" className="text-xs font-medium text-neutral-700">
                    Apellidos
                  </label>
                  <input
                    id="cf-apellidos"
                    type="text"
                    placeholder="García López"
                    className={INPUT}
                    {...register("apellidos")}
                  />
                  {errors.apellidos && (
                    <span className="text-xs text-danger-600">{errors.apellidos.message}</span>
                  )}
                </div>
              </>
            )}

            {/* Condicional: JURIDICA → razon_social */}
            {tipoPersona === "JURIDICA" && (
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="cf-razon" className="text-xs font-medium text-neutral-700">
                  Razón social
                </label>
                <input
                  id="cf-razon"
                  type="text"
                  placeholder="Empresa SAC"
                  className={INPUT}
                  {...register("razon_social")}
                />
                {errors.razon_social && (
                  <span className="text-xs text-danger-600">{errors.razon_social.message}</span>
                )}
              </div>
            )}

            {/* email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-email" className="text-xs font-medium text-neutral-700">
                Email <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-email"
                type="email"
                placeholder="correo@ejemplo.com"
                className={INPUT}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-danger-600">{errors.email.message}</span>
              )}
            </div>

            {/* telefono */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-telefono" className="text-xs font-medium text-neutral-700">
                Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-telefono"
                type="tel"
                placeholder="987 654 321"
                className={INPUT}
                {...register("telefono")}
              />
            </div>

            {/* telefono_secundario */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-tel2" className="text-xs font-medium text-neutral-700">
                Teléfono 2 <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-tel2"
                type="tel"
                placeholder="01 234 5678"
                className={INPUT}
                {...register("telefono_secundario")}
              />
            </div>

            {/* notas */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="cf-notas" className="text-xs font-medium text-neutral-700">
                Notas <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-notas"
                type="text"
                placeholder="Observaciones del cliente"
                className={INPUT}
                {...register("notas")}
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

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClientesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterTipoDoc, setFilterTipoDoc] = useState("");
  const [filterTipoPersona, setFilterTipoPersona] = useState("");
  const [filterActivo, setFilterActivo] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState<ClienteDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params: ClientesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(search !== "" ? { search } : {}),
    ...(filterTipoDoc !== "" ? { tipo_documento: filterTipoDoc } : {}),
    ...(filterTipoPersona !== ""
      ? { tipo_persona: filterTipoPersona as "NATURAL" | "JURIDICA" }
      : {}),
    ...(filterActivo !== "" ? { activo: filterActivo === "true" } : {}),
  };

  const { data, isLoading, isError } = useClientes(params);
  const deleteMutation = useDeleteCliente();

  function openCreate() {
    setEditCliente(null);
    setShowModal(true);
  }

  function openEdit(c: ClienteDto) {
    setEditCliente(c);
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
    setFilterTipoDoc("");
    setFilterTipoPersona("");
    setFilterActivo("");
    setPage(1);
  }

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
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
          placeholder="Buscar por documento, nombre, teléfono..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={filterTipoDoc}
          onChange={(e) => {
            setFilterTipoDoc(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Todos los docs.</option>
          <option value="DNI">DNI</option>
          <option value="RUC">RUC</option>
          <option value="CE">CE</option>
        </select>
        <select
          value={filterTipoPersona}
          onChange={(e) => {
            setFilterTipoPersona(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Natural + Jurídica</option>
          <option value="NATURAL">Natural</option>
          <option value="JURIDICA">Jurídica</option>
        </select>
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
        {(search !== "" ||
          filterTipoDoc !== "" ||
          filterTipoPersona !== "" ||
          filterActivo !== "") && (
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
            Error al cargar clientes. Intenta recargar la página.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre / Razón social
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Tipo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Teléfono
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Email
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
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="mr-1.5 inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono font-medium text-neutral-600">
                      {c.tipo_documento}
                    </span>
                    <span className="text-neutral-900">{c.numero_documento}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{nombreDisplay(c)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <TipoPersonaBadge tipo={c.tipo_persona} />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {c.telefono ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={c.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/clientes/${c.id}`)}
                        title="Ver detalle"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
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

      {/* Pagination */}
      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} cliente{meta.total !== 1 ? "s" : ""}
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
          message="¿Eliminar este cliente? Esta acción lo desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Create / edit modal */}
      {showModal && <ClienteModal cliente={editCliente} onClose={closeModal} />}
    </div>
  );
}
