import { useCotizaciones } from "../hooks/useCotizaciones";
import type { CotizacionDetalleDto, CotizacionDto } from "../types/cotizacion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PrecioCell = {
  precio: number | null;
  detalle: CotizacionDetalleDto | null;
};

type ComparadorRow = {
  producto_id: string;
  producto_nombre: string;
  por_proveedor: Record<string, PrecioCell>;
};

function buildComparadorData(cotizaciones: CotizacionDto[]): {
  rows: ComparadorRow[];
  proveedores: Array<{ id: string; nombre: string }>;
} {
  const cotizadas = cotizaciones.filter((c) => c.estado === "COTIZADA");

  const proveedorMap = new Map<string, string>();
  for (const c of cotizadas) {
    proveedorMap.set(c.proveedor_id, c.proveedor_nombre ?? c.proveedor_id);
  }

  const productoMap = new Map<string, ComparadorRow>();

  for (const c of cotizadas) {
    for (const d of c.detalles ?? []) {
      if (!productoMap.has(d.producto_id)) {
        productoMap.set(d.producto_id, {
          producto_id: d.producto_id,
          producto_nombre: d.producto_nombre ?? d.producto_id,
          por_proveedor: {},
        });
      }
      const row = productoMap.get(d.producto_id) as ComparadorRow;
      const precio = d.precio_unitario !== null ? Number(d.precio_unitario) : null;
      const existing = row.por_proveedor[c.proveedor_id];
      if (
        !existing ||
        (precio !== null && (existing.precio === null || precio < existing.precio))
      ) {
        row.por_proveedor[c.proveedor_id] = { precio, detalle: d };
      }
    }
  }

  const rows = Array.from(productoMap.values());
  const proveedores = Array.from(proveedorMap.entries()).map(([id, nombre]) => ({ id, nombre }));

  return { rows, proveedores };
}

function getBestPrice(row: ComparadorRow): number | null {
  const precios = Object.values(row.por_proveedor)
    .map((p) => p.precio)
    .filter((p): p is number => p !== null);
  return precios.length > 0 ? Math.min(...precios) : null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ComparadorPage() {
  const { data, isLoading, isError } = useCotizaciones({ pageSize: 200 });

  const cotizaciones = data?.data ?? [];
  const { rows, proveedores } = buildComparadorData(cotizaciones);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Comparador de precios</h1>
        <span className="text-sm text-neutral-500">Solo cotizaciones en estado COTIZADA</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar cotizaciones.</p>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white py-16 text-center text-neutral-500">
          No hay cotizaciones en estado COTIZADA para comparar.
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="sticky left-0 bg-neutral-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Producto
                </th>
                {proveedores.map((prov) => (
                  <th
                    key={prov.id}
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-500"
                  >
                    {prov.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => {
                const best = getBestPrice(row);
                return (
                  <tr key={row.producto_id} className="hover:bg-neutral-50">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-neutral-900 hover:bg-neutral-50">
                      {row.producto_nombre}
                    </td>
                    {proveedores.map((prov) => {
                      const cell = row.por_proveedor[prov.id];
                      const precio = cell?.precio ?? null;
                      const isBest = best !== null && precio !== null && precio === best;
                      return (
                        <td key={prov.id} className="px-4 py-3 text-center">
                          {precio !== null ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isBest
                                  ? "bg-green-100 text-green-800 ring-1 ring-green-500"
                                  : "text-neutral-700"
                              }`}
                            >
                              {isBest && "★ "}S/ {precio.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
            ★ indica el mejor precio disponible por producto
          </div>
        </div>
      )}
    </div>
  );
}
