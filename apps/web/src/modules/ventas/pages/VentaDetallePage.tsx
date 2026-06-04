import { ArrowLeft, ExternalLink, Printer, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useMetodosPago } from "../../inventario/hooks/useInventario";
import { imprimirVoucherDetalle } from "../components/VoucherPrint";
import { useAnularVenta, useDespachar, useRegistrarPago, useVenta } from "../hooks/useVentas";
import type { VentaDetalleDto } from "../types/ventas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(n: number | string) {
  return `S/ ${Number(n).toFixed(2)}`;
}

const PAGO_BADGE: Record<string, string> = {
  PAGO_PENDIENTE: "bg-amber-100 text-amber-700",
  COMPLETADA: "bg-green-100 text-green-700",
  ANULADA: "bg-red-100 text-red-700",
};

const DESPACHO_BADGE: Record<string, string> = {
  SIN_ENVIO: "bg-neutral-100 text-neutral-600",
  ENVIO_PENDIENTE: "bg-blue-100 text-blue-700",
  DESPACHADO: "bg-green-100 text-green-700",
};

// ─── Modal anulación ──────────────────────────────────────────────────────────

function ModalAnular({
  ventaId,
  venta,
  onClose,
  onSuccess,
}: {
  ventaId: string;
  venta: VentaDetalleDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutate: anular, isPending } = useAnularVenta();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tienePagosParciales =
    Number(venta.total) > 0 && venta.pagos.length > 0 && venta.estado_pago !== "COMPLETADA";

  function handleConfirmar() {
    if (!motivo.trim()) {
      setError("El motivo de anulación es obligatorio.");
      return;
    }
    setError(null);
    anular(
      { ventaId, motivo },
      {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
        onError: (err) => setError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Anular venta</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm">
            <p>
              Venta <span className="font-mono font-semibold">{venta.codigo}</span> —{" "}
              {fmtPEN(venta.total)}
            </p>
          </div>

          {tienePagosParciales && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Esta venta tiene pagos parciales registrados. Al anular se generará una{" "}
              <strong>nota de crédito</strong> por el monto abonado como saldo a favor del cliente
              (PV2 — V28).
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="motivo-anular" className="text-xs font-medium text-neutral-700">
              Motivo de anulación *
            </label>
            <textarea
              id="motivo-anular"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
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
            type="button"
            onClick={handleConfirmar}
            disabled={isPending || !motivo.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Anulando..." : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal pago rápido ────────────────────────────────────────────────────────

function ModalPagoRapido({
  ventaId,
  saldoPendiente,
  onClose,
  onSuccess,
}: {
  ventaId: string;
  saldoPendiente: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: metodosRes } = useMetodosPago(true);
  const metodos = metodosRes?.data ?? [];
  const { mutate: registrar, isPending } = useRegistrarPago();
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [monto, setMonto] = useState(String(saldoPendiente.toFixed(2)));
  const [error, setError] = useState<string | null>(null);

  function handleRegistrar() {
    if (!metodoPagoId || !monto || Number(monto) <= 0) {
      setError("Selecciona método y monto.");
      return;
    }
    setError(null);
    registrar(
      { ventaId, metodo_pago_id: metodoPagoId, monto: Number(monto) },
      {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
        onError: (err) => setError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Registrar pago</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-4">
          <p className="text-sm text-neutral-600">
            Saldo pendiente:{" "}
            <span className="font-semibold text-amber-700">{fmtPEN(saldoPendiente)}</span>
          </p>
          <select
            value={metodoPagoId}
            onChange={(e) => setMetodoPagoId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Método de pago *</option>
            {metodos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
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
            type="button"
            onClick={handleRegistrar}
            disabled={isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isPending ? "Registrando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VentaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const puedeAnular = user?.rol === "ADMIN" || user?.rol === "ASISTENTE";

  const { data, isLoading, isError, refetch } = useVenta(id ?? "");
  const venta = data?.data ?? null;
  const { mutate: despachar, isPending: despachando } = useDespachar();

  const [showAnular, setShowAnular] = useState(false);
  const [showPago, setShowPago] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !venta) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <p className="text-sm text-red-600">Venta no encontrada o sin acceso.</p>
      </div>
    );
  }

  const saldoPendiente = Number(venta.saldo_pendiente);
  const totalPagado = Number(venta.total) - saldoPendiente;
  const porcentajePagado = venta.porcentaje_pagado ?? 0;

  function printVoucher() {
    if (venta) imprimirVoucherDetalle(venta);
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-xl font-semibold text-neutral-900">{venta.codigo}</h1>
        <button
          type="button"
          onClick={printVoucher}
          className="ml-auto flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          <Printer className="h-4 w-4" />
          Voucher
        </button>
      </div>

      {/* Sección 1: Información general */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
            Información
          </h2>
          {puedeAnular && venta.estado_pago !== "ANULADA" && (
            <button
              type="button"
              onClick={() => setShowAnular(true)}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Anular venta
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-neutral-500">Cliente</p>
            <p className="font-medium text-neutral-900">{venta.cliente_nombre ?? "Sin cliente"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Vendedor</p>
            <p className="font-medium text-neutral-900">{venta.vendedor_nombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Fecha</p>
            <p className="font-medium text-neutral-900">
              {new Date(venta.created_at).toLocaleString("es-PE")}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Tipo</p>
            <p className="font-medium text-neutral-900">{venta.tipo_venta}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Estado pago</p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PAGO_BADGE[venta.estado_pago] ?? "bg-neutral-100"}`}
            >
              {venta.estado_pago}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Estado despacho</p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DESPACHO_BADGE[venta.estado_despacho] ?? "bg-neutral-100"}`}
            >
              {venta.estado_despacho}
            </span>
          </div>
          {venta.orden_servicio_id && (
            <div className="col-span-2">
              <p className="text-xs text-neutral-500">Servicio asociado</p>
              <button
                type="button"
                onClick={() => navigate(`/servicios/${venta.orden_servicio_id}`)}
                className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
              >
                {venta.orden_servicio_id.slice(0, 8)}…{" "}
                {venta.servicio_asociado?.estado && (
                  <span className="text-xs">({venta.servicio_asociado.estado})</span>
                )}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">Item</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-neutral-600">
                  Cant.
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600">
                  Precio
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it) => (
                <tr key={it.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    <p className="font-medium text-neutral-900">{it.descripcion}</p>
                    {it.sku && <p className="text-xs text-neutral-400">SKU: {it.sku}</p>}
                  </td>
                  <td className="px-3 py-2 text-center text-neutral-600">{it.cantidad}</td>
                  <td className="px-3 py-2 text-right text-neutral-600">
                    {fmtPEN(it.precio_unitario)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-neutral-900">
                    {fmtPEN(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-200 bg-neutral-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-neutral-900">
                  TOTAL
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold text-neutral-900">
                  {fmtPEN(venta.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sección 2: Progreso del cobro */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Progreso del cobro
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Pagado: {fmtPEN(totalPagado)} / {fmtPEN(venta.total)}
            </span>
            <span className="font-semibold text-neutral-900">{porcentajePagado.toFixed(0)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(100, porcentajePagado)}%` }}
            />
          </div>
          {saldoPendiente > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-amber-700">
                Saldo pendiente: {fmtPEN(saldoPendiente)}
              </span>
              {venta.estado_pago !== "ANULADA" && (
                <button
                  type="button"
                  onClick={() => setShowPago(true)}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  Registrar pago
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sección 3: Pagos registrados */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Pagos registrados
        </h2>
        {venta.pagos.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin pagos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className="pb-2 text-left text-xs font-medium text-neutral-600">Fecha</th>
                <th className="pb-2 text-left text-xs font-medium text-neutral-600">Método</th>
                <th className="pb-2 text-right text-xs font-medium text-neutral-600">Monto</th>
              </tr>
            </thead>
            <tbody>
              {venta.pagos.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-600">
                    {new Date(p.fecha_pago).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 text-neutral-700">{p.metodo_nombre ?? "—"}</td>
                  <td className="py-2 text-right font-medium text-neutral-900">
                    {fmtPEN(p.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Nota de crédito si anulada con pagos parciales */}
        {venta.estado_pago === "ANULADA" &&
          venta.nota_credito_monto &&
          Number(venta.nota_credito_monto) > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <p className="font-semibold text-amber-800">Nota de crédito</p>
              <p className="text-amber-700">
                Saldo a favor del cliente: {fmtPEN(venta.nota_credito_monto)} (PV2)
              </p>
            </div>
          )}
      </div>

      {/* Sección 4: Envío */}
      {venta.estado_despacho !== "SIN_ENVIO" && venta.envio && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-700">
            Envío
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Estado</p>
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  venta.envio.estado === "DESPACHADO"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {venta.envio.estado}
              </span>
            </div>
            {venta.envio.direccion_texto && (
              <div>
                <p className="text-xs text-neutral-500">Dirección</p>
                <p className="font-medium text-neutral-900">{venta.envio.direccion_texto}</p>
              </div>
            )}
            {venta.envio.metodo_envio && (
              <div>
                <p className="text-xs text-neutral-500">Método</p>
                <p className="font-medium text-neutral-900">{venta.envio.metodo_envio}</p>
              </div>
            )}
            {venta.envio.fecha_programada && (
              <div>
                <p className="text-xs text-neutral-500">Fecha programada</p>
                <p className="font-medium text-neutral-900">{venta.envio.fecha_programada}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-neutral-500">Costo</p>
              <p className="font-medium text-neutral-900">{fmtPEN(venta.envio.costo_envio)}</p>
            </div>
          </div>

          {venta.envio.estado !== "DESPACHADO" && venta.estado_pago !== "ANULADA" && (
            <button
              type="button"
              onClick={() => despachar(venta.id, { onSuccess: () => void refetch() })}
              disabled={despachando}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {despachando ? "Marcando..." : "Marcar como despachado"}
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      {showAnular && id && (
        <ModalAnular
          ventaId={id}
          venta={venta}
          onClose={() => setShowAnular(false)}
          onSuccess={() => void refetch()}
        />
      )}

      {showPago && id && (
        <ModalPagoRapido
          ventaId={id}
          saldoPendiente={saldoPendiente}
          onClose={() => setShowPago(false)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
}
