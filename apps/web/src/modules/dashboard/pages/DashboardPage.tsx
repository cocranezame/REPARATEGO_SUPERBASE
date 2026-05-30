import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useStock } from "../../inventario/hooks/useInventario";

function StockAlertasWidget() {
  const { data, isLoading } = useStock({ alerta_minimo: true });
  const alertas = data?.data ?? [];

  if (isLoading) return null;
  if (alertas.length === 0) return null;

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h2 className="text-sm font-semibold text-yellow-800">
          Alertas de stock mínimo ({alertas.length})
        </h2>
      </div>
      <ul className="space-y-1.5">
        {alertas.slice(0, 8).map((item) => (
          <li
            key={`${item.producto_id}-${item.sucursal_id}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-yellow-900">{item.nombre}</span>
            <span className="font-mono text-xs text-yellow-700">
              {item.stock_actual} / {item.stock_minimo} mín.
            </span>
          </li>
        ))}
        {alertas.length > 8 && (
          <li className="pt-1">
            <Link
              to="/inventario/lotes"
              className="text-xs text-yellow-700 underline underline-offset-2"
            >
              Ver todos ({alertas.length})
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Bienvenido{user !== null ? `, ${user.nombres}` : ""} a ReparaTego
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Panel principal del taller</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StockAlertasWidget />
      </div>
    </div>
  );
}
