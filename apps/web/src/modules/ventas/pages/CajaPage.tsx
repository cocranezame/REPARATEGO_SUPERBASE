import { zodResolver } from "@hookform/resolvers/zod";
import type { AbrirCajaInput, CerrarCajaInput } from "@kallpasoft/validators";
import { abrirCajaSchema, cerrarCajaSchema } from "@kallpasoft/validators";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAbrirCaja, useCajaActual, useCerrarCaja, useResumenCaja } from "../hooks/useVentas";

export function CajaPage() {
  const { data: cajaRes, isLoading } = useCajaActual();
  const caja = cajaRes?.data ?? null;

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Cargando caja...</div>;
  }

  if (!caja) {
    return <AperturaCajaForm />;
  }

  return <ResumenCajaView cajaId={caja.id} />;
}

function AperturaCajaForm() {
  const { mutate, isPending, error } = useAbrirCaja();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AbrirCajaInput>({
    resolver: zodResolver(abrirCajaSchema),
    defaultValues: { monto_apertura: 0 },
  });

  function onSubmit(data: AbrirCajaInput) {
    mutate(data);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Abrir Caja</h1>
        <p className="text-sm text-neutral-500">
          No tienes una caja abierta. Apertura tu caja para comenzar a vender.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="sucursal_id" className="mb-1 block text-sm font-medium text-neutral-700">
            Sucursal ID
          </label>
          <input
            id="sucursal_id"
            {...register("sucursal_id")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="UUID de la sucursal"
          />
          {errors.sucursal_id && (
            <p className="mt-1 text-xs text-red-600">{errors.sucursal_id.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="monto_apertura"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Monto de apertura (S/.)
          </label>
          <input
            id="monto_apertura"
            type="number"
            step="0.01"
            min="0"
            {...register("monto_apertura", { valueAsNumber: true })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
          {errors.monto_apertura && (
            <p className="mt-1 text-xs text-red-600">{errors.monto_apertura.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}

function ResumenCajaView({ cajaId }: { cajaId: string }) {
  const { data: resumenRes } = useResumenCaja(cajaId);
  const resumen = resumenRes?.data;
  const { mutate: cerrar, isPending } = useCerrarCaja();
  const [showCierre, setShowCierre] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CerrarCajaInput>({
    resolver: zodResolver(cerrarCajaSchema),
    defaultValues: { monto_cierre: 0 },
  });

  function onCerrar(data: CerrarCajaInput) {
    cerrar({ id: cajaId, ...data });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Caja Abierta</h1>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          ABIERTA
        </span>
      </div>

      {resumen && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Ventas del día</p>
            <p className="text-2xl font-bold text-neutral-900">{resumen.cantidad_ventas}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Total cobrado</p>
            <p className="text-2xl font-bold text-neutral-900">
              S/ {resumen.total_ventas.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Diferencia</p>
            <p
              className={`text-2xl font-bold ${resumen.diferencia >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              S/ {resumen.diferencia.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {resumen && resumen.total_por_metodo.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Cobrado por método de pago
          </h2>
          <div className="space-y-2">
            {resumen.total_por_metodo.map((m) => (
              <div key={m.metodo} className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{m.metodo}</span>
                <span className="font-medium text-neutral-900">S/ {m.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCierre(true)}
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Cerrar caja
      </button>

      {showCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Cierre de caja</h2>
            <form onSubmit={handleSubmit(onCerrar)} className="space-y-4">
              <div>
                <label
                  htmlFor="monto_cierre"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Monto de cierre (S/.)
                </label>
                <input
                  id="monto_cierre"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("monto_cierre", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                {errors.monto_cierre && (
                  <p className="mt-1 text-xs text-red-600">{errors.monto_cierre.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="notas_cierre"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Notas de cierre
                </label>
                <textarea
                  id="notas_cierre"
                  {...register("notas_cierre")}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCierre(false)}
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Cerrando..." : "Confirmar cierre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
