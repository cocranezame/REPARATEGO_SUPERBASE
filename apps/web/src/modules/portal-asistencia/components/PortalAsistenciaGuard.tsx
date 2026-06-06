import { Navigate, Outlet } from "react-router-dom";
import { usePortalAsistenciaAuthStore } from "../../../shared/stores/portal-asistencia-auth-store";

export function PortalAsistenciaGuard() {
  const isAuthenticated = usePortalAsistenciaAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/portal/asistencia/login" replace />;
  }

  return <Outlet />;
}
