import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginInput } from "@kallpasoft/validators";
import { loginSchema } from "@kallpasoft/validators";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { apiClient } from "../../../shared/lib/api-client";
import type { AuthUser } from "../../../shared/stores/auth-store";
import { useAuthStore } from "../../../shared/stores/auth-store";

type LoginResponse = {
  success: true;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      nombres: string;
      apellidos: string;
      rol: string;
      tenant_id: string;
      sucursal_id: string | null;
    };
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tipo_documento: "DNI", numero_documento: "", password: "" },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    try {
      const res = await apiClient.post<LoginResponse>("/auth/login", data);
      const user: AuthUser = {
        id: res.data.user.id,
        tenantId: res.data.user.tenant_id,
        nombres: res.data.user.nombres,
        apellidos: res.data.user.apellidos,
        rol: res.data.user.rol as AuthUser["rol"],
        sucursalId: res.data.user.sucursal_id,
      };
      login({ accessToken: res.data.access_token, refreshToken: res.data.refresh_token }, user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700">
          <Wrench className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-primary-900">ReparaTego</h1>
          <p className="mt-1 text-sm text-neutral-500">Inicia sesión en tu cuenta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo_documento" className="text-sm font-medium text-neutral-700">
            Tipo de documento
          </label>
          <select
            id="tipo_documento"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            {...register("tipo_documento")}
          >
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
            <option value="CE">Carnet de extranjería</option>
          </select>
          {errors.tipo_documento && (
            <span className="text-xs text-danger-600">{errors.tipo_documento.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="numero_documento" className="text-sm font-medium text-neutral-700">
            Número de documento
          </label>
          <input
            id="numero_documento"
            type="text"
            inputMode="numeric"
            placeholder="Ingresa tu número de documento"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            {...register("numero_documento")}
          />
          {errors.numero_documento && (
            <span className="text-xs text-danger-600">{errors.numero_documento.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            {...register("password")}
          />
          {errors.password && (
            <span className="text-xs text-danger-600">{errors.password.message}</span>
          )}
        </div>

        {serverError !== null && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger-600">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
