import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import { useLotes, useProductos } from "../hooks/useInventario";
import type { LotesParams } from "../types/inventario";

const PAGE_SIZE = 20;

const SELECT =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

export function LotesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LotesParams>({});

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
    </div>
  );
}
