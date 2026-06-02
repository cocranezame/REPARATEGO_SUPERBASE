import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAlertasStock, useStock } from "../hooks/useInventario";
import type { AlertaStockDto, StockItemDto } from "../types/inventario";

const SELECT =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

function StockTable({ items }: { items: StockItemDto[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Producto</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Código</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Sucursal</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Stock actual</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Stock mínimo</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  No se encontraron registros.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={`${item.producto_id}-${item.sucursal_id}`} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{item.nombre}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700">
                    {item.codigo}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{item.sucursal_nombre ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      item.en_alerta ? "font-semibold text-danger-600" : "text-neutral-700"
                    }
                  >
                    {item.stock_actual}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-neutral-500">{item.stock_minimo}</td>
                <td className="px-4 py-3">
                  {item.en_alerta ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Alerta
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertasTable({ items }: { items: AlertaStockDto[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Producto</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Código</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Stock actual</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Stock mínimo</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Todos los productos tienen stock suficiente.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.producto_id} className="bg-red-50/30 hover:bg-red-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{item.nombre}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700">
                    {item.codigo}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-danger-600">
                  {item.stock_actual}
                </td>
                <td className="px-4 py-3 text-right text-neutral-500">{item.stock_minimo}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    {item.diferencia}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StockPage() {
  const [tab, setTab] = useState<"stock" | "alertas">("stock");
  const [soloAlertas, setSoloAlertas] = useState(false);

  const {
    data: stockData,
    isLoading: loadingStock,
    isError: errorStock,
  } = useStock({
    ...(soloAlertas ? { alerta_minimo: true } : {}),
  });
  const { data: alertasData, isLoading: loadingAlertas, isError: errorAlertas } = useAlertasStock();

  const alertasCount = alertasData?.data.productos.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Stock</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "stock"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Stock general
        </button>
        <button
          type="button"
          onClick={() => setTab("alertas")}
          className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "alertas"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Alertas
          {alertasCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {alertasCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Stock general */}
      {tab === "stock" && (
        <>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={soloAlertas}
                onChange={(e) => setSoloAlertas(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600"
              />
              Mostrar solo productos en alerta
            </label>
          </div>
          {loadingStock && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}
          {errorStock && (
            <p className="py-8 text-center text-sm text-danger-600">Error al cargar stock.</p>
          )}
          {!loadingStock && !errorStock && <StockTable items={stockData?.data ?? []} />}
        </>
      )}

      {/* Tab: Alertas */}
      {tab === "alertas" && (
        <>
          {alertasCount > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>{alertasCount}</strong> producto{alertasCount !== 1 ? "s" : ""} con stock por
              debajo del mínimo configurado.
            </div>
          )}
          {loadingAlertas && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}
          {errorAlertas && (
            <p className="py-8 text-center text-sm text-danger-600">Error al cargar alertas.</p>
          )}
          {!loadingAlertas && !errorAlertas && (
            <AlertasTable items={alertasData?.data.productos ?? []} />
          )}
        </>
      )}
    </div>
  );
}
