import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { FeatureFlagsPage } from "../modules/feature-flags/pages/FeatureFlagsPage";
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
