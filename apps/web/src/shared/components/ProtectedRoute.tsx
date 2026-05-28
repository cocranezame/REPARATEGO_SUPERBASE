import { Navigate, Outlet } from "react-router-dom";
import { useAuthGuard } from "../hooks/useAuthGuard";

export function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuthGuard();

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
