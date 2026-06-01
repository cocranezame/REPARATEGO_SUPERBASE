import { Navigate, Outlet } from "react-router-dom";
import { usePortalAuthStore } from "../../../shared/stores/portal-auth-store";

export function PortalGuard() {
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return <Outlet />;
}
