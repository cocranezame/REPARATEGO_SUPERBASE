import type { RolUsuario } from "@kallpasoft/shared";
import {
  BookOpen,
  Building2,
  Flag,
  Home,
  LogOut,
  Menu,
  Package,
  Truck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../shared/stores/auth-store";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  roles?: RolUsuario[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: <Home className="h-5 w-5" /> },
  {
    label: "Usuarios",
    to: "/admin/usuarios",
    icon: <Users className="h-5 w-5" />,
    roles: ["ADMIN"],
  },
  {
    label: "Sucursales",
    to: "/admin/sucursales",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["ADMIN"],
  },
  {
    label: "Feature Flags",
    to: "/admin/feature-flags",
    icon: <Flag className="h-5 w-5" />,
    roles: ["ADMIN"],
  },
  { label: "Catálogos", to: "/catalogos", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Clientes", to: "/clientes", icon: <UserRound className="h-5 w-5" /> },
  { label: "Proveedores", to: "/proveedores", icon: <Truck className="h-5 w-5" /> },
  { label: "Inventario", to: "/inventario/productos", icon: <Package className="h-5 w-5" /> },
];

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  usuarios: "Usuarios",
  sucursales: "Sucursales",
  "feature-flags": "Feature Flags",
  catalogos: "Catálogos",
  clientes: "Clientes",
  proveedores: "Proveedores",
  inventario: "Inventario",
  productos: "Productos",
  "tasas-precio": "Tasas de precio",
  "metodos-pago": "Métodos de pago",
};

function breadcrumbsFromPath(pathname: string): string[] {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((s) => SEGMENT_LABELS[s] ?? s);
}

function navLinkClass(isActive: boolean, collapsed: boolean): string {
  const base = `flex items-center rounded-lg px-3 py-2 text-sm transition-colors mb-0.5`;
  const align = collapsed ? "justify-center" : "gap-3";
  const color = isActive
    ? "bg-primary-700 text-white"
    : "text-neutral-400 hover:bg-neutral-700 hover:text-white";
  return `${base} ${align} ${color}`;
}

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const crumbs = breadcrumbsFromPath(pathname);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user !== null && item.roles.includes(user.rol))
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-default bg-black/50 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-neutral-900 transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-700 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">ReparaTego</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => navLinkClass(isActive, false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user !== null ? `${user.nombres} ${user.apellidos}` : ""}
              </p>
              <p className="truncate text-xs text-neutral-400">{user?.rol ?? ""}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col bg-neutral-900 transition-all duration-200 ease-in-out lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-neutral-700 ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Wrench className="h-4 w-4 text-white" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">ReparaTego</span>
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Colapsar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <Menu className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) => navLinkClass(isActive, collapsed)}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-neutral-700">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1 p-2">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                title="Expandir"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user !== null ? `${user.nombres} ${user.apellidos}` : ""}
                  </p>
                  <p className="truncate text-xs text-neutral-400">{user?.rol ?? ""}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
              {crumbs.map((crumb, i) => (
                <span key={crumb} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-neutral-300">/</span>}
                  <span
                    className={
                      i === crumbs.length - 1 ? "font-medium text-neutral-900" : "text-neutral-500"
                    }
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden font-medium text-neutral-700 sm:block">
              {user !== null ? `${user.nombres} ${user.apellidos}` : ""}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
