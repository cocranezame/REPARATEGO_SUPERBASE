import { Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  useAsignarSku,
  useCambiarEstado,
  useEliminarSku,
  useSkus,
} from "../hooks/useOrdenesServicio";
import type { OrdenServicioDetalle } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

type Props = { orden: OrdenServicioDetalle; onClose: () => void };

export function ModalAgregarSku({ orden, onClose }: Props) {
  const [loteId, setLoteId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: skusData } = useSkus(orden.id);
  const skus = skusData?.data ?? [];

  const asignar = useAsignarSku();
  const eliminar = useEliminarSku();
  const cambiarEstado = useCambiarEstado();

  const repuestoItems = orden.cotizacion.items.filter((i) => i.tipo_item === "REPUESTO");

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault();
    if (!loteId || !productoId || !precio) {
      setError("Lote, producto y precio son obligatorios");
      return;
    }
    setError(null);
    try {
      await asignar.mutateAsync({
        ordenId: orden.id,
        lote_id: loteId,
        producto_id: productoId,
        cantidad: Math.max(1, parseInt(cantidad, 10) || 1),
        precio_presupuesto: parseFloat(precio),
      });
      setLoteId("");
      setProductoId("");
      setCantidad("1");
      setPrecio("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleEliminar(skuId: string) {
    try {
      await eliminar.mutateAsync({ ordenId: orden.id, skuId });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleContinuar(estado: "PRIORIDAD" | "REPARADO") {
    setError(null);
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const isPending = cambiarEstado.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Agregar SKU — {orden.codigo}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {orden.cliente_nombre ?? "—"} · {orden.producto_nombre ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Repuestos de cotización */}
          {repuestoItems.length > 0 && (
            <div className="rounded-lg border border-neutral-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-neutral-800">Repuestos en cotización</h3>
              <div className="space-y-1">
                {repuestoItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-neutral-800">
                      {item.producto_nombre ?? "Repuesto"}
                    </span>
                    <div className="flex gap-3 text-neutral-500">
                      <span>Cant: {item.cantidad}</span>
                      <span>S/ {Number(item.precio_unitario).toFixed(2)}</span>
                      {item.producto_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductoId(item.producto_id ?? "");
                            setPrecio(Number(item.precio_unitario).toFixed(2));
                            setCantidad(String(item.cantidad));
                          }}
                          className="text-primary-600 hover:underline"
                        >
                          Usar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de asignación */}
          <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">Asignar SKU / Lote</h3>
            <form onSubmit={handleAsignar} className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="sku-lote" className="text-xs font-medium text-neutral-700">
                  ID de Lote <span className="text-red-500">*</span>
                </label>
                <input
                  id="sku-lote"
                  type="text"
                  value={loteId}
                  onChange={(e) => setLoteId(e.target.value)}
                  placeholder="LOT-00001"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sku-producto" className="text-xs font-medium text-neutral-700">
                  ID de Producto <span className="text-red-500">*</span>
                </label>
                <input
                  id="sku-producto"
                  type="text"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  placeholder="UUID del producto"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sku-cantidad" className="text-xs font-medium text-neutral-700">
                  Cantidad
                </label>
                <input
                  id="sku-cantidad"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  min="1"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sku-precio" className="text-xs font-medium text-neutral-700">
                  Precio presupuesto <span className="text-red-500">*</span>
                </label>
                <input
                  id="sku-precio"
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={INPUT}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={asignar.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {asignar.isPending ? "Asignando..." : "Asignar SKU"}
                </button>
              </div>
            </form>
          </div>

          {/* SKUs asignados */}
          {skus.length > 0 && (
            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-neutral-800">SKUs asignados</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5">Lote</th>
                    <th className="px-4 py-2.5 text-right">Cant</th>
                    <th className="px-4 py-2.5 text-right">Precio</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {skus.map((sku) => (
                    <tr key={sku.id}>
                      <td className="px-4 py-2 text-neutral-800">
                        {sku.producto_nombre ?? sku.producto_id}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                        {sku.lote_id}
                      </td>
                      <td className="px-4 py-2 text-right">{sku.cantidad}</td>
                      <td className="px-4 py-2 text-right text-neutral-700">
                        S/ {Number(sku.precio_presupuesto).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleEliminar(sku.id)}
                          disabled={eliminar.isPending}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error !== null && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleContinuar("PRIORIDAD")}
              className="rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-60"
            >
              → Prioridad (espera repuesto)
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleContinuar("REPARADO")}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isPending ? "..." : "→ Reparado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
