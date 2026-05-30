import type { ConfirmarOrdenCompraInput } from "@kallpasoft/validators";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useConfirmarOrden, useOrden, useUpdateEstadoOrden } from "../hooks/useOrdenes";
import type { EstadoOrdenCompra, OrdenConfirmacionDto } from "../types/orden";

const ESTADO_COLORS: Record<EstadoOrdenCompra, string> = {
  GENERADA: "bg-blue-100 text-blue-700",
  ENVIADA: "bg-purple-100 text-purple-700",
  TERMINADA: "bg-yellow-100 text-yellow-700",
  INGRESADA: "bg-green-100 text-green-700",
  PENDIENTE_PAGO: "bg-red-100 text-red-700",
};

const NEXT_ESTADO: Partial<Record<EstadoOrdenCompra, EstadoOrdenCompra>> = {
  GENERADA: "ENVIADA",
  ENVIADA: "TERMINADA",
  TERMINADA: "INGRESADA",
  INGRESADA: "PENDIENTE_PAGO",
};

const NEXT_LABEL: Partial<Record<EstadoOrdenCompra, string>> = {
  GENERADA: "Marcar enviada",
  ENVIADA: "Marcar terminada",
  TERMINADA: "Confirmar recepción",
  INGRESADA: "Marcar pend. pago",
};

function EstadoBadge({ estado }: { estado: EstadoOrdenCompra }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {estado.replace("_", " ")}
    </span>
  );
}

// ─── Modal Confirmación ───────────────────────────────────────────────────────

type ConfirmState = {
  cantidad_recibida: number;
  precio_unitario: number;
  conforme: boolean;
  notas: string;
};

function ConfirmarModal({
  ordenId,
  confirmaciones,
  onClose,
}: {
  ordenId: string;
  confirmaciones: OrdenConfirmacionDto[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [states, setStates] = useState<Record<string, ConfirmState>>(() => {
    const init: Record<string, ConfirmState> = {};
    for (const conf of confirmaciones) {
      init[conf.producto_id] = {
        cantidad_recibida: conf.cantidad_ordenada,
        precio_unitario: Number(conf.precio_unitario),
        conforme: true,
        notas: "",
      };
    }
    return init;
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const confirmarMutation = useConfirmarOrden();

  function updateState(
    productoId: string,
    field: keyof ConfirmState,
    value: string | number | boolean
  ) {
    setStates((prev) => {
      const current = prev[productoId];
      if (!current) return prev;
      return { ...prev, [productoId]: { ...current, [field]: value } };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const items: ConfirmarOrdenCompraInput["items"] = confirmaciones.map((conf) => {
      const s = states[conf.producto_id] ?? {
        cantidad_recibida: 0,
        precio_unitario: Number(conf.precio_unitario),
        conforme: false,
        notas: "",
      };
      return {
        producto_id: conf.producto_id,
        cantidad_recibida: s.cantidad_recibida,
        precio_unitario: s.precio_unitario,
        conforme: s.conforme,
        ...(s.notas ? { notas: s.notas } : {}),
      };
    });

    confirmarMutation.mutate(
      { id: ordenId, items },
      {
        onSuccess: () => {
          onClose();
          navigate("/compras/ordenes");
        },
        onError: (err) => setServerError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Confirmar recepción</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
            <p className="text-xs text-neutral-500">
              Ingresa las cantidades recibidas y confirma si cada item está conforme.
            </p>

            {confirmaciones.map((conf) => {
              const s = states[conf.producto_id];
              if (!s) return null;
              return (
                <div
                  key={conf.producto_id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2"
                >
                  <p className="text-sm font-medium text-neutral-900">
                    {conf.producto_nombre ?? conf.producto_id}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`ord-${conf.producto_id}`}
                        className="text-xs text-neutral-500"
                      >
                        Ordenado
                      </label>
                      <input
                        id={`ord-${conf.producto_id}`}
                        type="number"
                        readOnly
                        value={conf.cantidad_ordenada}
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`rec-${conf.producto_id}`}
                        className="text-xs text-neutral-500"
                      >
                        Recibido
                      </label>
                      <input
                        id={`rec-${conf.producto_id}`}
                        type="number"
                        min={0}
                        value={s.cantidad_recibida}
                        onChange={(e) =>
                          updateState(conf.producto_id, "cantidad_recibida", Number(e.target.value))
                        }
                        className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`pu-${conf.producto_id}`}
                        className="text-xs text-neutral-500"
                      >
                        Precio unit.
                      </label>
                      <input
                        id={`pu-${conf.producto_id}`}
                        type="number"
                        min={0}
                        step={0.01}
                        value={s.precio_unitario}
                        onChange={(e) =>
                          updateState(conf.producto_id, "precio_unitario", Number(e.target.value))
                        }
                        className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s.conforme}
                        onChange={(e) =>
                          updateState(conf.producto_id, "conforme", e.target.checked)
                        }
                        className="h-3.5 w-3.5"
                      />
                      Conforme
                    </label>
                    <input
                      type="text"
                      value={s.notas}
                      onChange={(e) => updateState(conf.producto_id, "notas", e.target.value)}
                      placeholder="Notas (opcional)"
                      className="flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}

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
              disabled={confirmarMutation.isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={confirmarMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {confirmarMutation.isPending ? "Confirmando..." : "Confirmar recepción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OrdenDetallePage() {
  const { id } = useParams<{ id: string }>();
  const ordenId = id ?? "";

  const { data, isLoading, isError } = useOrden(ordenId);
  const orden = data?.data;

  const updateEstadoMutation = useUpdateEstadoOrden();
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleNextEstado() {
    if (!orden) return;
    const next = NEXT_ESTADO[orden.estado];
    if (!next) return;

    if (next === "INGRESADA") {
      setShowConfirmar(true);
      return;
    }

    setActionError(null);
    updateEstadoMutation.mutate(
      { id: ordenId, estado: next },
      { onError: (err) => setActionError(err.message) }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !orden) {
    return (
      <div className="py-10 text-center text-sm text-danger-600">
        Orden no encontrada.{" "}
        <Link to="/compras/ordenes" className="text-primary-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  const nextEstado = NEXT_ESTADO[orden.estado];
  const nextLabel = nextEstado ? (NEXT_LABEL[orden.estado] ?? "Avanzar estado") : null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <Link
          to="/compras/ordenes"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Órdenes
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium text-neutral-900">{orden.codigo}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900">{orden.codigo}</h1>
              <EstadoBadge estado={orden.estado} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Proveedor:{" "}
              <span className="font-medium text-neutral-800">{orden.proveedor_nombre ?? "—"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {actionError !== null && <span className="text-xs text-danger-600">{actionError}</span>}
            {nextLabel !== null && (
              <button
                type="button"
                onClick={handleNextEstado}
                disabled={updateEstadoMutation.isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {updateEstadoMutation.isPending ? "Actualizando..." : nextLabel}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500">Emisión</p>
            <p className="font-medium">{orden.fecha_emision}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Entrega estimada</p>
            <p className="font-medium">{orden.fecha_entrega_estimada ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Subtotal</p>
            <p className="font-medium">S/ {Number(orden.subtotal).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">IGV (18%)</p>
            <p className="font-medium">S/ {Number(orden.igv).toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2">
          <span className="text-sm font-semibold text-neutral-700">Total</span>
          <span className="text-lg font-bold text-neutral-900">
            S/ {Number(orden.total).toFixed(2)}
          </span>
        </div>

        {orden.notas && (
          <p className="mt-3 text-xs text-neutral-500">
            Notas: <span className="text-neutral-700">{orden.notas}</span>
          </p>
        )}
      </div>

      {/* Items / confirmaciones */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                  Ordenado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                  Recibido
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">
                  Precio unit.
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                  Conforme
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 md:table-cell">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(orden.confirmaciones ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Sin items registrados.
                  </td>
                </tr>
              )}
              {(orden.confirmaciones ?? []).map((conf: OrdenConfirmacionDto) => (
                <tr key={conf.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {conf.producto_nombre ?? conf.producto_id}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">
                    {conf.cantidad_ordenada}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">
                    {conf.cantidad_recibida}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">
                    S/ {Number(conf.precio_unitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {conf.conforme === null ? (
                      <span className="text-neutral-400">—</span>
                    ) : conf.conforme ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-danger-500" />
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                    {conf.notas ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmar && orden.confirmaciones && (
        <ConfirmarModal
          ordenId={ordenId}
          confirmaciones={orden.confirmaciones}
          onClose={() => setShowConfirmar(false)}
        />
      )}
    </div>
  );
}
