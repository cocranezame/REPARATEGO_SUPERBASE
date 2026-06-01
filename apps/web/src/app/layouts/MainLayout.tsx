import type { RolUsuario } from "@kallpasoft/shared";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Flag,
  Home,
  Kanban,
  Layers,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  Percent,
  Receipt,
  Shield,
  ShoppingCart,
  Tag,
  Truck,
  UserRound,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../shared/stores/auth-store";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  primaryTo: string;
  activePrefix: string;
  items: NavItem[];
  roles?: RolUsuario[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home className="h-5 w-5" />,
    primaryTo: "/dashboard",
    activePrefix: "/dashboard",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: <Home className="h-5 w-5" />, end: true },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    icon: <Shield className="h-5 w-5" />,
    primaryTo: "/admin/usuarios",
    activePrefix: "/admin",
    roles: ["ADMIN"],
    items: [
      { label: "Usuarios", to: "/admin/usuarios", icon: <Users className="h-5 w-5" /> },
      { label: "Sucursales", to: "/admin/sucursales", icon: <Building2 className="h-5 w-5" /> },
      { label: "Feature Flags", to: "/admin/feature-flags", icon: <Flag className="h-5 w-5" /> },
    ],
  },
  {
    id: "catalogos",
    label: "Catálogos",
    icon: <BookOpen className="h-5 w-5" />,
    primaryTo: "/catalogos",
    activePrefix: "/catalogos",
    items: [
      { label: "Catálogos", to: "/catalogos", icon: <BookOpen className="h-5 w-5" />, end: true },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: <UserRound className="h-5 w-5" />,
    primaryTo: "/clientes",
    activePrefix: "/clientes",
    items: [
      { label: "Clientes", to: "/clientes", icon: <UserRound className="h-5 w-5" />, end: true },
    ],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: <Truck className="h-5 w-5" />,
    primaryTo: "/proveedores",
    activePrefix: "/proveedores",
    items: [
      {
        label: "Proveedores",
        to: "/proveedores",
        icon: <Truck className="h-5 w-5" />,
        end: true,
      },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: <Package className="h-5 w-5" />,
    primaryTo: "/inventario/productos",
    activePrefix: "/inventario",
    items: [
      { label: "Productos", to: "/inventario/productos", icon: <Package className="h-5 w-5" /> },
      { label: "Lotes", to: "/inventario/lotes", icon: <Layers className="h-5 w-5" /> },
      {
        label: "Movimientos",
        to: "/inventario/movimientos",
        icon: <ArrowLeftRight className="h-5 w-5" />,
      },
      {
        label: "Tasas de precio",
        to: "/inventario/tasas-precio",
        icon: <Percent className="h-5 w-5" />,
      },
      {
        label: "Métodos de pago",
        to: "/inventario/metodos-pago",
        icon: <CreditCard className="h-5 w-5" />,
      },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: <ShoppingCart className="h-5 w-5" />,
    primaryTo: "/compras/cotizaciones",
    activePrefix: "/compras",
    items: [
      {
        label: "Cotizaciones",
        to: "/compras/cotizaciones",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        label: "Solicitudes",
        to: "/compras/solicitudes",
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        label: "Órdenes OC",
        to: "/compras/ordenes",
        icon: <PackageCheck className="h-5 w-5" />,
      },
      { label: "Pagos OC", to: "/compras/pagos", icon: <Wallet className="h-5 w-5" /> },
    ],
  },
  {
    id: "servicios",
    label: "Servicios",
    icon: <Wrench className="h-5 w-5" />,
    primaryTo: "/servicios",
    activePrefix: "/servicios",
    items: [
      { label: "Lista", to: "/servicios", icon: <Wrench className="h-5 w-5" />, end: true },
      { label: "Kanban Servicios", to: "/servicios/kanban", icon: <Kanban className="h-5 w-5" /> },
      {
        label: "Requerimientos",
        to: "/servicios/requerimientos",
        icon: <ClipboardList className="h-5 w-5" />,
      },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: <Receipt className="h-5 w-5" />,
    primaryTo: "/ventas/pos",
    activePrefix: "/ventas",
    items: [
      { label: "POS", to: "/ventas/pos", icon: <ShoppingCart className="h-5 w-5" /> },
      { label: "Lista", to: "/ventas", icon: <Receipt className="h-5 w-5" />, end: true },
      {
        label: "Cotizaciones",
        to: "/ventas/cotizaciones",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      { label: "Caja", to: "/ventas/caja", icon: <Wallet className="h-5 w-5" /> },
      { label: "Envíos", to: "/ventas/envios", icon: <Truck className="h-5 w-5" /> },
    ],
  },
  {
    id: "domicilios",
    label: "Domicilios",
    icon: <MapPin className="h-5 w-5" />,
    primaryTo: "/domicilios",
    activePrefix: "/domicilios",
    items: [
      { label: "Kanban", to: "/domicilios", icon: <MapPin className="h-5 w-5" />, end: true },
      { label: "Calendario", to: "/domicilios/calendario", icon: <Calendar className="h-5 w-5" /> },
      { label: "Tarifas", to: "/domicilios/tarifas", icon: <Tag className="h-5 w-5" /> },
    ],
  },
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
  compras: "Compras",
  cotizaciones: "Cotizaciones",
  comparar: "Comparador",
  solicitudes: "Solicitudes",
  ordenes: "Órdenes OC",
  "tasas-precio": "Tasas de precio",
  "metodos-pago": "Métodos de pago",
  lotes: "Lotes",
  movimientos: "Movimientos",
  pagos: "Pagos OC",
  servicios: "Servicios",
  kanban: "Kanban",
  requerimientos: "Requerimientos",
  nuevo: "Nueva OS",
  ventas: "Ventas",
  caja: "Caja",
  pos: "Punto de Venta",
  nueva: "Nueva venta",
  historial: "Historial",
  envios: "Envíos",
  domicilios: "Domicilios",
  calendario: "Calendario",
  tarifas: "Tarifas",
};

function breadcrumbsFromPath(pathname: string): string[] {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((s) => SEGMENT_LABELS[s] ?? s);
}

function navItemClass(isActive: boolean): string {
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5";
  const color = isActive
    ? "bg-primary-700 text-white"
    : "text-neutral-400 hover:bg-neutral-700 hover:text-white";
  return `${base} ${color}`;
}

function navItemCollapsedClass(isActive: boolean): string {
  const base =
    "flex items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors mb-0.5";
  const color = isActive
    ? "bg-primary-700 text-white"
    : "text-neutral-400 hover:bg-neutral-700 hover:text-white";
  return `${base} ${color}`;
}

// ─── Sidebar content (shared between mobile and desktop) ──────────────────────

function SidebarNav({
  collapsed,
  pathname,
  user,
  openGroups,
  onToggleGroup,
  onClose,
}: {
  collapsed: boolean;
  pathname: string;
  user: { rol: RolUsuario } | null;
  openGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  onClose?: () => void;
}) {
  const visibleGroups = NAV_GROUPS.filter(
    (g) => !g.roles || (user !== null && g.roles.includes(user.rol))
  );

  if (collapsed) {
    return (
      <>
        {visibleGroups.map((group) => {
          const isGroupActive = pathname.startsWith(group.activePrefix);
          return (
            <NavLink
              key={group.id}
              to={group.primaryTo}
              title={group.label}
              className={() => navItemCollapsedClass(isGroupActive)}
            >
              {group.icon}
            </NavLink>
          );
        })}
      </>
    );
  }

  return (
    <>
      {visibleGroups.map((group) => {
        if (group.items.length === 1) {
          const item = group.items[0];
          if (!item) return null;
          return (
            <NavLink
              key={group.id}
              to={item.to}
              {...(item.end ? { end: true } : {})}
              title={item.label}
              onClick={onClose}
              className={({ isActive }) => navItemClass(isActive)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        }

        const isOpen = openGroups.has(group.id);
        return (
          <div key={group.id} className="mb-0.5">
            <button
              type="button"
              onClick={() => onToggleGroup(group.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              {group.icon}
              <span className="flex-1 text-left">{group.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="ml-4 mt-0.5 border-l border-neutral-700 pl-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    {...(item.end ? { end: true } : {})}
                    title={item.label}
                    onClick={onClose}
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const path = window.location.pathname;
    for (const g of NAV_GROUPS) {
      if (path.startsWith(g.activePrefix)) initial.add(g.id);
    }
    return initial;
  });

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    for (const g of NAV_GROUPS) {
      if (pathname.startsWith(g.activePrefix)) {
        setOpenGroups((prev) => new Set([...prev, g.id]));
      }
    }
  }, [pathname]);

  const crumbs = breadcrumbsFromPath(pathname);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          <SidebarNav
            collapsed={false}
            pathname={pathname}
            user={user}
            openGroups={openGroups}
            onToggleGroup={toggleGroup}
            onClose={() => setMobileOpen(false)}
          />
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
          <SidebarNav
            collapsed={collapsed}
            pathname={pathname}
            user={user}
            openGroups={openGroups}
            onToggleGroup={toggleGroup}
          />
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
