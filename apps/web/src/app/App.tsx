import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { CatalogosPage } from "../modules/catalogos/pages/CatalogosPage";
import { ClienteDetallePage } from "../modules/clientes/pages/ClienteDetallePage";
import { ClientesPage } from "../modules/clientes/pages/ClientesPage";
import { ComparadorPage } from "../modules/compras/pages/ComparadorPage";
import { CotizacionesPage } from "../modules/compras/pages/CotizacionesPage";
import { OrdenDetallePage } from "../modules/compras/pages/OrdenDetallePage";
import { OrdenesPage } from "../modules/compras/pages/OrdenesPage";
import { PagosPage } from "../modules/compras/pages/PagosPage";
import { SolicitudesPage } from "../modules/compras/pages/SolicitudesPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { CalendarioPage } from "../modules/domicilios/pages/CalendarioPage";
import { DomiciliosPage } from "../modules/domicilios/pages/DomiciliosPage";
import { NuevaVisitaPage } from "../modules/domicilios/pages/NuevaVisitaPage";
import { TarifasPage } from "../modules/domicilios/pages/TarifasPage";
import { FeatureFlagsPage } from "../modules/feature-flags/pages/FeatureFlagsPage";
import { LotesPage } from "../modules/inventario/pages/LotesPage";
import { MetodosPagoPage } from "../modules/inventario/pages/MetodosPagoPage";
import { MovimientosPage } from "../modules/inventario/pages/MovimientosPage";
import { ProductoFormPage } from "../modules/inventario/pages/ProductoFormPage";
import { ProductosPage } from "../modules/inventario/pages/ProductosPage";
import { TasasPrecioPage } from "../modules/inventario/pages/TasasPrecioPage";
import { ProveedorDetallePage } from "../modules/proveedores/pages/ProveedorDetallePage";
import { ProveedoresPage } from "../modules/proveedores/pages/ProveedoresPage";
import { KanbanServiciosPage } from "../modules/servicios/pages/KanbanServiciosPage";
import { NuevaOrdenPage } from "../modules/servicios/pages/NuevaOrdenPage";
import { OrdenServicioDetallePage } from "../modules/servicios/pages/OrdenServicioDetallePage";
import { ServiciosPage } from "../modules/servicios/pages/ServiciosPage";
import { SucursalesPage } from "../modules/sucursales/pages/SucursalesPage";
import { UsuariosPage } from "../modules/usuarios/pages/UsuariosPage";
import { CajaPage } from "../modules/ventas/pages/CajaPage";
import { EnviosPage } from "../modules/ventas/pages/EnviosPage";
import { HistorialVentasPage } from "../modules/ventas/pages/HistorialVentasPage";
import { KanbanVentasPage } from "../modules/ventas/pages/KanbanVentasPage";
import { NuevaVentaPage } from "../modules/ventas/pages/NuevaVentaPage";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/sucursales" element={<SucursalesPage />} />
            <Route path="/admin/feature-flags" element={<FeatureFlagsPage />} />
            <Route path="/catalogos" element={<CatalogosPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetallePage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/proveedores/:id" element={<ProveedorDetallePage />} />
            <Route path="/inventario/productos" element={<ProductosPage />} />
            <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/inventario/productos/:id" element={<ProductoFormPage />} />
            <Route path="/inventario/tasas-precio" element={<TasasPrecioPage />} />
            <Route path="/inventario/metodos-pago" element={<MetodosPagoPage />} />
            <Route path="/inventario/lotes" element={<LotesPage />} />
            <Route path="/inventario/movimientos" element={<MovimientosPage />} />
            <Route path="/compras/cotizaciones" element={<CotizacionesPage />} />
            <Route path="/compras/cotizaciones/comparar" element={<ComparadorPage />} />
            <Route path="/compras/solicitudes" element={<SolicitudesPage />} />
            <Route path="/compras/ordenes" element={<OrdenesPage />} />
            <Route path="/compras/ordenes/:id" element={<OrdenDetallePage />} />
            <Route path="/compras/pagos" element={<PagosPage />} />
            <Route path="/servicios" element={<ServiciosPage />} />
            <Route path="/servicios/kanban" element={<KanbanServiciosPage />} />
            <Route path="/servicios/nuevo" element={<NuevaOrdenPage />} />
            <Route path="/servicios/:id" element={<OrdenServicioDetallePage />} />
            <Route path="/ventas/caja" element={<CajaPage />} />
            <Route path="/ventas/nueva" element={<NuevaVentaPage />} />
            <Route path="/ventas/historial" element={<HistorialVentasPage />} />
            <Route path="/ventas/envios" element={<EnviosPage />} />
            <Route path="/ventas/kanban" element={<KanbanVentasPage />} />
            <Route path="/domicilios" element={<DomiciliosPage />} />
            <Route path="/domicilios/nueva" element={<NuevaVisitaPage />} />
            <Route path="/domicilios/calendario" element={<CalendarioPage />} />
            <Route path="/domicilios/tarifas" element={<TarifasPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
