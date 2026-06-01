import { zodResolver } from "@hookform/resolvers/zod";
import type { PortalLoginInput } from "@kallpasoft/validators";
import { portalLoginSchema } from "@kallpasoft/validators";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { usePortalAuthStore } from "../../../shared/stores/portal-auth-store";
import { portalApi } from "../lib/portal-api";

export function PortalLoginPage() {
  const navigate = useNavigate();
  const login = usePortalAuthStore((s) => s.login);
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PortalLoginInput>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { numero_doc: "", celular: "" },
  });

  if (isAuthenticated) {
    return <Navigate to="/portal/mis-equipos" replace />;
  }

  const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

  async function onSubmit(data: PortalLoginInput) {
    setServerError(null);
    try {
      const res = await portalApi.login(data.numero_doc, data.celular);
      login({
        clienteId: res.data.cliente_id,
        clienteNombre: res.data.cliente_nombre,
        tenantId: TENANT_ID,
        token: res.data.token,
      });
      navigate("/portal/mis-equipos", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-primary-900 sm:text-2xl">ReparaTego</h1>
            <p className="mt-1 text-sm text-neutral-500">Consulta el estado de tus equipos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="numero_doc" className="text-sm font-medium text-neutral-700">
              Número de documento
            </label>
            <input
              id="numero_doc"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 12345678"
              autoComplete="off"
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("numero_doc")}
            />
            {errors.numero_doc && (
              <span className="text-xs text-danger-600">{errors.numero_doc.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="celular" className="text-sm font-medium text-neutral-700">
              Número de celular
            </label>
            <input
              id="celular"
              type="tel"
              inputMode="numeric"
              placeholder="Ej: 987654321"
              autoComplete="tel"
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("celular")}
            />
            {errors.celular && (
              <span className="text-xs text-danger-600">{errors.celular.message}</span>
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
            className="mt-1 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verificando..." : "Ver mis equipos"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Usa el número de documento y celular con el que te registramos
        </p>
      </div>
    </div>
  );
}
