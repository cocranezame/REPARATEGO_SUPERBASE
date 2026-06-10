import { CalendarDays, Clock, LogOut, Wrench } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { usePortalAsistenciaAuthStore } from "../../shared/stores/portal-asistencia-auth-store";

export function PortalAsistenciaLayout() {
  const user = usePortalAsistenciaAuthStore((s) => s.user);
  const logout = usePortalAsistenciaAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/portal/asistencia/login", { replace: true });
  }

  const navBase =
    "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors";
  const navActive = "text-primary-600";
  const navInactive = "text-neutral-400 hover:text-neutral-600";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">ReparaTego</p>
              {user && <p className="text-xs text-neutral-500 leading-none">{user.nombre}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg">
          <NavLink
            to="/portal/asistencia"
            end
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
          >
            {({ isActive }) => (
              <>
                <Clock className={`h-5 w-5 ${isActive ? "text-primary-600" : ""}`} />
                <span>Marcar</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/portal/asistencia/historial"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
          >
            {({ isActive }) => (
              <>
                <CalendarDays className={`h-5 w-5 ${isActive ? "text-primary-600" : ""}`} />
                <span>Historial</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/portal/asistencia/planilla"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
          >
            {({ isActive }) => (
              <>
                <svg
                  aria-label="Planilla"
                  className={`h-5 w-5 ${isActive ? "text-primary-600" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  role="img"
                >
                  <title>Planilla</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                  />
                </svg>
                <span>Planilla</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
