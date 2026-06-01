import { zodResolver } from "@hookform/resolvers/zod";
import type { AbrirCajaInput, CerrarCajaInput } from "@kallpasoft/validators";
import { abrirCajaSchema } from "@kallpasoft/validators";
import { Printer, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import { useAbrirCaja, useCajaActiva, useCerrarCaja, useReporteCaja } from "../hooks/useVentas";
import type { ResumenCajaDto } from "../types/ventas";

// ─── Reporte imprimible ───────────────────────────────────────────────────────

function imprimirReporte(resumen: ResumenCajaDto) {
  const caja = resumen.caja;
  const diferencia = Number(caja.diferencia ?? 0);
  const difColor = diferencia >= 0 ? "#16a34a" : "#dc2626";
  const difLabel = diferencia >= 0 ? "Sobrante" : "Faltante";

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Reporte Caja</title>
<style>body{font-family:monospace;padding:24px;max-width:400px;margin:0 auto}
h2{text-align:center;font-size:16px}hr{border:1px dashed #ccc}
.row{display:flex;justify-content:space-between;margin:4px 0;font-size:13px}
.total{font-weight:bold;font-size:14px}.diff{color:${difColor};font-weight:bold}</style></head>
<body>
<h2>REPARATEGO</h2>
<h2>REPORTE DE CIERRE DE CAJA</h2><hr/>
<div class="row"><span>Sucursal:</span><span>${caja.sucursal_nombre ?? caja.sucursal_id.slice(0, 8)}</span></div>
<div class="row"><span>Cajero:</span><span>${caja.usuario_nombre ?? ""}</span></div>
<div class="row"><span>Apertura:</span><span>${new Date(caja.fecha_apertura).toLocaleString("es-PE")}</span></div>
${caja.fecha_cierre ? `<div class="row"><span>Cierre:</span><span>${new Date(caja.fecha_cierre).toLocaleString("es-PE")}</span></div>` : ""}
<hr/>
<div class="row"><span>Monto inicial:</span><span>S/ ${Number(caja.monto_inicial).toFixed(2)}</span></div>
<div class="row total"><span>Monto esperado:</span><span>S/ ${Number(caja.monto_esperado ?? 0).toFixed(2)}</span></div>
<div class="row total"><span>Monto físico:</span><span>S/ ${Number(caja.monto_fisico ?? 0).toFixed(2)}</span></div>
<div class="row diff"><span>${difLabel}:</span><span>S/ ${Math.abs(diferencia).toFixed(2)}</span></div>
<hr/>
<div class="row"><span>Ventas realizadas:</span><span>${resumen.cantidad_ventas}</span></div>
<div class="row total"><span>Total cobrado:</span><span>S/ ${Number(resumen.total_ventas).toFixed(2)}</span></div>
<hr/>
${resumen.total_por_metodo.map((m) => `<div class="row"><span>${m.metodo}:</span><span>S/ ${Number(m.total).toFixed(2)}</span></div>`).join("")}
</body></html>`;

  const w = window.open("", "_blank", "width=480,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

// ─── Modal cierre ─────────────────────────────────────────────────────────────

type CierreCajaFormValues = { monto_fisico: number };

function ModalCierre({
  cajaId,
  montoEsperado,
  onClose,
}: {
  cajaId: string;
  montoEsperado: number;
  onClose: () => void;
}) {
  const { mutate: cerrar, isPending } = useCerrarCaja();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CierreCajaFormValues>({
    defaultValues: { monto_fisico: 0 },
  });

  const watchedFisico = watch("monto_fisico");

  function onSubmit(data: CierreCajaFormValues) {
    setError(null);
    const payload: CerrarCajaInput = { caja_id: cajaId, monto_fisico: data.monto_fisico };
    cerrar(payload, {
      onSuccess: onClose,
      onError: (err) => setError(err.message),
    });
  }

  const diff = (watchedFisico || 0) - montoEsperado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Cerrar caja</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-4">
            <div className="rounded-lg bg-neutral-50 p-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Monto esperado</span>
                <span className="font-semibold text-neutral-900">
                  S/ {montoEsperado.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="monto_fisico" className="text-xs font-medium text-neutral-700">
                Monto físico contado (S/.)
              </label>
              <input
                id="monto_fisico"
                type="number"
                step="0.01"
                min="0"
                {...register("monto_fisico", { valueAsNumber: true })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {errors.monto_fisico && (
                <p className="text-xs text-red-600">{errors.monto_fisico.message}</p>
              )}
            </div>

            <div
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                diff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {diff >= 0 ? "Sobrante" : "Faltante"}: S/ {Math.abs(diff).toFixed(2)}
            </div>

            {error !== null && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Cerrando..." : "Cerrar caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vista caja abierta ───────────────────────────────────────────────────────

function CajaAbiertaView({ cajaId }: { cajaId: string }) {
  const { data: resumenRes, isLoading: loadingResumen } = useReporteCaja(cajaId);
  const [showCierre, setShowCierre] = useState(false);
  const resumen = resumenRes?.data;
  const caja = resumen?.caja;
  const montoEsperado = caja ? Number(caja.monto_esperado ?? 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Caja</h1>
          {caja && (
            <p className="mt-0.5 text-sm text-neutral-500">
              Abierta el {new Date(caja.fecha_apertura).toLocaleString("es-PE")}
            </p>
          )}
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          ABIERTA
        </span>
      </div>

      {loadingResumen ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Monto inicial</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                S/ {Number(caja?.monto_inicial ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Total cobrado</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                S/ {Number(resumen.total_ventas).toFixed(2)}
              </p>
              <p className="text-xs text-neutral-400">{resumen.cantidad_ventas} ventas</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Monto esperado</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                S/ {montoEsperado.toFixed(2)}
              </p>
            </div>
          </div>

          {resumen.total_por_metodo.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Por método de pago</h2>
              <div className="space-y-2">
                {resumen.total_por_metodo.map((m) => (
                  <div key={m.metodo} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{m.metodo}</span>
                    <span className="font-medium text-neutral-900">
                      S/ {Number(m.total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => resumen && imprimirReporte(resumen)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir reporte
            </button>
            <button
              type="button"
              onClick={() => setShowCierre(true)}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Cerrar caja
            </button>
          </div>
        </>
      ) : null}

      {showCierre && (
        <ModalCierre
          cajaId={cajaId}
          montoEsperado={montoEsperado}
          onClose={() => setShowCierre(false)}
        />
      )}
    </div>
  );
}

// ─── Formulario apertura ──────────────────────────────────────────────────────

function AperturaCajaForm() {
  const user = useAuthStore((s) => s.user);
  const { data: sucursalesRes } = useSucursales({ activo: true });
  const sucursales = sucursalesRes?.data ?? [];

  const { mutate: abrir, isPending, error } = useAbrirCaja();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AbrirCajaInput>({
    resolver: zodResolver(abrirCajaSchema),
    defaultValues: {
      sucursal_id: user?.sucursalId ?? "",
      monto_inicial: 0,
    },
  });

  function onSubmit(data: AbrirCajaInput) {
    abrir(data);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Abrir caja</h1>
        <p className="mt-1 text-sm text-neutral-500">
          No tienes una caja abierta. Completa los datos para comenzar a vender.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="sucursal_id" className="text-xs font-medium text-neutral-700">
            Sucursal
          </label>
          <select
            id="sucursal_id"
            {...register("sucursal_id")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          {errors.sucursal_id && (
            <p className="text-xs text-red-600">{errors.sucursal_id.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="monto_inicial" className="text-xs font-medium text-neutral-700">
            Monto inicial de efectivo (S/.)
          </label>
          <input
            id="monto_inicial"
            type="number"
            step="0.01"
            min="0"
            {...register("monto_inicial", { valueAsNumber: true })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.monto_inicial && (
            <p className="text-xs text-red-600">{errors.monto_inicial.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isPending ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CajaPage() {
  const { data: cajaRes, isLoading } = useCajaActiva();
  const caja = cajaRes?.data ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!caja) {
    return <AperturaCajaForm />;
  }

  return <CajaAbiertaView cajaId={caja.id} />;
}
