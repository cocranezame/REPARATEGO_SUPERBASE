import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import {
  type TrabajadorConfigDto,
  useCreateTrabajador,
  useDeleteTrabajador,
  useTrabajadores,
  useTurnos,
  useUpdateTrabajador,
} from "../hooks/useAsistencia";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const ERR = "mt-1 text-xs text-red-600";

const trabajadorSchema = z
  .object({
    usuario_id: z.string().uuid("Seleccione un usuario"),
    turno_id: z.string().uuid("Seleccione un turno"),
    sucursal_id: z.string().uuid("Seleccione una sucursal"),
    tipo_contrato: z.enum(["PLANILLA", "HONORARIOS", "PRACTICANTE"]),
    sueldo_base: z.number().positive("Ingrese un sueldo válido"),
    modalidad_pago: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]),
    fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
    factor_hora_extra: z.number().min(1).max(3),
    descuento_x_tardanza: z.enum(["POR_MINUTO", "POR_RANGO", "SIN_DESCUENTO"]),
    monto_descuento_min: z.number().min(0).optional(),
    activo: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.descuento_x_tardanza === "POR_MINUTO" && !data.monto_descuento_min) {
      ctx.addIssue({
        code: "custom",
        path: ["monto_descuento_min"],
        message: "Requerido cuando descuento es POR_MINUTO",
      });
    }
  });

type TrabajadorForm = z.infer<typeof trabajadorSchema>;

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalTrabajador({
  item,
  onClose,
}: {
  item: TrabajadorConfigDto | null;
  onClose: () => void;
}) {
  const createT = useCreateTrabajador();
  const updateT = useUpdateTrabajador();
  const { data: usuariosData } = useUsuarios({ activo: true, pageSize: 100 });
  const { data: turnosData } = useTurnos();
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });

  const usuarios = usuariosData?.data ?? [];
  const turnos = turnosData?.data ?? [];
  const sucursales = sucursalesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TrabajadorForm>({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: item
      ? {
          usuario_id: item.usuario_id,
          turno_id: item.turno_id,
          sucursal_id: item.sucursal_id,
          tipo_contrato: item.tipo_contrato,
          sueldo_base: item.sueldo_base,
          modalidad_pago: item.modalidad_pago,
          fecha_ingreso: item.fecha_ingreso,
          factor_hora_extra: item.factor_hora_extra,
          descuento_x_tardanza: item.descuento_x_tardanza,
          monto_descuento_min: item.monto_descuento_min ?? undefined,
          activo: item.activo,
        }
      : { factor_hora_extra: 1.25, descuento_x_tardanza: "SIN_DESCUENTO", activo: true },
  });

  const descuento = useWatch({ control, name: "descuento_x_tardanza" });

  async function onSubmit(data: TrabajadorForm) {
    if (item) {
      const { usuario_id: _uid, ...rest } = data;
      await updateT.mutateAsync({ id: item.id, ...rest });
    } else {
      await createT.mutateAsync(data);
    }
    onClose();
  }

  const isPending = createT.isPending || updateT.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {item ? "Editar trabajador" : "Configurar trabajador"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-4 p-6">
            <div>
              <label
                htmlFor="tr-usuario"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Usuario
              </label>
              <select
                id="tr-usuario"
                {...register("usuario_id")}
                disabled={!!item}
                className={SELECT}
              >
                <option value="">Seleccionar…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombres} {u.apellidos}
                  </option>
                ))}
              </select>
              {errors.usuario_id && <p className={ERR}>{errors.usuario_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tr-turno"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Turno
                </label>
                <select id="tr-turno" {...register("turno_id")} className={SELECT}>
                  <option value="">Seleccionar…</option>
                  {turnos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                {errors.turno_id && <p className={ERR}>{errors.turno_id.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="tr-sucursal"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Sucursal
                </label>
                <select id="tr-sucursal" {...register("sucursal_id")} className={SELECT}>
                  <option value="">Seleccionar…</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                {errors.sucursal_id && <p className={ERR}>{errors.sucursal_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tr-contrato"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Tipo contrato
                </label>
                <select id="tr-contrato" {...register("tipo_contrato")} className={SELECT}>
                  <option value="">Seleccionar…</option>
                  <option value="PLANILLA">Planilla</option>
                  <option value="HONORARIOS">Honorarios</option>
                  <option value="PRACTICANTE">Practicante</option>
                </select>
                {errors.tipo_contrato && <p className={ERR}>{errors.tipo_contrato.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="tr-modalidad"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Modalidad pago
                </label>
                <select id="tr-modalidad" {...register("modalidad_pago")} className={SELECT}>
                  <option value="">Seleccionar…</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
                {errors.modalidad_pago && <p className={ERR}>{errors.modalidad_pago.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tr-sueldo"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Sueldo base (S/)
                </label>
                <input
                  id="tr-sueldo"
                  {...register("sueldo_base", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min={0}
                  className={INPUT}
                />
                {errors.sueldo_base && <p className={ERR}>{errors.sueldo_base.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="tr-ingreso"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Fecha ingreso
                </label>
                <input
                  id="tr-ingreso"
                  {...register("fecha_ingreso")}
                  type="date"
                  className={INPUT}
                />
                {errors.fecha_ingreso && <p className={ERR}>{errors.fecha_ingreso.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tr-factor"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Factor hora extra
                </label>
                <input
                  id="tr-factor"
                  {...register("factor_hora_extra", { valueAsNumber: true })}
                  type="number"
                  step="0.05"
                  min={1}
                  max={3}
                  className={INPUT}
                />
                {errors.factor_hora_extra && (
                  <p className={ERR}>{errors.factor_hora_extra.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="tr-desc"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Descuento tardanza
                </label>
                <select id="tr-desc" {...register("descuento_x_tardanza")} className={SELECT}>
                  <option value="SIN_DESCUENTO">Sin descuento</option>
                  <option value="POR_MINUTO">Por minuto</option>
                  <option value="POR_RANGO">Por rango</option>
                </select>
                {errors.descuento_x_tardanza && (
                  <p className={ERR}>{errors.descuento_x_tardanza.message}</p>
                )}
              </div>
            </div>

            {descuento === "POR_MINUTO" && (
              <div>
                <label
                  htmlFor="tr-monto"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Monto descuento por minuto (S/)
                </label>
                <input
                  id="tr-monto"
                  {...register("monto_descuento_min", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min={0}
                  className={INPUT}
                />
                {errors.monto_descuento_min && (
                  <p className={ERR}>{errors.monto_descuento_min.message}</p>
                )}
              </div>
            )}

            {item && (
              <div className="flex items-center gap-2">
                <input {...register("activo")} type="checkbox" id="tr-activo" />
                <label htmlFor="tr-activo" className="text-sm text-neutral-700">
                  Activo
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
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
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const CONTRATO_BADGE: Record<string, string> = {
  PLANILLA: "bg-blue-100 text-blue-700",
  HONORARIOS: "bg-orange-100 text-orange-700",
  PRACTICANTE: "bg-purple-100 text-purple-700",
};

// ─── Página ───────────────────────────────────────────────────────────────────

export function TrabajadoresAsistenciaPage() {
  const user = useAuthStore((s) => s.user);
  const [edit, setEdit] = useState<TrabajadorConfigDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TrabajadorConfigDto | null>(null);

  const { data, isLoading } = useTrabajadores();
  const deleteT = useDeleteTrabajador();

  const trabajadores = data?.data ?? [];

  if (!user || user.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Trabajadores</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Configurar trabajador
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-500">Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Turno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Sucursal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Contrato
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Sueldo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Modalidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {trabajadores.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-neutral-500">
                      Sin trabajadores configurados.
                    </td>
                  </tr>
                )}
                {trabajadores.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {t.usuario_nombre} {t.usuario_apellidos}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{t.usuario_rol ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{t.turno_nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{t.sucursal_nombre ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONTRATO_BADGE[t.tipo_contrato] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {t.tipo_contrato}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      S/ {t.sueldo_base.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{t.modalidad_pago}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {t.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEdit(t)}
                          className="text-neutral-400 hover:text-primary-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(t)}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showCreate || edit) && (
        <ModalTrabajador
          item={edit}
          onClose={() => {
            setShowCreate(false);
            setEdit(null);
          }}
        />
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">Eliminar configuración</h3>
            <p className="mt-2 text-sm text-neutral-600">
              ¿Eliminar la configuración de{" "}
              <span className="font-medium">
                {deleteItem.usuario_nombre} {deleteItem.usuario_apellidos}
              </span>
              ?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteT.isPending}
                onClick={async () => {
                  await deleteT.mutateAsync(deleteItem.id);
                  setDeleteItem(null);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteT.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
