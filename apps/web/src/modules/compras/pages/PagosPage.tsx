import type { CreatePagoProveedorInput } from "@kallpasoft/validators";
import { CreditCard, X } from "lucide-react";
import { useState } from "react";
import { useOrdenes } from "../hooks/useOrdenes";
import { useCreatePago } from "../hooks/usePagos";
import type { OrdenDto } from "../types/orden";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Modal de pago ────────────────────────────────────────────────────────────

function PagoModal({ orden, onClose }: { orden: OrdenDto; onClose: () => void }) {
  const [monto, setMonto] = useState(Number(orden.total).toFixed(2));
  const [metodoPago, setMetodoPago] = useState<"TRANSFERENCIA" | "EFECTIVO" | "CHEQUE">(
    "TRANSFERENCIA"
  );
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = useCreatePago();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setServerError("Ingresa un monto válido");
      return;
    }

    const body: CreatePagoProveedorInput = {
      orden_compra_id: orden.id,
      monto: montoNum,
      metodo_pago: metodoPago,
      fecha_pago: fechaPago,
      ...(referencia ? { referencia } : {}),
      ...(comprobante ? { comprobante_url: comprobante } : {}),
      ...(notas ? { notas } : {}),
    };

    createMutation.mutate(body, {
      onSuccess: onClose,
      onError: (err) => setServerError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Registrar pago</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {orden.codigo} — {orden.proveedor_nombre ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            {/* Monto */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-monto" className="text-xs font-medium text-neutral-700">
                Monto (S/)
              </label>
              <input
                id="pago-monto"
                type="number"
                min={0.01}
                step={0.01}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={INPUT}
                required
              />
              <p className="text-xs text-neutral-400">
                Total OC: S/ {Number(orden.total).toFixed(2)}
              </p>
            </div>

            {/* Método de pago */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-metodo" className="text-xs font-medium text-neutral-700">
                Método de pago
              </label>
              <select
                id="pago-metodo"
                value={metodoPago}
                onChange={(e) =>
                  setMetodoPago(e.target.value as "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE")
                }
                className={SELECT}
              >
                <option value="TRANSFERENCIA">Transferencia bancaria</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            {/* Referencia */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-referencia" className="text-xs font-medium text-neutral-700">
                N° operación / referencia{" "}
                <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="pago-referencia"
                type="text"
                maxLength={100}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: 123456789"
                className={INPUT}
              />
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-fecha" className="text-xs font-medium text-neutral-700">
                Fecha de pago
              </label>
              <input
                id="pago-fecha"
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className={INPUT}
                required
              />
            </div>

            {/* Comprobante URL */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-comprobante" className="text-xs font-medium text-neutral-700">
                URL comprobante{" "}
                <span className="font-normal text-neutral-400">
                  (opcional, upload S3 en deploy)
                </span>
              </label>
              <input
                id="pago-comprobante"
                type="url"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="https://..."
                className={INPUT}
              />
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1">
              <label htmlFor="pago-notas" className="text-xs font-medium text-neutral-700">
                Notas <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="pago-notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones"
                className={INPUT}
              />
            </div>

            {serverError !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
                {serverError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {createMutation.isPending ? "Registrando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PagosPage() {
  const { data, isLoading, isError } = useOrdenes({ estado: "PENDIENTE_PAGO", pageSize: 100 });
  const ordenes = data?.data ?? [];
  const [pagoOrden, setPagoOrden] = useState<OrdenDto | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Pagos a proveedores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Órdenes de compra pendientes de pago</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar las órdenes.</p>
      )}

      {!isLoading && !isError && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Código OC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Fecha emisión
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ordenes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-neutral-400">
                      No hay órdenes pendientes de pago.
                    </td>
                  </tr>
                )}
                {ordenes.map((orden) => (
                  <tr key={orden.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-800">
                      {orden.codigo}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{orden.proveedor_nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">
                      S/ {Number(orden.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{orden.fecha_emision}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPagoOrden(orden)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagoOrden !== null && <PagoModal orden={pagoOrden} onClose={() => setPagoOrden(null)} />}
    </div>
  );
}
