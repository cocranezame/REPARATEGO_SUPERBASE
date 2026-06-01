import { LogOut, Wrench } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { usePortalAuthStore } from "../../shared/stores/portal-auth-store";

export function PortalLayout() {
  const user = usePortalAuthStore((s) => s.user);
  const logout = usePortalAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/portal/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-primary-900 text-sm">ReparaTego</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 hidden sm:block">{user.clienteNombre}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 bg-white py-3 text-center text-xs text-neutral-400">
        Portal del Cliente · ReparaTego
      </footer>
    </div>
  );
}
