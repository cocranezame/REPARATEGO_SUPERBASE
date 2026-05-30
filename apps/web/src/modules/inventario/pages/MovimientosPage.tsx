import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import { useMovimientos, useProductos } from "../hooks/useInventario";
import type { MovimientosParams, TipoMovimiento } from "../types/inventario";

const PAGE_SIZE = 20;

const SELECT =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const INPUT =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const TIPO_BADGE: Record<TipoMovimiento, string> = {
  INGRESO: "bg-green-100 text-green-700",
  VENTA: "bg-blue-100 text-blue-700",
  SERVICIO: "bg-violet-100 text-violet-700",
  MERMA: "bg-red-100 text-red-700",
  REAJUSTE: "bg-yellow-100 text-yellow-700",
  TRANSFERENCIA: "bg-orange-100 text-orange-700",
};

const TIPOS: TipoMovimiento[] = [
  "INGRESO",
  "VENTA",
  "SERVICIO",
  "MERMA",
  "REAJUSTE",
  "TRANSFERENCIA",
];

function TipoBadge({ tipo }: { tipo: TipoMovimiento }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_BADGE[tipo]}`}
    >
      {tipo}
    </span>
  );
}

export function MovimientosPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<MovimientosParams>({});

  const params: MovimientosParams = { ...filters, page, pageSize: PAGE_SIZE };
  const { data, isLoading, isError } = useMovimientos(params);
  const { data: productosData } = useProductos({ activo: true, pageSize: 200 });
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });

  const movimientos = data?.data ?? [];
  const meta = data?.meta;

  function applyFilter(key: keyof MovimientosParams, value: string) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Historial de movimientos</h1>
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
          value={filters.tipo ?? ""}
          onChange={(e) => applyFilter("tipo", e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
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
        <input
          type="date"
          className={INPUT}
          value={filters.desde ?? ""}
          onChange={(e) => applyFilter("desde", e.target.value)}
          title="Desde"
          placeholder="Desde"
        />
        <input
          type="date"
          className={INPUT}
          value={filters.hasta ?? ""}
          onChange={(e) => applyFilter("hasta", e.target.value)}
          title="Hasta"
          placeholder="Hasta"
        />
      </div>

      {/* Tabla */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar movimientos.</p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Producto</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">Cantidad</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Referencia</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  )}
                  {movimientos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(mov.created_at).toLocaleDateString("es-PE")}
                      </td>
                      <td className="px-4 py-3 text-neutral-900">
                        {mov.producto_nombre ?? mov.producto_id}
                      </td>
                      <td className="px-4 py-3">
                        <TipoBadge tipo={mov.tipo} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            mov.cantidad < 0
                              ? "font-semibold text-danger-600"
                              : "text-success-600 font-semibold"
                          }
                        >
                          {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {mov.referencia_tipo ?? "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-neutral-400 text-xs">
                        {mov.notas ?? "—"}
                      </td>
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
                {meta.total} movimiento{meta.total !== 1 ? "s" : ""}
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
