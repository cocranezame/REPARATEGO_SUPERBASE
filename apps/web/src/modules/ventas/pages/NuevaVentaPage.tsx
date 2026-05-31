import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddVentaPago, useCajaActual, useCreateVenta } from "../hooks/useVentas";

type ItemCarrito = {
  _key: number;
  producto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
};

let _itemCounter = 0;

type MetodoPago = {
  metodo_pago_id: string;
  metodo_nombre: string;
  monto: number;
  referencia?: string;
};

export function NuevaVentaPage() {
  const navigate = useNavigate();
  const { data: cajaRes } = useCajaActual();
  const caja = cajaRes?.data ?? null;
  const { mutateAsync: crearVenta, isPending: creando } = useCreateVenta();
  const { mutateAsync: addPago } = useAddVentaPago();

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [montoPago, setMontoPago] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ventaCreadaId, setVentaCreadaId] = useState<string | null>(null);

  const subtotal = items.reduce(
    (acc, it) => acc + it.cantidad * it.precio_unitario - it.descuento,
    0
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  const totalPagado = metodosPago.reduce((acc, m) => acc + m.monto, 0);
  const cambio = totalPagado - total;

  function addItem() {
    if (!descripcion.trim() || !precio || Number(precio) <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        _key: ++_itemCounter,
        descripcion: descripcion.trim(),
        cantidad,
        precio_unitario: Number(precio),
        descuento: 0,
      },
    ]);
    setDescripcion("");
    setPrecio("");
    setCantidad(1);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeQty(idx: number, delta: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, cantidad: Math.max(1, it.cantidad + delta) } : it))
    );
  }

  function addMetodoPago() {
    if (!metodoPagoId || !montoPago || Number(montoPago) <= 0) return;
    setMetodosPago((prev) => [
      ...prev,
      {
        metodo_pago_id: metodoPagoId,
        metodo_nombre: metodoPagoId,
        monto: Number(montoPago),
        ...(referencia ? { referencia } : {}),
      },
    ]);
    setMontoPago("");
    setReferencia("");
  }

  async function handleCobrar() {
    if (!caja) {
      setError("No tienes caja abierta. Abre tu caja primero.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }
    setError(null);
    try {
      const venta = await crearVenta({
        caja_id: caja.id,
        items: items.map((it) => ({
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          ...(it.producto_id ? { producto_id: it.producto_id } : {}),
          ...(it.descuento > 0 ? { descuento: it.descuento } : {}),
        })),
      });

      for (const mp of metodosPago) {
        await addPago({
          ventaId: venta.data.id,
          metodo_pago_id: mp.metodo_pago_id,
          monto: mp.monto,
          ...(mp.referencia ? { referencia: mp.referencia } : {}),
        });
      }

      setVentaCreadaId(venta.data.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (ventaCreadaId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ShoppingCart className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">¡Venta registrada!</h2>
        <p className="text-sm text-neutral-500">ID: {ventaCreadaId}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/ventas/historial")}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Ver historial
          </button>
          <button
            type="button"
            onClick={() => {
              setItems([]);
              setMetodosPago([]);
              setVentaCreadaId(null);
            }}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Nueva venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Izquierda: agregar productos */}
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-xl font-bold text-neutral-900">Punto de venta</h1>

        {!caja && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            No tienes caja abierta. Ve a{" "}
            <a href="/ventas/caja" className="underline">
              Caja
            </a>{" "}
            para abrirla.
          </div>
        )}

        {/* Agregar item */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Agregar producto / servicio
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Precio unit."
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Cant."
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              min="1"
            />
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="flex-1 overflow-auto rounded-xl border border-neutral-200 bg-white">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <ShoppingCart className="mb-2 h-8 w-8" />
              <p className="text-sm">No hay productos</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Precio</th>
                  <th className="px-4 py-3 text-center font-medium text-neutral-600">Cant.</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Subtotal</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it._key} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-neutral-900">{it.descripcion}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">
                      S/ {it.precio_unitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQty(idx, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center">{it.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(idx, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">
                      S/ {(it.cantidad * it.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Derecha: resumen y cobro */}
      <div className="flex w-80 flex-col gap-4">
        {/* Totales */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>IGV (18%)</span>
              <span>S/ {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
              <span>Total</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pagos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Métodos de pago</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ID método de pago"
              value={metodoPagoId}
              onChange={(e) => setMetodoPagoId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Monto"
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              min="0"
              step="0.01"
            />
            <input
              type="text"
              placeholder="Referencia (opcional)"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addMetodoPago}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              + Agregar pago
            </button>
          </div>

          {metodosPago.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
              {metodosPago.map((mp, i) => (
                <div key={mp.metodo_pago_id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">{mp.metodo_nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">S/ {mp.monto.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setMetodosPago((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-100 pt-1 text-sm font-medium">
                <span>Pagado</span>
                <span>S/ {totalPagado.toFixed(2)}</span>
              </div>
              {cambio >= 0 && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Cambio</span>
                  <span>S/ {cambio.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCobrar}
          disabled={creando || items.length === 0}
          className="rounded-xl bg-primary-600 px-4 py-3 text-base font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {creando ? "Procesando..." : `Cobrar S/ ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
