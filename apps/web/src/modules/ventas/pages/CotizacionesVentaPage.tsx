import { Printer, X } from "lucide-react";
import { useState } from "react";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useProductos } from "../../inventario/hooks/useInventario";
import {
  useCotizacionesVenta,
  useCotizacionVenta,
  useCrearCotizacionVenta,
} from "../hooks/useVentas";
import type { CotizacionVentaDetalleDto, CotizacionVentaDto } from "../types/ventas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(n: number | string) {
  return `S/ ${Number(n).toFixed(2)}`;
}

// ─── Imprimir cotización ──────────────────────────────────────────────────────

function imprimirCotizacion(cot: CotizacionVentaDetalleDto) {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Cotización ${cot.codigo}</title>
<style>body{font-family:monospace;padding:24px;max-width:500px;margin:0 auto}
h2{text-align:center;font-size:14px}hr{border:1px dashed #ccc}
.row{display:flex;justify-content:space-between;margin:3px 0;font-size:12px}
.total{font-weight:bold;font-size:14px}.nota{font-size:11px;text-align:center;color:#666;margin-top:12px}</style></head>
<body>
<h2>REPARATEGO</h2><h2>COTIZACIÓN REFERENCIAL</h2><hr/>
<div class="row"><span>Código:</span><span>${cot.codigo}</span></div>
<div class="row"><span>Fecha:</span><span>${new Date(cot.created_at).toLocaleString("es-PE")}</span></div>
${cot.cliente_nombre ? `<div class="row"><span>Cliente:</span><span>${cot.cliente_nombre}</span></div>` : ""}
<hr/>
${cot.items.map((it) => `<div class="row"><span>${it.descripcion} x${it.cantidad}</span><span>S/ ${Number(it.subtotal).toFixed(2)}</span></div>`).join("")}
<hr/>
<div class="row total"><span>TOTAL REFERENCIAL:</span><span>S/ ${Number(cot.total_referencial).toFixed(2)}</span></div>
<p class="nota">Documento referencial. No reserva stock ni genera movimiento de inventario.</p>
</body></html>`;
  const w = window.open("", "_blank", "width=520,height=650");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

// ─── Modal detalle ────────────────────────────────────────────────────────────

function ModalDetalle({ cotizacionId, onClose }: { cotizacionId: string; onClose: () => void }) {
  const { data, isLoading } = useCotizacionVenta(cotizacionId);
  const cot = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Cotización {cot?.codigo ?? "…"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : !cot ? (
            <p className="text-sm text-neutral-500">No encontrada.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-neutral-500">Fecha</p>
                  <p className="font-medium">
                    {new Date(cot.created_at).toLocaleDateString("es-PE")}
                  </p>
                </div>
                {cot.cliente_nombre && (
                  <div>
                    <p className="text-xs text-neutral-500">Cliente</p>
                    <p className="font-medium">{cot.cliente_nombre}</p>
                  </div>
                )}
                {cot.usuario_nombre && (
                  <div>
                    <p className="text-xs text-neutral-500">Creado por</p>
                    <p className="font-medium">{cot.usuario_nombre}</p>
                  </div>
                )}
              </div>

              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200">
                  <tr>
                    <th className="pb-2 text-left text-xs font-medium text-neutral-600">
                      Descripción
                    </th>
                    <th className="pb-2 text-center text-xs font-medium text-neutral-600">Cant.</th>
                    <th className="pb-2 text-right text-xs font-medium text-neutral-600">Precio</th>
                    <th className="pb-2 text-right text-xs font-medium text-neutral-600">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cot.items.map((it) => (
                    <tr key={it.id} className="border-t border-neutral-100">
                      <td className="py-1.5 text-neutral-900">{it.descripcion}</td>
                      <td className="py-1.5 text-center text-neutral-600">{it.cantidad}</td>
                      <td className="py-1.5 text-right text-neutral-600">
                        {fmtPEN(it.precio_unitario)}
                      </td>
                      <td className="py-1.5 text-right font-medium text-neutral-900">
                        {fmtPEN(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-neutral-200 bg-neutral-50">
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-sm font-bold text-neutral-900">
                      TOTAL REFERENCIAL
                    </td>
                    <td className="py-2 text-right text-sm font-bold text-neutral-900">
                      {fmtPEN(cot.total_referencial)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Documento referencial. No reserva stock ni genera movimiento de inventario.
                (V15/PV1)
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
          {cot && (
            <button
              type="button"
              onClick={() => imprimirCotizacion(cot)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear ──────────────────────────────────────────────────────────────

type ItemCot = {
  _key: number;
  produto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

let _cotKey = 0;

function ModalCrear({ onClose }: { onClose: () => void }) {
  const { mutate: crear, isPending } = useCrearCotizacionVenta();
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [clienteNombre, setClienteNombre] = useState("");
  const [items, setItems] = useState<ItemCot[]>([]);
  const [productoSearch, setProductoSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: clientesRes } = useClientes(
    clienteSearch.length >= 2 ? { search: clienteSearch, pageSize: 5 } : {}
  );
  const clientes = clienteSearch.length >= 2 ? (clientesRes?.data ?? []) : [];

  const { data: productosRes } = useProductos(
    productoSearch.length >= 2 ? { search: productoSearch, pageSize: 10 } : {}
  );
  const productos = productoSearch.length >= 2 ? (productosRes?.data ?? []) : [];

  const totalReferencial = items.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);

  function addProducto(p: { id: string; nombre: string; precio_venta: string }) {
    setItems((prev) => [
      ...prev,
      {
        _key: ++_cotKey,
        produto_id: p.id,
        descripcion: p.nombre,
        cantidad: 1,
        precio_unitario: Number(p.precio_venta),
      },
    ]);
    setProductoSearch("");
  }

  function addManual() {
    setItems((prev) => [
      ...prev,
      {
        _key: ++_cotKey,
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0,
      },
    ]);
  }

  function updateItem(key: number, field: keyof Omit<ItemCot, "_key">, value: string | number) {
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, [field]: value } : it)));
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((it) => it._key !== key));
  }

  function handleGuardar() {
    if (items.length === 0) {
      setError("Agrega al menos un item.");
      return;
    }
    const emptyItems = items.some((it) => !it.descripcion.trim() || it.precio_unitario <= 0);
    if (emptyItems) {
      setError("Todos los items necesitan descripción y precio mayor a 0.");
      return;
    }
    setError(null);
    crear(
      {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        items: items.map((it) => ({
          ...(it.produto_id ? { produto_id: it.produto_id } : {}),
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
        })),
      },
      {
        onSuccess: onClose,
        onError: (err) => setError(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Nueva cotización</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
          {/* Cliente opcional */}
          <div className="relative">
            <p className="mb-1 text-xs font-medium text-neutral-700">Cliente (opcional)</p>
            {clienteId ? (
              <div className="flex items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                <span className="text-neutral-900">{clienteNombre}</span>
                <button
                  type="button"
                  onClick={() => {
                    setClienteId(undefined);
                    setClienteNombre("");
                  }}
                >
                  <X className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                {clientes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
                    {clientes.map((c) => {
                      const nombre =
                        c.tipo_persona === "NATURAL"
                          ? `${c.nombres ?? ""} ${c.apellidos ?? ""}`.trim()
                          : (c.razon_social ?? "");
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setClienteId(c.id);
                            setClienteNombre(nombre);
                            setClienteSearch("");
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
                        >
                          <span className="font-mono text-xs text-neutral-500">
                            {c.numero_documento}
                          </span>
                          <span className="text-neutral-900">{nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Buscar productos */}
          <div className="relative">
            <p className="mb-1 text-xs font-medium text-neutral-700">Agregar producto o servicio</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={productoSearch}
                onChange={(e) => setProductoSearch(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addManual}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                + Manual
              </button>
            </div>
            {productos.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
                {productos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProducto(p)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="text-neutral-900">{p.nombre}</span>
                    <span className="text-xs text-neutral-500">{fmtPEN(p.precio_venta)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de items */}
          {items.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">
                      Descripción
                    </th>
                    <th className="w-16 px-3 py-2 text-center text-xs font-medium text-neutral-600">
                      Cant.
                    </th>
                    <th className="w-28 px-3 py-2 text-right text-xs font-medium text-neutral-600">
                      Precio
                    </th>
                    <th className="w-28 px-3 py-2 text-right text-xs font-medium text-neutral-600">
                      Subtotal
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._key} className="border-t border-neutral-100">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => updateItem(it._key, "descripcion", e.target.value)}
                          className="w-full rounded border border-neutral-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={it.cantidad}
                          onChange={(e) =>
                            updateItem(it._key, "cantidad", Math.max(1, Number(e.target.value)))
                          }
                          min="1"
                          className="w-14 rounded border border-neutral-200 px-2 py-1 text-center text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={it.precio_unitario}
                          onChange={(e) =>
                            updateItem(it._key, "precio_unitario", Number(e.target.value))
                          }
                          min="0"
                          step="0.01"
                          className="w-24 rounded border border-neutral-200 px-2 py-1 text-right text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium text-neutral-900">
                        {fmtPEN(it.cantidad * it.precio_unitario)}
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeItem(it._key)}>
                          <X className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-neutral-200 bg-neutral-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-right text-sm font-bold text-neutral-900"
                    >
                      TOTAL REFERENCIAL
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-neutral-900">
                      {fmtPEN(totalReferencial)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

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
            onClick={handleGuardar}
            disabled={isPending || items.length === 0}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar cotización"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CotizacionesVentaPage() {
  const [page, setPage] = useState(1);
  const [showCrear, setShowCrear] = useState(false);
  const [verId, setVerId] = useState<string | null>(null);

  const { data, isLoading, isError } = useCotizacionesVenta({ page, pageSize: 20 });
  const cotizaciones = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Cotizaciones referenciales</h1>
        <button
          type="button"
          onClick={() => setShowCrear(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + Nueva cotización
        </button>
      </div>

      <p className="text-xs text-neutral-500">
        Las cotizaciones son referenciales — no reservan stock ni generan movimientos (V15).
      </p>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-red-600">Error al cargar.</div>
        ) : cotizaciones.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">
            No hay cotizaciones registradas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Número</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Cliente</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Total ref.</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Usuario</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c: CotizacionVentaDto) => (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-900">
                    {c.codigo}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(c.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.cliente_nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {fmtPEN(c.total_referencial)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.usuario_nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVerId(c.id)}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            {meta.total} cotizaciones · página {meta.page} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {showCrear && <ModalCrear onClose={() => setShowCrear(false)} />}
      {verId && <ModalDetalle cotizacionId={verId} onClose={() => setVerId(null)} />}
    </div>
  );
}
