import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { CatalogosPage } from "../modules/catalogos/pages/CatalogosPage";
import { ClienteDetallePage } from "../modules/clientes/pages/ClienteDetallePage";
import { ClientesPage } from "../modules/clientes/pages/ClientesPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { FeatureFlagsPage } from "../modules/feature-flags/pages/FeatureFlagsPage";
import { MetodosPagoPage } from "../modules/inventario/pages/MetodosPagoPage";
import { ProductoFormPage } from "../modules/inventario/pages/ProductoFormPage";
import { ProductosPage } from "../modules/inventario/pages/ProductosPage";
import { TasasPrecioPage } from "../modules/inventario/pages/TasasPrecioPage";
import { SucursalesPage } from "../modules/sucursales/pages/SucursalesPage";
import { UsuariosPage } from "../modules/usuarios/pages/UsuariosPage";
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
            <Route path="/inventario/productos" element={<ProductosPage />} />
            <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/inventario/productos/:id" element={<ProductoFormPage />} />
            <Route path="/inventario/tasas-precio" element={<TasasPrecioPage />} />
            <Route path="/inventario/metodos-pago" element={<MetodosPagoPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
