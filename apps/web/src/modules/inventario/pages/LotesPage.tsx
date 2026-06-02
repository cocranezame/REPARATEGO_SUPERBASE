import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import { useIngresoManual, useLotes, useProductos } from "../hooks/useInventario";
import type { LoteDto, LotesParams } from "../types/inventario";

const PAGE_SIZE = 20;

const SELECT =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const INPUT_SM =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const SELECT_SM =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const LABEL = "text-xs font-medium text-neutral-700";

// ─── Modal ingreso manual ─────────────────────────────────────────────────────

const ingresoSchema = z.object({
  producto_id: z.string().min(1, "Requerido"),
  sucursal_id: z.string().min(1, "Requerido"),
  proveedor_id: z.string().optional(),
  cantidad: z.string().min(1, "Requerido"),
  precio_unitario: z.string().min(1, "Requerido"),
});
type IngresoValues = z.infer<typeof ingresoSchema>;

function IngresoManualModal({ onClose, lotesHoy }: { onClose: () => void; lotesHoy: LoteDto[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<{ editado: boolean; sku: string } | null>(null);

  const { data: productosData } = useProductos({ activo: true, tipo: "PRODUCTO", pageSize: 500 });
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });
  const ingresoMutation = useIngresoManual();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IngresoValues>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: {
      producto_id: "",
      sucursal_id: "",
      proveedor_id: "",
      cantidad: "",
      precio_unitario: "",
    },
  });

  const productoId = watch("producto_id");
  const proveedorIdWatch = watch("proveedor_id");

  // Detectar si existe un lote del mismo día y proveedor
  const today = new Date().toISOString().slice(0, 10);
  const loteExistente = lotesHoy.find(
    (l) =>
      l.producto_id === productoId &&
      l.fecha_ingreso === today &&
      proveedorIdWatch !== "" &&
      // No tenemos proveedor_id en LoteDto directamente, comparamos SKU como aproximación
      // El aviso real viene del resultado del servidor
      false // Solo mostramos aviso tras resultado exitoso
  );

  function onSubmit(values: IngresoValues) {
    setServerError(null);
    setServerResult(null);
    const cantidad = Number.parseInt(values.cantidad, 10);
    const precioUnitario = Number.parseFloat(values.precio_unitario);
    if (Number.isNaN(cantidad) || Number.isNaN(precioUnitario)) {
      setServerError("Valores numéricos inválidos.");
      return;
    }
    ingresoMutation.mutate(
      {
        producto_id: values.producto_id,
        sucursal_id: values.sucursal_id,
        cantidad,
        precio_unitario: precioUnitario,
        ...(values.proveedor_id && values.proveedor_id !== ""
          ? { proveedor_id: values.proveedor_id }
          : {}),
      },
      {
        onSuccess: (res) => {
          setServerResult({ editado: res.data.editado, sku: res.data.lote.sku });
        },
        onError: (err) => setServerError(err.message),
      }
    );
  }

  const productos = productosData?.data ?? [];
  const sucursales = sucursalesData?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Ingreso manual de stock</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {serverResult !== null ? (
          <div className="px-6 py-6 space-y-4">
            {serverResult.editado ? (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <strong>Lote sumado:</strong> Se agregó la cantidad al lote existente{" "}
                <code className="rounded bg-yellow-100 px-1 py-0.5 font-mono text-xs">
                  {serverResult.sku}
                </code>{" "}
                (mismo producto, mismo día, mismo proveedor).
              </div>
            ) : (
              <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <strong>Nuevo lote creado:</strong>{" "}
                <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">
                  {serverResult.sku}
                </code>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-6 py-4">
              {/* Producto */}
              <div className="flex flex-col gap-1">
                <label htmlFor="im-producto" className={LABEL}>
                  Producto <span className="text-danger-500">*</span>
                </label>
                <select id="im-producto" className={SELECT_SM} {...register("producto_id")}>
                  <option value="">Seleccionar...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} — {p.nombre}
                    </option>
                  ))}
                </select>
                {errors.producto_id && (
                  <span className="text-xs text-danger-600">{errors.producto_id.message}</span>
                )}
              </div>

              {/* Sucursal */}
              <div className="flex flex-col gap-1">
                <label htmlFor="im-sucursal" className={LABEL}>
                  Sucursal <span className="text-danger-500">*</span>
                </label>
                <select id="im-sucursal" className={SELECT_SM} {...register("sucursal_id")}>
                  <option value="">Seleccionar...</option>
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

              {/* Cantidad */}
              <div className="flex flex-col gap-1">
                <label htmlFor="im-cant" className={LABEL}>
                  Cantidad <span className="text-danger-500">*</span>
                </label>
                <input
                  id="im-cant"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="10"
                  className={INPUT_SM}
                  {...register("cantidad")}
                />
                {errors.cantidad && (
                  <span className="text-xs text-danger-600">{errors.cantidad.message}</span>
                )}
              </div>

              {/* Precio unitario */}
              <div className="flex flex-col gap-1">
                <label htmlFor="im-precio" className={LABEL}>
                  Precio unitario (S/) <span className="text-danger-500">*</span>
                </label>
                <input
                  id="im-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={INPUT_SM}
                  {...register("precio_unitario")}
                />
                {errors.precio_unitario && (
                  <span className="text-xs text-danger-600">{errors.precio_unitario.message}</span>
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
                disabled={ingresoMutation.isPending || isSubmitting}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ingresoMutation.isPending || isSubmitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {ingresoMutation.isPending || isSubmitting ? "Procesando..." : "Confirmar ingreso"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function LotesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LotesParams>({});
  const [showIngreso, setShowIngreso] = useState(false);

  const params: LotesParams = { ...filters, page, pageSize: PAGE_SIZE };
  const { data, isLoading, isError } = useLotes(params);
  const { data: productosData } = useProductos({ activo: true, pageSize: 200 });
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });

  const lotes = data?.data ?? [];
  const meta = data?.meta;

  function applyFilter(key: keyof LotesParams, value: string) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Lotes de inventario</h1>
        <button
          type="button"
          onClick={() => setShowIngreso(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Ingreso manual
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          className={SELECT}
          value={filters.producto_id ?? ""}
          onChange={(e) => applyFilter("producto_id", e.target.value)}
        >
          <option value="">Todos los productos</option>
          {productosData?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select
          className={SELECT}
          value={filters.sucursal_id ?? ""}
          onChange={(e) => applyFilter("sucursal_id", e.target.value)}
        >
          <option value="">Todas las sucursales</option>
          {sucursalesData?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar lotes.</p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Producto</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Sucursal</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">
                      Cant. inicial
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">
                      Cant. actual
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">
                      P. unitario
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">
                      Fecha ingreso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lotes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                        No hay lotes registrados.
                      </td>
                    </tr>
                  )}
                  {lotes.map((lote) => (
                    <tr key={lote.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">{lote.sku}</td>
                      <td className="px-4 py-3 text-neutral-900">
                        {lote.producto_nombre ?? lote.producto_id}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{lote.sucursal_nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {lote.cantidad_inicial}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            lote.cantidad_actual <= 0
                              ? "font-semibold text-danger-600"
                              : "text-neutral-700"
                          }
                        >
                          {lote.cantidad_actual}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        S/ {Number(lote.precio_unitario).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{lote.fecha_ingreso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>
                {meta.total} lote{meta.total !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 disabled:opacity-40 hover:bg-neutral-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {page} / {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 disabled:opacity-40 hover:bg-neutral-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showIngreso && <IngresoManualModal onClose={() => setShowIngreso(false)} lotesHoy={lotes} />}
    </div>
  );
}
