import { Wrench } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { usePortalAsistenciaAuth } from "../hooks/usePortalAsistencia";

export function PortalAsistenciaLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loginMutation } = usePortalAsistenciaAuth();

  const [numeroDoc, setNumeroDoc] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/portal/asistencia" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!numeroDoc.trim() || !password.trim()) return;
    try {
      await loginMutation.mutateAsync({ numero_doc: numeroDoc.trim(), password });
      navigate("/portal/asistencia", { replace: true });
    } catch {
      // error shown via loginMutation.error
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
            <p className="mt-1 text-sm text-neutral-500">Portal de Trabajador</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="numero_doc" className="text-sm font-medium text-neutral-700">
              DNI
            </label>
            <input
              id="numero_doc"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 12345678"
              autoComplete="username"
              value={numeroDoc}
              onChange={(e) => setNumeroDoc(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {loginMutation.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger-600">
              {loginMutation.error.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || !numeroDoc.trim() || !password.trim()}
            className="mt-1 rounded-xl bg-primary-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
