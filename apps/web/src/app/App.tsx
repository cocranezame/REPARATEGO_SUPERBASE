import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
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
            <Route
              path="/admin/usuarios"
              element={<p className="text-sm text-neutral-500">Usuarios — pendiente E1.10</p>}
            />
            <Route
              path="/admin/sucursales"
              element={<p className="text-sm text-neutral-500">Sucursales — pendiente E1.11</p>}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
