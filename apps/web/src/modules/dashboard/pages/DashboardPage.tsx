import { useAuthStore } from "../../../shared/stores/auth-store";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Bienvenido{user !== null ? `, ${user.nombres}` : ""} a ReparaTego
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Métricas del taller — pendiente implementar</p>
    </div>
  );
}
