import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import {
  useCreateTasaPrecio,
  useDeleteTasaPrecio,
  useProductos,
  useTasasPrecio,
  useUpdateTasaPrecio,
} from "../hooks/useInventario";
import type { TasaPrecioDto } from "../types/inventario";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Nivel = "POR_REPUESTO" | "POR_TIPO" | "POR_COMPONENTE";
type TasaTipo = "PORCENTAJE" | "FIJO";

// ─── Badges ───────────────────────────────────────────────────────────────────

const NIVEL_LABEL: Record<Nivel, string> = {
  POR_REPUESTO: "Por repuesto",
  POR_TIPO: "Por tipo",
  POR_COMPONENTE: "Por componente",
};

const NIVEL_COLOR: Record<Nivel, string> = {
  POR_REPUESTO: "bg-blue-100 text-blue-700",
  POR_TIPO: "bg-violet-100 text-violet-700",
  POR_COMPONENTE: "bg-orange-100 text-orange-700",
};

function NivelBadge({ nivel }: { nivel: Nivel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${NIVEL_COLOR[nivel]}`}
    >
      {NIVEL_LABEL[nivel]}
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const LABEL = "text-xs font-medium text-neutral-700";

// ─── Schema creación ──────────────────────────────────────────────────────────

const crearTasaSchema = z.object({
  nivel: z.enum(["POR_REPUESTO", "POR_TIPO", "POR_COMPONENTE"] as const),
  producto_id: z.string().optional(),
  tipo_registro: z.enum(["PRODUCTO", "SERVICIO"] as const).optional(),
  componente_id: z.string().optional(),
  tasa_tipo: z.enum(["PORCENTAJE", "FIJO"] as const),
  tasa_valor: z.string().min(1, "Requerido"),
});
type CrearTasaValues = z.infer<typeof crearTasaSchema>;

// ─── Schema edición ───────────────────────────────────────────────────────────

const editarTasaSchema = z.object({
  tasa_tipo: z.enum(["PORCENTAJE", "FIJO"] as const),
  tasa_valor: z.string().min(1, "Requerido"),
});
type EditarTasaValues = z.infer<typeof editarTasaSchema>;

// ─── Modal crear ──────────────────────────────────────────────────────────────

function CrearTasaModal({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateTasaPrecio();

  const { data: productosData } = useProductos({ activo: true, pageSize: 500 });
  const { data: componentesData } = useComponentes({ activo: true, pageSize: 200 });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CrearTasaValues>({
    resolver: zodResolver(crearTasaSchema),
    defaultValues: {
      nivel: "POR_REPUESTO",
      tasa_tipo: "PORCENTAJE",
      tasa_valor: "",
      producto_id: "",
      componente_id: "",
    },
  });

  const nivel = useWatch({ control, name: "nivel" });
  const tasaTipo = useWatch({ control, name: "tasa_tipo" });

  function onSubmit(values: CrearTasaValues) {
    setServerError(null);
    const tastaValorNum = Number.parseFloat(values.tasa_valor);
    if (Number.isNaN(tastaValorNum)) {
      setServerError("Valor de tasa inválido.");
      return;
    }
    createMutation.mutate(
      {
        nivel: values.nivel,
        tasa_tipo: values.tasa_tipo,
        tasa_valor: tastaValorNum,
        ...(values.nivel === "POR_REPUESTO" && values.producto_id
          ? { producto_id: values.producto_id }
          : {}),
        ...(values.nivel === "POR_TIPO" && values.tipo_registro
          ? { tipo_registro: values.tipo_registro }
          : {}),
        ...(values.nivel === "POR_COMPONENTE" && values.componente_id
          ? { componente_id: values.componente_id }
          : {}),
      },
      { onSuccess: onClose, onError: (err) => setServerError(err.message) }
    );
  }

  const productos = productosData?.data ?? [];
  const componentes = componentesData?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Nueva tasa de precio</h2>
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
            {/* Nivel */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ct-nivel" className={LABEL}>
                Nivel <span className="text-danger-500">*</span>
              </label>
              <select id="ct-nivel" className={SELECT} {...register("nivel")}>
                <option value="POR_REPUESTO">Por repuesto (producto específico)</option>
                <option value="POR_TIPO">Por tipo (PRODUCTO / SERVICIO)</option>
                <option value="POR_COMPONENTE">Por componente</option>
              </select>
            </div>

            {/* Campo condicional según nivel */}
            {nivel === "POR_REPUESTO" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="ct-producto" className={LABEL}>
                  Producto <span className="text-danger-500">*</span>
                </label>
                <select id="ct-producto" className={SELECT} {...register("producto_id")}>
                  <option value="">Seleccionar...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} — {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {nivel === "POR_TIPO" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="ct-tipo" className={LABEL}>
                  Tipo <span className="text-danger-500">*</span>
                </label>
                <select id="ct-tipo" className={SELECT} {...register("tipo_registro")}>
                  <option value="">Seleccionar...</option>
                  <option value="PRODUCTO">PRODUCTO</option>
                  <option value="SERVICIO">SERVICIO</option>
                </select>
              </div>
            )}

            {nivel === "POR_COMPONENTE" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="ct-comp" className={LABEL}>
                  Componente <span className="text-danger-500">*</span>
                </label>
                <select id="ct-comp" className={SELECT} {...register("componente_id")}>
                  <option value="">Seleccionar...</option>
                  {componentes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipo tasa */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ct-tasa-tipo" className={LABEL}>
                Tipo de tasa
              </label>
              <select id="ct-tasa-tipo" className={SELECT} {...register("tasa_tipo")}>
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="FIJO">Monto fijo (S/)</option>
              </select>
            </div>

            {/* Valor */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ct-valor" className={LABEL}>
                Valor {tasaTipo === "PORCENTAJE" ? "(%)" : "(S/)"}
                <span className="text-danger-500"> *</span>
              </label>
              <input
                id="ct-valor"
                type="number"
                step="0.01"
                min="0"
                placeholder={tasaTipo === "PORCENTAJE" ? "15.00" : "50.00"}
                className={INPUT}
                {...register("tasa_valor")}
              />
              {errors.tasa_valor && (
                <span className="text-xs text-danger-600">{errors.tasa_valor.message}</span>
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
              {createMutation.isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal editar ─────────────────────────────────────────────────────────────

function EditarTasaModal({ tasa, onClose }: { tasa: TasaPrecioDto; onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateMutation = useUpdateTasaPrecio();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditarTasaValues>({
    resolver: zodResolver(editarTasaSchema),
    defaultValues: {
      tasa_tipo: tasa.tasa_tipo,
      tasa_valor: tasa.tasa_valor,
    },
  });

  const tasaTipo = useWatch({ control, name: "tasa_tipo" });

  // Cálculo instantáneo del precio de venta
  const ultimoCosto = tasa.ultimo_costo !== null ? Number(tasa.ultimo_costo) : null;

  function calcPrecioVenta(rawValor: string): string | null {
    const valor = Number.parseFloat(rawValor);
    if (Number.isNaN(valor) || ultimoCosto === null) return null;
    if (tasaTipo === "PORCENTAJE") {
      return (ultimoCosto * (1 + valor / 100)).toFixed(2);
    }
    return (ultimoCosto + valor).toFixed(2);
  }

  const [tasaValorLive, setTasaValorLive] = useState(tasa.tasa_valor);
  const precioEstimado = calcPrecioVenta(tasaValorLive);

  function onSubmit(values: EditarTasaValues) {
    setServerError(null);
    const valor = Number.parseFloat(values.tasa_valor);
    if (Number.isNaN(valor)) {
      setServerError("Valor inválido.");
      return;
    }
    updateMutation.mutate(
      { id: tasa.id, tasa_tipo: values.tasa_tipo, tasa_valor: valor },
      { onSuccess: onClose, onError: (err) => setServerError(err.message) }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Editar tasa</h2>
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
            {/* Info costos */}
            {tasa.ultimo_costo !== null && (
              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 space-y-1">
                <div className="flex justify-between">
                  <span>Último costo:</span>
                  <span className="font-medium">S/ {Number(tasa.ultimo_costo).toFixed(2)}</span>
                </div>
                {tasa.promedio_historico !== null && (
                  <div className="flex justify-between">
                    <span>Promedio histórico:</span>
                    <span>S/ {Number(tasa.promedio_historico).toFixed(2)}</span>
                  </div>
                )}
                {precioEstimado !== null && (
                  <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold text-neutral-900">
                    <span>Precio venta estimado:</span>
                    <span>S/ {precioEstimado}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tipo tasa */}
            <div className="flex flex-col gap-1">
              <label htmlFor="et-tasa-tipo" className={LABEL}>
                Tipo de tasa
              </label>
              <select id="et-tasa-tipo" className={SELECT} {...register("tasa_tipo")}>
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="FIJO">Monto fijo (S/)</option>
              </select>
            </div>

            {/* Valor */}
            <div className="flex flex-col gap-1">
              <label htmlFor="et-valor" className={LABEL}>
                Valor {tasaTipo === "PORCENTAJE" ? "(%)" : "(S/)"}
              </label>
              <input
                id="et-valor"
                type="number"
                step="0.01"
                min="0"
                className={INPUT}
                {...register("tasa_valor", {
                  onChange: (e) => setTasaValorLive(e.target.value as string),
                })}
              />
              {errors.tasa_valor && (
                <span className="text-xs text-danger-600">{errors.tasa_valor.message}</span>
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

// ─── Descripción de la tasa ───────────────────────────────────────────────────

function TasaDescripcion({ tasa }: { tasa: TasaPrecioDto }) {
  if (tasa.nivel === "POR_REPUESTO" && tasa.producto_id !== null) {
    return <span className="text-neutral-500">Producto ID: {tasa.producto_id}</span>;
  }
  if (tasa.nivel === "POR_TIPO" && tasa.tipo_registro !== null) {
    return <span className="text-neutral-500">{tasa.tipo_registro}</span>;
  }
  if (tasa.nivel === "POR_COMPONENTE" && tasa.componente_id !== null) {
    return <span className="text-neutral-500">Componente ID: {tasa.componente_id}</span>;
  }
  return <span className="text-neutral-400">—</span>;
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function TasasPrecioPage() {
  const { data, isLoading, isError } = useTasasPrecio();
  const deleteMutation = useDeleteTasaPrecio();
  const [modal, setModal] = useState<"new" | TasaPrecioDto | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tasas = data?.data ?? [];

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
                  Nivel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Aplica a
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Tipo tasa
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Valor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Último costo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Precio venta
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tasas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No hay tasas registradas.
                  </td>
                </tr>
              )}
              {tasas.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <NivelBadge nivel={t.nivel} />
                  </td>
                  <td className="px-4 py-3">
                    <TasaDescripcion tasa={t} />
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {t.tasa_tipo === "PORCENTAJE" ? "%" : "S/ fijo"}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700">
                    {t.tasa_tipo === "PORCENTAJE"
                      ? `${Number(t.tasa_valor).toFixed(2)}%`
                      : `S/ ${Number(t.tasa_valor).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {t.ultimo_costo !== null ? `S/ ${Number(t.ultimo_costo).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.precio_venta !== null ? (
                      <span className="font-medium text-neutral-900">
                        S/ {Number(t.precio_venta).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
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

      {/* Confirm delete */}
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

      {modal === "new" && <CrearTasaModal onClose={() => setModal(null)} />}
      {modal !== null && modal !== "new" && (
        <EditarTasaModal tasa={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
