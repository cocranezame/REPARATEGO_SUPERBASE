import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import type { CategoriaDto } from "../../catalogos/types/categoria";
import type { ComponenteDto } from "../../catalogos/types/componente";
import {
  useCreateContacto,
  useCreateLinea,
  useCreateMetodoPago,
  useDeleteContacto,
  useDeleteLinea,
  useDeleteMetodoPago,
  useDeleteProveedor,
  useProveedor,
  useProveedorContactos,
  useProveedorLineas,
  useProveedorMetodosPago,
  useUpdateContacto,
  useUpdateMetodoPago,
  useUpdateProveedor,
} from "../hooks/useProveedores";
import type {
  ProveedorContactoDto,
  ProveedorDto,
  ProveedorLineaDto,
  ProveedorMetodoPagoDto,
} from "../types/proveedor";

// ─── Form schemas ─────────────────────────────────────────────────────────────

const proveedorEditSchema = z.object({
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
type ProveedorEditValues = z.infer<typeof proveedorEditSchema>;

const contactoFormSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(100),
  cargo: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  es_principal: z.boolean(),
});
type ContactoFormValues = z.infer<typeof contactoFormSchema>;

const metodoPagoFormSchema = z.object({
  tipo: z.string().min(1, "Requerido").max(30),
  banco: z.string().max(50).optional(),
  numero_cuenta: z.string().max(30).optional(),
  cci: z.string().max(25).optional(),
  titular: z.string().max(150).optional(),
});
type MetodoPagoFormValues = z.infer<typeof metodoPagoFormSchema>;

const lineaFormSchema = z.object({
  tipo: z.enum(["CATEGORIA", "COMPONENTE"] as const),
  item_id: z.string().min(1, "Selecciona una opción"),
  descripcion: z.string().max(200).optional(),
});
type LineaFormValues = z.infer<typeof lineaFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const TIPOS_METODO_PAGO = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "DEPÓSITO",
  "YAPE",
  "PLIN",
  "TARJETA",
  "CHEQUE",
  "OTRO",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-neutral-400">Sin calificar</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

// ─── ProveedorEditModal ───────────────────────────────────────────────────────

function ProveedorEditModal({
  proveedor,
  onClose,
}: {
  proveedor: ProveedorDto;
  onClose: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateMutation = useUpdateProveedor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorEditValues>({
    resolver: zodResolver(proveedorEditSchema),
    defaultValues: {
      ruc: proveedor.ruc,
      razon_social: proveedor.razon_social,
      nombre_comercial: proveedor.nombre_comercial ?? "",
      direccion: proveedor.direccion ?? "",
      distrito: proveedor.distrito ?? "",
      email: proveedor.email ?? "",
      telefono: proveedor.telefono ?? "",
      web: proveedor.web ?? "",
      notas: proveedor.notas ?? "",
      calificacion: proveedor.calificacion !== null ? String(proveedor.calificacion) : "",
    },
  });

  async function onSubmit(values: ProveedorEditValues) {
    setServerError(null);
    updateMutation.mutate(
      {
        id: proveedor.id,
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
      },
      { onSuccess: onClose, onError: (err) => setServerError(err.message) }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Editar proveedor</h2>
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
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-ruc" className="text-xs font-medium text-neutral-700">
                  RUC
                </label>
                <input
                  id="pe-ruc"
                  type="text"
                  maxLength={11}
                  className={INPUT}
                  {...register("ruc")}
                />
                {errors.ruc && (
                  <span className="text-xs text-danger-600">{errors.ruc.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-calificacion" className="text-xs font-medium text-neutral-700">
                  Calificación
                </label>
                <select id="pe-calificacion" className={SELECT} {...register("calificacion")}>
                  <option value="">Sin calificar</option>
                  <option value="1">1 ★</option>
                  <option value="2">2 ★★</option>
                  <option value="3">3 ★★★</option>
                  <option value="4">4 ★★★★</option>
                  <option value="5">5 ★★★★★</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pe-razon" className="text-xs font-medium text-neutral-700">
                  Razón social
                </label>
                <input id="pe-razon" type="text" className={INPUT} {...register("razon_social")} />
                {errors.razon_social && (
                  <span className="text-xs text-danger-600">{errors.razon_social.message}</span>
                )}
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pe-nombre-com" className="text-xs font-medium text-neutral-700">
                  Nombre comercial <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pe-nombre-com"
                  type="text"
                  className={INPUT}
                  {...register("nombre_comercial")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-email" className="text-xs font-medium text-neutral-700">
                  Email <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-email" type="email" className={INPUT} {...register("email")} />
                {errors.email && (
                  <span className="text-xs text-danger-600">{errors.email.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-telefono" className="text-xs font-medium text-neutral-700">
                  Teléfono <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-telefono" type="tel" className={INPUT} {...register("telefono")} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-web" className="text-xs font-medium text-neutral-700">
                  Web <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-web" type="url" className={INPUT} {...register("web")} />
                {errors.web && (
                  <span className="text-xs text-danger-600">{errors.web.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pe-distrito" className="text-xs font-medium text-neutral-700">
                  Distrito <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-distrito" type="text" className={INPUT} {...register("distrito")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pe-direccion" className="text-xs font-medium text-neutral-700">
                  Dirección <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-direccion" type="text" className={INPUT} {...register("direccion")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pe-notas" className="text-xs font-medium text-neutral-700">
                  Notas <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="pe-notas" type="text" className={INPUT} {...register("notas")} />
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

// ─── ContactoModal ────────────────────────────────────────────────────────────

function ContactoModal({
  proveedorId,
  contacto,
  onClose,
}: {
  proveedorId: string;
  contacto: ProveedorContactoDto | null;
  onClose: () => void;
}) {
  const isEdit = contacto !== null;
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateContacto();
  const updateMutation = useUpdateContacto();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoFormSchema),
    defaultValues: {
      nombre: contacto?.nombre ?? "",
      cargo: contacto?.cargo ?? "",
      telefono: contacto?.telefono ?? "",
      email: contacto?.email ?? "",
      es_principal: contacto?.es_principal ?? false,
    },
  });

  async function onSubmit(values: ContactoFormValues) {
    setServerError(null);
    const base = {
      proveedorId,
      nombre: values.nombre,
      ...(values.cargo ? { cargo: values.cargo } : {}),
      ...(values.telefono ? { telefono: values.telefono } : {}),
      ...(values.email && values.email !== "" ? { email: values.email } : {}),
      es_principal: values.es_principal,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: contacto.id, ...base },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
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
            {isEdit ? "Editar contacto" : "Nuevo contacto"}
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
                placeholder="Juan Pérez"
                className={INPUT}
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-cargo" className="text-xs font-medium text-neutral-700">
                Cargo <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-cargo"
                type="text"
                placeholder="Vendedor"
                className={INPUT}
                {...register("cargo")}
              />
            </div>
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
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-email" className="text-xs font-medium text-neutral-700">
                Email <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-email"
                type="email"
                placeholder="correo@empresa.com"
                className={INPUT}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-danger-600">{errors.email.message}</span>
              )}
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <input
                  id="cf-es-principal"
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                  {...register("es_principal")}
                />
                <label
                  htmlFor="cf-es-principal"
                  className="cursor-pointer text-sm font-medium text-neutral-900"
                >
                  Contacto principal
                </label>
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

// ─── MetodoPagoModal ──────────────────────────────────────────────────────────

function MetodoPagoModal({
  proveedorId,
  metodo,
  onClose,
}: {
  proveedorId: string;
  metodo: ProveedorMetodoPagoDto | null;
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
      tipo: metodo?.tipo ?? "",
      banco: metodo?.banco ?? "",
      numero_cuenta: metodo?.numero_cuenta ?? "",
      cci: metodo?.cci ?? "",
      titular: metodo?.titular ?? "",
    },
  });

  async function onSubmit(values: MetodoPagoFormValues) {
    setServerError(null);
    const base = {
      proveedorId,
      tipo: values.tipo,
      ...(values.banco ? { banco: values.banco } : {}),
      ...(values.numero_cuenta ? { numero_cuenta: values.numero_cuenta } : {}),
      ...(values.cci ? { cci: values.cci } : {}),
      ...(values.titular ? { titular: values.titular } : {}),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: metodo.id, ...base },
        { onSuccess: onClose, onError: (err) => setServerError(err.message) }
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
            {isEdit ? "Editar método de pago" : "Nuevo método de pago"}
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
              <label htmlFor="mp-tipo" className="text-xs font-medium text-neutral-700">
                Tipo
              </label>
              <select id="mp-tipo" className={SELECT} {...register("tipo")}>
                <option value="">Selecciona un tipo</option>
                {TIPOS_METODO_PAGO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <span className="text-xs text-danger-600">{errors.tipo.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mp-banco" className="text-xs font-medium text-neutral-700">
                Banco <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="mp-banco"
                type="text"
                placeholder="BCP, BBVA..."
                className={INPUT}
                {...register("banco")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mp-titular" className="text-xs font-medium text-neutral-700">
                Titular <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="mp-titular"
                type="text"
                placeholder="Nombre del titular"
                className={INPUT}
                {...register("titular")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mp-cuenta" className="text-xs font-medium text-neutral-700">
                N° de cuenta <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="mp-cuenta"
                type="text"
                placeholder="000-000000000-0-00"
                className={INPUT}
                {...register("numero_cuenta")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mp-cci" className="text-xs font-medium text-neutral-700">
                CCI <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="mp-cci"
                type="text"
                placeholder="00200000000000000000"
                className={INPUT}
                {...register("cci")}
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

// ─── LineaModal ───────────────────────────────────────────────────────────────

function LineaModal({
  proveedorId,
  categorias,
  componentes,
  onClose,
}: {
  proveedorId: string;
  categorias: CategoriaDto[];
  componentes: ComponenteDto[];
  onClose: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateLinea();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LineaFormValues>({
    resolver: zodResolver(lineaFormSchema),
    defaultValues: {
      tipo: "CATEGORIA",
      item_id: "",
      descripcion: "",
    },
  });

  const tipo = useWatch({ control, name: "tipo" });

  async function onSubmit(values: LineaFormValues) {
    setServerError(null);
    createMutation.mutate(
      {
        proveedorId,
        ...(values.tipo === "CATEGORIA"
          ? { categoria_id: values.item_id }
          : { componente_id: values.item_id }),
        ...(values.descripcion ? { descripcion: values.descripcion } : {}),
      },
      { onSuccess: onClose, onError: (err) => setServerError(err.message) }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Nueva línea de producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="lf-tipo" className="text-xs font-medium text-neutral-700">
                Tipo
              </label>
              <select id="lf-tipo" className={SELECT} {...register("tipo")}>
                <option value="CATEGORIA">Categoría</option>
                <option value="COMPONENTE">Componente</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lf-item" className="text-xs font-medium text-neutral-700">
                {tipo === "CATEGORIA" ? "Categoría" : "Componente"}
              </label>
              <select id="lf-item" className={SELECT} {...register("item_id")}>
                <option value="">— Selecciona —</option>
                {tipo === "CATEGORIA"
                  ? categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))
                  : componentes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
              </select>
              {errors.item_id && (
                <span className="text-xs text-danger-600">{errors.item_id.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lf-descripcion" className="text-xs font-medium text-neutral-700">
                Descripción <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="lf-descripcion"
                type="text"
                placeholder="Ej: pantallas originales, baterías de alta capacidad"
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
              disabled={createMutation.isPending || isSubmitting}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createMutation.isPending || isSubmitting ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ContactosTab ─────────────────────────────────────────────────────────────

function ContactosTab({ proveedorId }: { proveedorId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [editContacto, setEditContacto] = useState<ProveedorContactoDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useProveedorContactos(proveedorId);
  const deleteMutation = useDeleteContacto();

  function openCreate() {
    setEditContacto(null);
    setShowModal(true);
  }

  function openEdit(c: ProveedorContactoDto) {
    setEditContacto(c);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate({ id, proveedorId }, { onSuccess: () => setPendingDeleteId(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {data?.data.length ?? 0} contacto{(data?.data.length ?? 0) !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo contacto
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-6 text-center text-sm text-danger-600">Error al cargar contactos.</p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Cargo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Teléfono
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Email
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
                    Sin contactos registrados.
                  </td>
                </tr>
              )}
              {(data?.data ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{c.nombre}</td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {c.cargo ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {c.telefono ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.es_principal ? (
                      <PrincipalBadge />
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar este contacto?"
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && (
        <ContactoModal
          proveedorId={proveedorId}
          contacto={editContacto}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── MetodosPagoTab ───────────────────────────────────────────────────────────

function MetodosPagoTab({ proveedorId }: { proveedorId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [editMetodo, setEditMetodo] = useState<ProveedorMetodoPagoDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useProveedorMetodosPago(proveedorId);
  const deleteMutation = useDeleteMetodoPago();

  function openCreate() {
    setEditMetodo(null);
    setShowModal(true);
  }

  function openEdit(m: ProveedorMetodoPagoDto) {
    setEditMetodo(m);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate({ id, proveedorId }, { onSuccess: () => setPendingDeleteId(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {data?.data.length ?? 0} método{(data?.data.length ?? 0) !== 1 ? "s" : ""} de pago
        </span>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo método
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-6 text-center text-sm text-danger-600">
            Error al cargar métodos de pago.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Tipo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Banco
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  N° Cuenta
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  CCI
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Titular
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
                    Sin métodos de pago registrados.
                  </td>
                </tr>
              )}
              {(data?.data ?? []).map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      {m.tipo}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {m.banco ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-neutral-500 md:table-cell">
                    {m.numero_cuenta ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-neutral-500 lg:table-cell">
                    {m.cci ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {m.titular ?? "—"}
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

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar este método de pago?"
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && (
        <MetodoPagoModal
          proveedorId={proveedorId}
          metodo={editMetodo}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── LineasTab ────────────────────────────────────────────────────────────────

function LineasTab({ proveedorId }: { proveedorId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useProveedorLineas(proveedorId);
  const { data: categoriasData } = useCategorias({ pageSize: 200, activo: true });
  const { data: componentesData } = useComponentes({ pageSize: 200, activo: true });
  const deleteMutation = useDeleteLinea();

  const categorias = categoriasData?.data ?? [];
  const componentes = componentesData?.data ?? [];

  function lineaLabel(linea: ProveedorLineaDto): { tipo: string; nombre: string } {
    if (linea.categoria_id) {
      const cat = categorias.find((c) => c.id === linea.categoria_id);
      return { tipo: "Categoría", nombre: cat?.nombre ?? linea.categoria_id };
    }
    if (linea.componente_id) {
      const comp = componentes.find((c) => c.id === linea.componente_id);
      return { tipo: "Componente", nombre: comp?.nombre ?? linea.componente_id };
    }
    return { tipo: "Libre", nombre: linea.descripcion ?? "—" };
  }

  function handleDelete(id: string) {
    deleteMutation.mutate({ id, proveedorId }, { onSuccess: () => setPendingDeleteId(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {data?.data.length ?? 0} línea{(data?.data.length ?? 0) !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar línea
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-6 text-center text-sm text-danger-600">Error al cargar líneas.</p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-neutral-500">
                    Sin líneas de producto registradas.
                  </td>
                </tr>
              )}
              {(data?.data ?? []).map((linea) => {
                const label = lineaLabel(linea);
                return (
                  <tr key={linea.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {label.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{label.nombre}</td>
                    <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                      {linea.descripcion ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(linea.id)}
                          title="Eliminar"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="¿Eliminar esta línea de producto?"
          onConfirm={() => {
            if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          }}
          onCancel={() => setPendingDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showModal && (
        <LineaModal
          proveedorId={proveedorId}
          categorias={categorias}
          componentes={componentes}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "contactos" as const, label: "Contactos" },
  { id: "metodos-pago" as const, label: "Métodos de pago" },
  { id: "lineas" as const, label: "Líneas que abastecen" },
];
type TabId = (typeof TABS)[number]["id"];

export function ProveedorDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("contactos");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const proveedorId = id ?? "";
  const { data, isLoading, isError } = useProveedor(proveedorId);
  const deleteMutation = useDeleteProveedor();

  const proveedor = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !proveedor) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/proveedores")}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Proveedores
        </button>
        <p className="text-sm text-danger-600">
          {isError ? "Error al cargar el proveedor." : "Proveedor no encontrado."}
        </p>
      </div>
    );
  }

  function handleDelete() {
    deleteMutation.mutate(proveedorId, {
      onSuccess: () => navigate("/proveedores"),
    });
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate("/proveedores")}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Proveedores
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-semibold text-neutral-900">
                {proveedor.razon_social}
              </h1>
              <EstadoBadge activo={proveedor.activo} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              <span className="font-mono">{proveedor.ruc}</span>
              {proveedor.nombre_comercial && (
                <span className="ml-2 text-neutral-400">· {proveedor.nombre_comercial}</span>
              )}
            </p>
            <div className="mt-2">
              <StarRating value={proveedor.calificacion} />
            </div>
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
            <dd className="mt-0.5 text-neutral-900">{proveedor.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Teléfono</dt>
            <dd className="mt-0.5 text-neutral-900">{proveedor.telefono ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Web</dt>
            <dd className="mt-0.5 text-neutral-900">
              {proveedor.web ? (
                <a
                  href={proveedor.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {proveedor.web}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Distrito</dt>
            <dd className="mt-0.5 text-neutral-900">{proveedor.distrito ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium text-neutral-500">Dirección</dt>
            <dd className="mt-0.5 text-neutral-900">{proveedor.direccion ?? "—"}</dd>
          </div>
          <div className="col-span-2 lg:col-span-3">
            <dt className="text-xs font-medium text-neutral-500">Notas</dt>
            <dd className="mt-0.5 text-neutral-900">{proveedor.notas ?? "—"}</dd>
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

        {activeTab === "contactos" && <ContactosTab proveedorId={proveedorId} />}
        {activeTab === "metodos-pago" && <MetodosPagoTab proveedorId={proveedorId} />}
        {activeTab === "lineas" && <LineasTab proveedorId={proveedorId} />}
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <ProveedorEditModal proveedor={proveedor} onClose={() => setShowEditModal(false)} />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <ConfirmModal
          message={`¿Eliminar a ${proveedor.razon_social}? Esta acción lo desactivará (soft delete).`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
