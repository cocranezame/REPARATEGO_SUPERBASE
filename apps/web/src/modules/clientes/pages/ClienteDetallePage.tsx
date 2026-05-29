import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  useCliente,
  useCreateDireccion,
  useDeleteCliente,
  useDeleteDireccion,
  useDirecciones,
  useUpdateCliente,
  useUpdateDireccion,
} from "../hooks/useClientes";
import type { ClienteDireccionDto, ClienteDto } from "../types/cliente";

// ─── Form schemas ─────────────────────────────────────────────────────────────

const clienteEditSchema = z.object({
  tipo_documento: z.enum(["DNI", "RUC", "CE"] as const),
  numero_documento: z.string().min(1, "Requerido").max(20),
  nombres: z.string().max(100).optional(),
  apellidos: z.string().max(100).optional(),
  razon_social: z.string().max(200).optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  telefono: z.string().max(20).optional(),
  telefono_secundario: z.string().max(20).optional(),
  notas: z.string().optional(),
});
type ClienteEditValues = z.infer<typeof clienteEditSchema>;

const direccionFormSchema = z.object({
  etiqueta: z.enum(["PRINCIPAL", "TRABAJO", "OTRO"] as const),
  direccion: z.string().min(1, "Requerido").max(255),
  distrito: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  referencia: z.string().max(255).optional(),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
  es_principal: z.boolean(),
});
type DireccionFormValues = z.infer<typeof direccionFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

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

function parseCoord(val: string | undefined | null): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function PrincipalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      Principal
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

// ─── ClienteEditModal ─────────────────────────────────────────────────────────

function ClienteEditModal({ cliente, onClose }: { cliente: ClienteDto; onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateMutation = useUpdateCliente();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClienteEditValues>({
    resolver: zodResolver(clienteEditSchema),
    defaultValues: {
      tipo_documento: cliente.tipo_documento as "DNI" | "RUC" | "CE",
      numero_documento: cliente.numero_documento,
      nombres: cliente.nombres ?? "",
      apellidos: cliente.apellidos ?? "",
      razon_social: cliente.razon_social ?? "",
      email: cliente.email ?? "",
      telefono: cliente.telefono ?? "",
      telefono_secundario: cliente.telefono_secundario ?? "",
      notas: cliente.notas ?? "",
    },
  });

  async function onSubmit(values: ClienteEditValues) {
    setServerError(null);
    updateMutation.mutate(
      {
        id: cliente.id,
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        ...(cliente.tipo_persona === "NATURAL"
          ? {
              nombres: values.nombres ?? undefined,
              apellidos: values.apellidos ?? undefined,
            }
          : { razon_social: values.razon_social ?? undefined }),
        ...(values.email && values.email !== "" ? { email: values.email } : {}),
        ...(values.telefono && values.telefono !== "" ? { telefono: values.telefono } : {}),
        ...(values.telefono_secundario && values.telefono_secundario !== ""
          ? { telefono_secundario: values.telefono_secundario }
          : {}),
        ...(values.notas && values.notas !== "" ? { notas: values.notas } : {}),
      },
      {
        onSuccess: onClose,
        onError: (err) => setServerError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Editar cliente</h2>
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
            <div className="flex flex-col gap-1">
              <label htmlFor="ce-tipo-doc" className="text-xs font-medium text-neutral-700">
                Tipo de documento
              </label>
              <select id="ce-tipo-doc" className={SELECT} {...register("tipo_documento")}>
                {cliente.tipo_persona === "NATURAL" ? (
                  <>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de extranjería</option>
                  </>
                ) : (
                  <option value="RUC">RUC</option>
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ce-num-doc" className="text-xs font-medium text-neutral-700">
                Número de documento
              </label>
              <input
                id="ce-num-doc"
                type="text"
                className={INPUT}
                {...register("numero_documento")}
              />
              {errors.numero_documento && (
                <span className="text-xs text-danger-600">{errors.numero_documento.message}</span>
              )}
            </div>

            {cliente.tipo_persona === "NATURAL" && (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="ce-nombres" className="text-xs font-medium text-neutral-700">
                    Nombres
                  </label>
                  <input id="ce-nombres" type="text" className={INPUT} {...register("nombres")} />
                  {errors.nombres && (
                    <span className="text-xs text-danger-600">{errors.nombres.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="ce-apellidos" className="text-xs font-medium text-neutral-700">
                    Apellidos
                  </label>
                  <input
                    id="ce-apellidos"
                    type="text"
                    className={INPUT}
                    {...register("apellidos")}
                  />
                  {errors.apellidos && (
                    <span className="text-xs text-danger-600">{errors.apellidos.message}</span>
                  )}
                </div>
              </>
            )}

            {cliente.tipo_persona === "JURIDICA" && (
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="ce-razon" className="text-xs font-medium text-neutral-700">
                  Razón social
                </label>
                <input id="ce-razon" type="text" className={INPUT} {...register("razon_social")} />
                {errors.razon_social && (
                  <span className="text-xs text-danger-600">{errors.razon_social.message}</span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="ce-email" className="text-xs font-medium text-neutral-700">
                Email <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input id="ce-email" type="email" className={INPUT} {...register("email")} />
              {errors.email && (
                <span className="text-xs text-danger-600">{errors.email.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ce-tel" className="text-xs font-medium text-neutral-700">
                Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input id="ce-tel" type="tel" className={INPUT} {...register("telefono")} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ce-tel2" className="text-xs font-medium text-neutral-700">
                Teléfono 2 <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="ce-tel2"
                type="tel"
                className={INPUT}
                {...register("telefono_secundario")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ce-notas" className="text-xs font-medium text-neutral-700">
                Notas <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input id="ce-notas" type="text" className={INPUT} {...register("notas")} />
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
              disabled={updateMutation.isPending || isSubmitting}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {updateMutation.isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DireccionModal ───────────────────────────────────────────────────────────

function DireccionModal({
  clienteId,
  direccion,
  onClose,
}: {
  clienteId: string;
  direccion: ClienteDireccionDto | null;
  onClose: () => void;
}) {
  const isEdit = direccion !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateDireccion();
  const updateMutation = useUpdateDireccion();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DireccionFormValues>({
    resolver: zodResolver(direccionFormSchema),
    defaultValues: {
      etiqueta: (direccion?.etiqueta ?? "PRINCIPAL") as "PRINCIPAL" | "TRABAJO" | "OTRO",
      direccion: direccion?.direccion ?? "",
      distrito: direccion?.distrito ?? "",
      provincia: direccion?.provincia ?? "",
      departamento: direccion?.departamento ?? "",
      referencia: direccion?.referencia ?? "",
      latitud: direccion?.latitud ?? "",
      longitud: direccion?.longitud ?? "",
      es_principal: direccion?.es_principal ?? false,
    },
  });

  async function onSubmit(values: DireccionFormValues) {
    setServerError(null);

    const lat = parseCoord(values.latitud);
    const lng = parseCoord(values.longitud);

    const base = {
      clienteId,
      etiqueta: values.etiqueta,
      direccion: values.direccion,
      es_principal: values.es_principal,
      ...(values.distrito && values.distrito !== "" ? { distrito: values.distrito } : {}),
      ...(values.provincia && values.provincia !== "" ? { provincia: values.provincia } : {}),
      ...(values.departamento && values.departamento !== ""
        ? { departamento: values.departamento }
        : {}),
      ...(values.referencia && values.referencia !== "" ? { referencia: values.referencia } : {}),
      ...(lat !== undefined ? { latitud: lat } : {}),
      ...(lng !== undefined ? { longitud: lng } : {}),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: direccion.id, ...base },
        {
          onSuccess: onClose,
          onError: (err) => setServerError(err.message),
        }
      );
    } else {
      createMutation.mutate(base, {
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
            {isEdit ? "Editar dirección" : "Nueva dirección"}
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
            {/* etiqueta */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-etiqueta" className="text-xs font-medium text-neutral-700">
                Etiqueta
              </label>
              <select id="df-etiqueta" className={SELECT} {...register("etiqueta")}>
                <option value="PRINCIPAL">Principal</option>
                <option value="TRABAJO">Trabajo</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* es_principal */}
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <input
                  id="df-es-principal"
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                  {...register("es_principal")}
                />
                <label
                  htmlFor="df-es-principal"
                  className="cursor-pointer text-sm font-medium text-neutral-900"
                >
                  Dirección principal
                </label>
              </div>
            </div>

            {/* direccion */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="df-direccion" className="text-xs font-medium text-neutral-700">
                Dirección
              </label>
              <input
                id="df-direccion"
                type="text"
                placeholder="Av. Los Olivos 123, Int. 5"
                className={INPUT}
                {...register("direccion")}
              />
              {errors.direccion && (
                <span className="text-xs text-danger-600">{errors.direccion.message}</span>
              )}
            </div>

            {/* distrito */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-distrito" className="text-xs font-medium text-neutral-700">
                Distrito <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-distrito"
                type="text"
                placeholder="Los Olivos"
                className={INPUT}
                {...register("distrito")}
              />
            </div>

            {/* provincia */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-provincia" className="text-xs font-medium text-neutral-700">
                Provincia <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-provincia"
                type="text"
                placeholder="Lima"
                className={INPUT}
                {...register("provincia")}
              />
            </div>

            {/* departamento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-departamento" className="text-xs font-medium text-neutral-700">
                Departamento <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-departamento"
                type="text"
                placeholder="Lima"
                className={INPUT}
                {...register("departamento")}
              />
            </div>

            {/* referencia */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-referencia" className="text-xs font-medium text-neutral-700">
                Referencia <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-referencia"
                type="text"
                placeholder="Cerca al parque"
                className={INPUT}
                {...register("referencia")}
              />
            </div>

            {/* latitud */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-lat" className="text-xs font-medium text-neutral-700">
                Latitud <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-lat"
                type="text"
                placeholder="-11.9890"
                className={INPUT}
                {...register("latitud")}
              />
            </div>

            {/* longitud */}
            <div className="flex flex-col gap-1">
              <label htmlFor="df-lng" className="text-xs font-medium text-neutral-700">
                Longitud <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="df-lng"
                type="text"
                placeholder="-77.0428"
                className={INPUT}
                {...register("longitud")}
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

// ─── DireccionesTab ───────────────────────────────────────────────────────────

function DireccionesTab({ clienteId }: { clienteId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [editDireccion, setEditDireccion] = useState<ClienteDireccionDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useDirecciones(clienteId);
  const deleteMutation = useDeleteDireccion();

  function openCreate() {
    setEditDireccion(null);
    setShowModal(true);
  }

  function openEdit(d: ClienteDireccionDto) {
    setEditDireccion(d);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate({ id, clienteId }, { onSuccess: () => setPendingDeleteId(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {data?.data.length ?? 0} dirección{(data?.data.length ?? 0) !== 1 ? "es" : ""}
        </span>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva dirección
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-6 text-center text-sm text-danger-600">Error al cargar direcciones.</p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Etiqueta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Dirección
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Distrito
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Provincia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Principal
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    Sin direcciones registradas.
                  </td>
                </tr>
              )}
              {(data?.data ?? []).map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-neutral-50 ${d.es_principal ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
                      {d.etiqueta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{d.direccion}</td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {d.distrito ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {d.provincia ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d.es_principal ? (
                      <PrincipalBadge />
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(d.id)}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar esta dirección? Esta acción la desactivará (soft delete)."
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && (
        <DireccionModal
          clienteId={clienteId}
          direccion={editDireccion}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [{ id: "direcciones" as const, label: "Direcciones" }];
type TabId = (typeof TABS)[number]["id"];

export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("direcciones");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const clienteId = id ?? "";
  const { data, isLoading, isError } = useCliente(clienteId);
  const deleteMutation = useDeleteCliente();

  const cliente = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !cliente) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </button>
        <p className="text-sm text-danger-600">
          {isError ? "Error al cargar el cliente." : "Cliente no encontrado."}
        </p>
      </div>
    );
  }

  function handleDelete() {
    deleteMutation.mutate(clienteId, {
      onSuccess: () => navigate("/clientes"),
    });
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900 truncate">
                {nombreDisplay(cliente)}
              </h1>
              <TipoPersonaBadge tipo={cliente.tipo_persona} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              <span className="font-mono">{cliente.tipo_documento}</span> {cliente.numero_documento}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-danger-200 px-3 py-2 text-sm text-danger-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Datos generales</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-neutral-500">Email</dt>
            <dd className="mt-0.5 text-neutral-900">{cliente.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Teléfono</dt>
            <dd className="mt-0.5 text-neutral-900">{cliente.telefono ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Teléfono 2</dt>
            <dd className="mt-0.5 text-neutral-900">{cliente.telefono_secundario ?? "—"}</dd>
          </div>
          <div className="col-span-2 lg:col-span-3">
            <dt className="text-xs font-medium text-neutral-500">Notas</dt>
            <dd className="mt-0.5 text-neutral-900">{cliente.notas ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
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

        {activeTab === "direcciones" && <DireccionesTab clienteId={clienteId} />}
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <ClienteEditModal cliente={cliente} onClose={() => setShowEditModal(false)} />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <ConfirmModal
          message={`¿Eliminar a ${nombreDisplay(cliente)}? Esta acción lo desactivará (soft delete).`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
