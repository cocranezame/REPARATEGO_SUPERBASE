import {
  AlertTriangle,
  ArrowLeftRight,
  ClipboardList,
  DollarSign,
  Layers,
  Package,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardInventario } from "../hooks/useInventario";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-neutral-900">{value}</p>
        {sub !== undefined && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm font-medium text-neutral-700 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

export function DashboardInventarioPage() {
  const { data, isLoading, isError } = useDashboardInventario();
  const dash = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || dash === undefined) {
    return (
      <p className="py-12 text-center text-sm text-danger-600">
        Error al cargar el dashboard de inventario.
      </p>
    );
  }

  const alertas = dash.productos_stock_bajo_minimo;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Inventario</h1>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-5 w-5 text-blue-600" />}
          label="Total productos"
          value={dash.total_productos}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Wrench className="h-5 w-5 text-violet-600" />}
          label="Total servicios"
          value={dash.total_servicios}
          color="bg-violet-50"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Valor inventario"
          value={`S/ ${Number(dash.valor_total_inventario).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
          color="bg-green-50"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-yellow-600" />}
          label="Cotizaciones pendientes"
          value={dash.cotizaciones_pendientes}
          {...(dash.cotizaciones_pendientes > 0 ? { sub: "Ver cotizaciones →" } : {})}
          color="bg-yellow-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alertas stock bajo mínimo */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger-500" />
              <h2 className="text-sm font-semibold text-neutral-900">Stock bajo mínimo</h2>
            </div>
            {alertas.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {alertas.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-neutral-100">
            {alertas.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-neutral-400">
                Todos los productos tienen stock suficiente.
              </p>
            )}
            {alertas.map((p) => (
              <div key={p.producto_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{p.nombre}</p>
                  <p className="text-xs text-neutral-400">{p.codigo}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">Mín: {p.stock_minimo}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    {p.stock_actual}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {alertas.length > 0 && (
            <div className="border-t border-neutral-100 px-5 py-3">
              <Link
                to="/inventario/stock"
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Ver todas las alertas →
              </Link>
            </div>
          )}
        </div>

        {/* Cotizaciones pendientes + Accesos rápidos */}
        <div className="space-y-4">
          {dash.cotizaciones_pendientes > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Cotizaciones pendientes</p>
                  <p className="mt-0.5 text-xs text-yellow-600">
                    {dash.cotizaciones_pendientes} cotización
                    {dash.cotizaciones_pendientes !== 1 ? "es" : ""} esperando respuesta de
                    proveedor
                  </p>
                </div>
                <Link
                  to="/compras/cotizaciones"
                  className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
                >
                  Ver
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink
                to="/inventario/productos"
                icon={<Package className="h-4 w-4" />}
                label="Repuestos"
              />
              <QuickLink
                to="/inventario/stock"
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Stock y alertas"
              />
              <QuickLink
                to="/inventario/movimientos"
                icon={<ArrowLeftRight className="h-4 w-4" />}
                label="Movimientos"
              />
              <QuickLink
                to="/compras/cotizaciones"
                icon={<ClipboardList className="h-4 w-4" />}
                label="Cotizaciones"
              />
              <QuickLink
                to="/inventario/lotes"
                icon={<Layers className="h-4 w-4" />}
                label="Lotes"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
