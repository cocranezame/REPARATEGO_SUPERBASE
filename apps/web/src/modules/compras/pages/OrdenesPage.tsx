import type { GenerarOrdenCompraInput } from "@kallpasoft/validators";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProductos } from "../../inventario/hooks/useInventario";
import { useProveedores } from "../../proveedores/hooks/useProveedores";
import { useGenerarOrden, useOrdenes } from "../hooks/useOrdenes";
import { useSolicitudes } from "../hooks/useSolicitudes";
import type { EstadoOrdenCompra, OrdenDto } from "../types/orden";

const COLUMNAS: { estado: EstadoOrdenCompra; label: string; color: string }[] = [
  { estado: "GENERADA", label: "Generada", color: "border-blue-300 bg-blue-50" },
  { estado: "ENVIADA", label: "Enviada", color: "border-purple-300 bg-purple-50" },
  { estado: "TERMINADA", label: "Terminada", color: "border-yellow-300 bg-yellow-50" },
  { estado: "INGRESADA", label: "Ingresada", color: "border-green-300 bg-green-50" },
  { estado: "PENDIENTE_PAGO", label: "Pend. Pago", color: "border-red-300 bg-red-50" },
];

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Modal Generar OC ─────────────────────────────────────────────────────────

type ItemRow = { key: string; producto_id: string; cantidad: number; precio_unitario: number };

function GenerarOcModal({ onClose }: { onClose: () => void }) {
  const [proveedorId, setProveedorId] = useState("");
  const [selectedSolicitudes, setSelectedSolicitudes] = useState<string[]>([]);
  const nextKey = useRef(2);
  const [items, setItems] = useState<ItemRow[]>([
    { key: "1", producto_id: "", cantidad: 1, precio_unitario: 0 },
  ]);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: proveedoresData } = useProveedores({ activo: true, pageSize: 200 });
  const { data: productosData } = useProductos({ activo: true, pageSize: 200 });
  const { data: solicitudesData } = useSolicitudes({ estado: "PENDIENTE", pageSize: 100 });

  const generarMutation = useGenerarOrden();

  function addItem() {
    const k = String(nextKey.current++);
    setItems((prev) => [...prev, { key: k, producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  }

  function removeItem(k: string) {
    setItems((prev) => prev.filter((it) => it.key !== k));
  }

  function updateItem(k: string, field: keyof Omit<ItemRow, "key">, value: string | number) {
    setItems((prev) => prev.map((it) => (it.key === k ? { ...it, [field]: value } : it)));
  }

  function toggleSolicitud(id: string) {
    setSelectedSolicitudes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!proveedorId) {
      setServerError("Selecciona un proveedor");
      return;
    }

    const filteredItems = items.filter(
      (it) => it.producto_id && it.cantidad > 0 && it.precio_unitario > 0
    );
    if (filteredItems.length === 0) {
      setServerError("Agrega al menos un producto con precio");
      return;
    }

    const body: GenerarOrdenCompraInput = {
      proveedor_id: proveedorId,
      solicitud_ids: selectedSolicitudes,
      items: filteredItems.map(({ producto_id, cantidad, precio_unitario }) => ({
        producto_id,
        cantidad,
        precio_unitario,
      })),
      ...(fechaEntrega ? { fecha_entrega_estimada: fechaEntrega } : {}),
      ...(notas ? { notas } : {}),
    };

    generarMutation.mutate(body, {
      onSuccess: onClose,
      onError: (err) => setServerError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Generar orden de compra</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
            {/* Proveedor */}
            <div className="flex flex-col gap-1">
              <label htmlFor="oc-proveedor" className="text-xs font-medium text-neutral-700">
                Proveedor
              </label>
              <select
                id="oc-proveedor"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className={SELECT}
              >
                <option value="">Seleccionar...</option>
                {proveedoresData?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
            </div>

            {/* Solicitudes PENDIENTE */}
            {(solicitudesData?.data.length ?? 0) > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-neutral-700">
                  Asociar solicitudes pendientes{" "}
                  <span className="font-normal text-neutral-400">(opcional)</span>
                </span>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-1">
                  {solicitudesData?.data.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSolicitudes.includes(s.id)}
                        onChange={() => toggleSolicitud(s.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span>
                        {s.producto_nombre ?? s.producto_id} — {s.cantidad_solicitada} uds
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">Productos a ordenar</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="grid grid-cols-[1fr_80px_100px_auto] items-center gap-2"
                  >
                    <select
                      value={item.producto_id}
                      onChange={(e) => updateItem(item.key, "producto_id", e.target.value)}
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Producto...</option>
                      {productosData?.data.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.key, "cantidad", Number(e.target.value))}
                      className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.precio_unitario}
                      onChange={(e) =>
                        updateItem(item.key, "precio_unitario", Number(e.target.value))
                      }
                      className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="Precio"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fecha entrega + Notas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="oc-fecha-entrega" className="text-xs font-medium text-neutral-700">
                  Fecha entrega estimada{" "}
                  <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="oc-fecha-entrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="oc-notas" className="text-xs font-medium text-neutral-700">
                  Notas <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="oc-notas"
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones"
                  className={INPUT}
                />
              </div>
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
              disabled={generarMutation.isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={generarMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {generarMutation.isPending ? "Generando..." : "Generar OC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({ orden }: { orden: OrdenDto }) {
  return (
    <Link
      to={`/compras/ordenes/${orden.id}`}
      className="block rounded-lg border border-neutral-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-neutral-800">{orden.codigo}</span>
        <span className="text-xs font-medium text-neutral-500">
          S/ {Number(orden.total).toFixed(2)}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-neutral-600">{orden.proveedor_nombre ?? "—"}</p>
      <p className="mt-1 text-xs text-neutral-400">{orden.fecha_emision}</p>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OrdenesPage() {
  const [showGenerar, setShowGenerar] = useState(false);

  const { data, isLoading, isError } = useOrdenes({ pageSize: 200 });
  const ordenes = data?.data ?? [];

  const byEstado = (estado: EstadoOrdenCompra): OrdenDto[] =>
    ordenes.filter((o) => o.estado === estado);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Órdenes de compra</h1>
        <button
          type="button"
          onClick={() => setShowGenerar(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Generar OC
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-danger-600">Error al cargar órdenes.</p>
      )}

      {!isLoading && !isError && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map(({ estado, label, color }) => {
            const items = byEstado(estado);
            return (
              <div
                key={estado}
                className={`flex w-56 shrink-0 flex-col rounded-xl border-2 ${color}`}
              >
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    {label}
                  </span>
                  <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-semibold text-neutral-700">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto p-2">
                  {items.length === 0 && (
                    <p className="py-4 text-center text-xs text-neutral-400">Vacío</p>
                  )}
                  {items.map((orden) => (
                    <KanbanCard key={orden.id} orden={orden} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showGenerar && <GenerarOcModal onClose={() => setShowGenerar(false)} />}
    </div>
  );
}
