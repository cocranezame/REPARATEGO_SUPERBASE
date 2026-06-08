import { MessageCircle, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useProductos, useProveedoresSugeridos } from "../../inventario/hooks/useInventario";
import type { ProveedorSugeridoDto } from "../../inventario/types/inventario";
import {
  useCotizaciones,
  useCreateCotizacion,
  useDeleteCotizacion,
  useUpdateCotizacion,
} from "../hooks/useCotizaciones";
import type { CotizacionDto } from "../types/cotizacion";

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(val: string | null | undefined) {
  if (!val) return "—";
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? "—" : `S/ ${n.toFixed(2)}`;
}

function buildWhatsApp(proveedor: ProveedorSugeridoDto, productoNombre: string): string {
  if (!proveedor.telefono) return "";
  const numero = proveedor.telefono.replace(/\D/g, "");
  if (!numero) return "";
  const nombre = proveedor.razon_social;
  const msg = `Estimado ${nombre}, quería consultar el precio de ${productoNombre}. ¿Cuál es el costo por unidad?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-neutral-400">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
        />
      ))}
    </span>
  );
}

// ─── Modal: Registrar / Editar precio ─────────────────────────────────────────

function PrecioModal({
  cotizacion,
  proveedorId,
  proveedorNombre,
  productoId,
  productoNombre,
  onClose,
}: {
  cotizacion?: CotizacionDto;
  proveedorId?: string;
  proveedorNombre?: string;
  productoId?: string;
  productoNombre?: string;
  onClose: () => void;
}) {
  const isEdit = cotizacion !== undefined;
  const createMutation = useCreateCotizacion();
  const updateMutation = useUpdateCotizacion();

  const [precio, setPrecio] = useState(
    isEdit && cotizacion.precio_unitario ? cotizacion.precio_unitario : ""
  );
  const [notas, setNotas] = useState(cotizacion?.notas ?? "");
  const [error, setError] = useState<string | null>(null);

  const displayProveedorNombre = isEdit
    ? (cotizacion.proveedor_nombre ?? "—")
    : (proveedorNombre ?? "—");
  const displayProductoNombre = isEdit
    ? (cotizacion.producto_nombre ?? "—")
    : (productoNombre ?? "—");

  function handleSubmit() {
    const num = Number.parseFloat(precio);
    if (precio !== "" && (Number.isNaN(num) || num <= 0)) {
      setError("Ingresa un precio válido mayor a 0");
      return;
    }

    setError(null);

    if (isEdit) {
      const body: { id: string; precio_unitario?: number; notas?: string } = { id: cotizacion.id };
      if (precio !== "") body.precio_unitario = num;
      if (notas !== "") body.notas = notas;
      updateMutation.mutate(body, { onSuccess: onClose, onError: (e) => setError(e.message) });
    } else {
      const body: {
        proveedor_id: string;
        producto_id: string;
        precio_unitario?: number;
        notas?: string;
      } = {
        proveedor_id: proveedorId ?? "",
        producto_id: productoId ?? "",
      };
      if (precio !== "") body.precio_unitario = num;
      if (notas !== "") body.notas = notas;
      createMutation.mutate(body, { onSuccess: onClose, onError: (e) => setError(e.message) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Editar precio" : "Registrar precio"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm">
          <p>
            <span className="text-neutral-500">Proveedor:</span>{" "}
            <span className="font-medium">{displayProveedorNombre}</span>
          </p>
          <p className="mt-1">
            <span className="text-neutral-500">Repuesto:</span>{" "}
            <span className="font-medium">{displayProductoNombre}</span>
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="precio-input" className="text-xs font-medium text-neutral-700">
              Precio unitario (S/) <span className="font-normal text-neutral-400">(opcional)</span>
            </label>
            <input
              id="precio-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="notas-input" className="text-xs font-medium text-neutral-700">
              Notas <span className="font-normal text-neutral-400">(opcional)</span>
            </label>
            <textarea
              id="notas-input"
              rows={2}
              placeholder="Condiciones, tiempo de entrega..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className={`${INPUT} resize-none`}
            />
          </div>
        </div>

        {error !== null && <p className="mt-2 text-sm text-danger-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Proveedores sugeridos para un producto ────────────────────────────

function ProveedoresSugeridosPanel({
  productoId,
  productoNombre,
  onRegistrarPrecio,
}: {
  productoId: string;
  productoNombre: string;
  onRegistrarPrecio: (proveedor: ProveedorSugeridoDto) => void;
}) {
  const { data, isLoading, isError } = useProveedoresSugeridos(productoId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-danger-600">Error al cargar proveedores</p>;
  }

  const seguros = data?.data.seguros ?? [];
  const posibles = data?.data.posibles ?? [];

  if (seguros.length === 0 && posibles.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
        No hay proveedores con líneas que coincidan con la categoría/componente de este repuesto.
        Configura las líneas en la sección de Proveedores.
      </div>
    );
  }

  function ProveedorRow({
    prov,
    label,
  }: {
    prov: ProveedorSugeridoDto;
    label: "Seguro" | "Posible";
  }) {
    const waUrl = buildWhatsApp(prov, productoNombre);
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                label === "Seguro" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
              }`}
            >
              {label}
            </span>
            <p className="truncate text-sm font-medium text-neutral-900">{prov.razon_social}</p>
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-xs text-neutral-400">{prov.ruc}</span>
            <StarRating value={prov.calificacion} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {waUrl !== "" && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Consultar precio por WhatsApp"
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => onRegistrarPrecio(prov)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar precio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {seguros.map((p) => (
        <ProveedorRow key={p.proveedor_id} prov={p} label="Seguro" />
      ))}
      {posibles.map((p) => (
        <ProveedorRow key={p.proveedor_id} prov={p} label="Posible" />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CotizacionesPage() {
  const { data: cotizacionesData, isLoading: loadingList } = useCotizaciones({ pageSize: 100 });
  const { data: productosData } = useProductos({ tipo: "PRODUCTO", activo: true, pageSize: 200 });

  const deleteMutation = useDeleteCotizacion();

  // Nueva cotización: flujo de 2 pasos
  const [showNueva, setShowNueva] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [selectedProductoNombre, setSelectedProductoNombre] = useState("");
  const [productoSearch, setProductoSearch] = useState("");

  // Modal precio (crear desde sugeridos)
  const [precioModal, setPrecioModal] = useState<{
    proveedorId: string;
    proveedorNombre: string;
    productoId: string;
    productoNombre: string;
  } | null>(null);

  // Modal editar cotización existente
  const [editCotizacion, setEditCotizacion] = useState<CotizacionDto | null>(null);

  // Confirmar eliminar
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cotizaciones = cotizacionesData?.data ?? [];
  const productos = productosData?.data ?? [];

  const productosFiltrados = productoSearch.trim()
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(productoSearch.toLowerCase()) ||
          p.codigo.toLowerCase().includes(productoSearch.toLowerCase())
      )
    : productos;

  function handleSelectProducto(id: string, nombre: string) {
    setSelectedProductoId(id);
    setSelectedProductoNombre(nombre);
    setProductoSearch("");
  }

  function handleRegistrarPrecio(prov: ProveedorSugeridoDto) {
    setPrecioModal({
      proveedorId: prov.proveedor_id,
      proveedorNombre: prov.razon_social,
      productoId: selectedProductoId,
      productoNombre: selectedProductoNombre,
    });
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteId(null) });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Cotizaciones</h1>
          <p className="text-sm text-neutral-500">
            Precios de repuestos por proveedor · consulta y registra cotizaciones
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowNueva(true);
            setSelectedProductoId("");
            setSelectedProductoNombre("");
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva cotización
        </button>
      </div>

      {/* Panel: Nueva cotización */}
      {showNueva && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary-900">
              Nueva cotización — selecciona el repuesto
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowNueva(false);
                setSelectedProductoId("");
                setSelectedProductoNombre("");
              }}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Paso 1: Selección de producto */}
          <div className="mb-4">
            <label htmlFor="buscar-repuesto" className="text-xs font-medium text-neutral-700">
              Buscar repuesto
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                id="buscar-repuesto"
                type="text"
                placeholder="Nombre o código..."
                value={selectedProductoId ? selectedProductoNombre : productoSearch}
                onChange={(e) => {
                  if (selectedProductoId) {
                    setSelectedProductoId("");
                    setSelectedProductoNombre("");
                  }
                  setProductoSearch(e.target.value);
                }}
                className={`${INPUT} pl-9`}
              />
            </div>

            {/* Dropdown de resultados */}
            {selectedProductoId === "" && productoSearch.trim() !== "" && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md">
                {productosFiltrados.length === 0 ? (
                  <p className="p-3 text-sm text-neutral-400">Sin resultados</p>
                ) : (
                  productosFiltrados.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProducto(p.id, p.nombre)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50"
                    >
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500">
                        {p.codigo}
                      </span>
                      <span className="text-sm text-neutral-900">{p.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Paso 2: Proveedores sugeridos */}
          {selectedProductoId !== "" && (
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-600">
                Proveedores que atienden{" "}
                <span className="font-semibold text-neutral-900">{selectedProductoNombre}</span>
              </p>
              <ProveedoresSugeridosPanel
                productoId={selectedProductoId}
                productoNombre={selectedProductoNombre}
                onRegistrarPrecio={handleRegistrarPrecio}
              />
            </div>
          )}
        </div>
      )}

      {/* Lista de cotizaciones */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">
            Cotizaciones registradas
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {cotizaciones.length}
            </span>
          </h2>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-neutral-500">
              Sin cotizaciones aún. Crea una usando el botón de arriba.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Repuesto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Precio unitario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Notas
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {c.producto_nombre ?? c.producto_id}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.proveedor_nombre ?? c.proveedor_id}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.precio_unitario !== null ? (
                        <span className="font-semibold text-neutral-900">
                          {fmtPEN(c.precio_unitario)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          Sin precio
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-neutral-500">
                      {c.notas ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Editar precio"
                          onClick={() => setEditCotizacion(c)}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => setDeleteId(c.id)}
                          className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar precio desde sugeridos */}
      {precioModal !== null && (
        <PrecioModal
          proveedorId={precioModal.proveedorId}
          proveedorNombre={precioModal.proveedorNombre}
          productoId={precioModal.productoId}
          productoNombre={precioModal.productoNombre}
          onClose={() => {
            setPrecioModal(null);
            setShowNueva(false);
            setSelectedProductoId("");
            setSelectedProductoNombre("");
          }}
        />
      )}

      {/* Modal: Editar cotización existente */}
      {editCotizacion !== null && (
        <PrecioModal cotizacion={editCotizacion} onClose={() => setEditCotizacion(null)} />
      )}

      {/* Modal: Confirmar eliminar */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <p className="text-sm text-neutral-900">
              ¿Eliminar esta cotización? No se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
