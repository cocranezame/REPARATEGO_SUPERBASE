import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateCotizacionCompraInput } from "@kallpasoft/validators";
import { Eye, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useProductos } from "../../inventario/hooks/useInventario";
import { useProveedores } from "../../proveedores/hooks/useProveedores";
import {
  useCotizacion,
  useCotizaciones,
  useCotizarCotizacion,
  useCreateCotizacion,
} from "../hooks/useCotizaciones";
import type { CotizacionDetalleDto, CotizacionDto, CotizacionesParams } from "../types/cotizacion";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    PENDIENTE: "bg-yellow-100 text-yellow-700",
    COTIZADA: "bg-green-100 text-green-700",
    VENCIDA: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[estado] ?? "bg-neutral-100 text-neutral-700"}`}
    >
      {estado}
    </span>
  );
}

// ─── Modal Crear ──────────────────────────────────────────────────────────────

const cotizacionFormSchema = z.object({
  proveedor_id: z.string().min(1, "Selecciona un proveedor"),
  fecha_vencimiento: z.string().optional(),
  notas: z.string().optional(),
});
type CotizacionFormValues = z.infer<typeof cotizacionFormSchema>;

type ItemRow = { producto_id: string; cantidad: number };

function CrearCotizacionModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ItemRow[]>([{ producto_id: "", cantidad: 1 }]);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: proveedoresData } = useProveedores({ activo: true, pageSize: 200 });
  const { data: productosData } = useProductos({ activo: true, pageSize: 200 });

  const createMutation = useCreateCotizacion();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CotizacionFormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: { proveedor_id: "", fecha_vencimiento: "", notas: "" },
  });

  function addItem() {
    setItems((prev) => [...prev, { producto_id: "", cantidad: 1 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function onSubmit(values: CotizacionFormValues) {
    setServerError(null);
    const validItems = items.filter((it) => it.producto_id !== "");
    if (validItems.length === 0) {
      setServerError("Agrega al menos un producto");
      return;
    }

    const body: CreateCotizacionCompraInput = {
      proveedor_id: values.proveedor_id,
      items: validItems.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })),
      ...(values.fecha_vencimiento ? { fecha_vencimiento: values.fecha_vencimiento } : {}),
      ...(values.notas ? { notas: values.notas } : {}),
    };

    createMutation.mutate(body, {
      onSuccess: onClose,
      onError: (err) => setServerError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Nueva cotización de compra</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
            {/* Proveedor */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-proveedor" className="text-xs font-medium text-neutral-700">
                Proveedor
              </label>
              <select id="cf-proveedor" className={SELECT} {...register("proveedor_id")}>
                <option value="">Seleccionar...</option>
                {proveedoresData?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
              {errors.proveedor_id && (
                <span className="text-xs text-danger-600">{errors.proveedor_id.message}</span>
              )}
            </div>

            {/* Fecha vencimiento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-venc" className="text-xs font-medium text-neutral-700">
                Fecha de vencimiento{" "}
                <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-venc"
                type="date"
                className={INPUT}
                {...register("fecha_vencimiento")}
              />
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1">
              <label htmlFor="cf-notas" className="text-xs font-medium text-neutral-700">
                Notas <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="cf-notas"
                type="text"
                placeholder="Observaciones"
                className={INPUT}
                {...register("notas")}
              />
            </div>

            {/* Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">Productos a cotizar</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: form items with stable index
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.producto_id}
                      onChange={(e) => updateItem(idx, "producto_id", e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Producto...</option>
                      {productosData?.data.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))}
                      className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="Qty"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {serverError !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
                {serverError}
              </div>
            )}
          </div>

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
              {createMutation.isPending || isSubmitting ? "Creando..." : "Crear cotización"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Detalle + Cotizar ──────────────────────────────────────────────────

function DetalleModal({ cotizacionId, onClose }: { cotizacionId: string; onClose: () => void }) {
  const { data, isLoading } = useCotizacion(cotizacionId);
  const cotizacion = data?.data;

  const cotizarMutation = useCotizarCotizacion();
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCotizar, setShowCotizar] = useState(false);

  function handlePrecioChange(detalleId: string, value: string) {
    setPrecios((prev) => ({ ...prev, [detalleId]: value }));
  }

  function submitCotizar() {
    if (!cotizacion) return;
    setServerError(null);
    const items = (cotizacion.detalles ?? [])
      .filter((d) => precios[d.id] && Number(precios[d.id]) > 0)
      .map((d) => ({ detalle_id: d.id, precio_unitario: Number(precios[d.id]) }));

    if (items.length === 0) {
      setServerError("Ingresa al menos un precio mayor a 0");
      return;
    }

    cotizarMutation.mutate(
      { id: cotizacionId, items },
      {
        onSuccess: () => {
          setShowCotizar(false);
          setPrecios({});
        },
        onError: (err) => setServerError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            {cotizacion ? `Detalle — ${cotizacion.codigo}` : "Cargando..."}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}

          {cotizacion && (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 text-sm">
                <div>
                  <span className="text-neutral-500">Proveedor:</span>{" "}
                  <span className="font-medium">{cotizacion.proveedor_nombre ?? "—"}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Estado:</span>{" "}
                  <EstadoBadge estado={cotizacion.estado} />
                </div>
                <div>
                  <span className="text-neutral-500">Solicitud:</span>{" "}
                  <span>{cotizacion.fecha_solicitud}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Vencimiento:</span>{" "}
                  <span>{cotizacion.fecha_vencimiento ?? "—"}</span>
                </div>
                {cotizacion.notas && (
                  <div className="col-span-2">
                    <span className="text-neutral-500">Notas:</span> <span>{cotizacion.notas}</span>
                  </div>
                )}
              </div>

              {/* Items table */}
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">
                        Producto
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-neutral-500">
                        Cant.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-neutral-500">
                        Precio unit.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-neutral-500">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(cotizacion.detalles ?? []).map((d: CotizacionDetalleDto) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2 font-medium text-neutral-900">
                          {d.producto_nombre ?? d.producto_id}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-600">{d.cantidad}</td>
                        <td className="px-3 py-2 text-right text-neutral-600">
                          {showCotizar && cotizacion.estado === "PENDIENTE" ? (
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={precios[d.id] ?? ""}
                              onChange={(e) => handlePrecioChange(d.id, e.target.value)}
                              className="w-24 rounded border border-neutral-300 px-2 py-0.5 text-right text-sm focus:border-primary-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          ) : (
                            <span>
                              {d.precio_unitario !== null
                                ? `S/ ${Number(d.precio_unitario).toFixed(2)}`
                                : "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-600">
                          {d.subtotal !== null ? `S/ ${Number(d.subtotal).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {serverError !== null && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
                  {serverError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
          {cotizacion?.estado === "PENDIENTE" && !showCotizar && (
            <button
              type="button"
              onClick={() => setShowCotizar(true)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Ingresar precios
            </button>
          )}
          {cotizacion?.estado === "PENDIENTE" && showCotizar && (
            <>
              <button
                type="button"
                onClick={() => setShowCotizar(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitCotizar}
                disabled={cotizarMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {cotizarMutation.isPending ? "Guardando..." : "Marcar cotizada"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CotizacionesPage() {
  const [page, setPage] = useState(1);
  const [filterEstado, setFilterEstado] = useState("");
  const [showCrear, setShowCrear] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const estadoFilter =
    filterEstado !== "" ? (filterEstado as NonNullable<CotizacionesParams["estado"]>) : undefined;

  const params: CotizacionesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(estadoFilter !== undefined ? { estado: estadoFilter } : {}),
  };

  const { data, isLoading, isError } = useCotizaciones(params);
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Cotizaciones de compra</h1>
        <button
          type="button"
          onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva cotización
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="COTIZADA">Cotizada</option>
          <option value="VENCIDA">Vencida</option>
        </select>
        {filterEstado !== "" && (
          <button
            type="button"
            onClick={() => {
              setFilterEstado("");
              setPage(1);
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger-600">Error al cargar cotizaciones.</p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Estado
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Solicitud
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Vencimiento
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
                    No se encontraron cotizaciones.
                  </td>
                </tr>
              )}
              {data?.data.map((c: CotizacionDto) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-neutral-900">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{c.proveedor_nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={c.estado} />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {c.fecha_solicitud}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {c.fecha_vencimiento ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setDetalleId(c.id)}
                        title="Ver detalle"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} cotización{meta.total !== 1 ? "es" : ""}
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

      {showCrear && <CrearCotizacionModal onClose={() => setShowCrear(false)} />}
      {detalleId !== null && (
        <DetalleModal cotizacionId={detalleId} onClose={() => setDetalleId(null)} />
      )}
    </div>
  );
}
