import type { CreateSolicitudCompraInput } from "@kallpasoft/validators";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useProductos } from "../../inventario/hooks/useInventario";
import {
  useCreateSolicitud,
  useDeleteSolicitud,
  useSolicitudes,
  useStockBajo,
} from "../hooks/useSolicitudes";
import type {
  EstadoSolicitudCompra,
  PrioridadSolicitud,
  SolicitudDto,
  SolicitudesParams,
} from "../types/solicitud";

const PAGE_SIZE = 20;

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const PRIORIDAD_COLORS: Record<PrioridadSolicitud, string> = {
  BAJA: "bg-neutral-100 text-neutral-600",
  NORMAL: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700",
  URGENTE: "bg-red-100 text-red-700",
};

const ESTADO_COLORS: Record<EstadoSolicitudCompra, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  EN_OC: "bg-blue-100 text-blue-700",
  COMPLETADA: "bg-green-100 text-green-700",
};

function PrioridadBadge({ prioridad }: { prioridad: PrioridadSolicitud }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDAD_COLORS[prioridad]}`}
    >
      {prioridad}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: EstadoSolicitudCompra }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {estado.replace("_", " ")}
    </span>
  );
}

// ─── Modal Crear Solicitud ────────────────────────────────────────────────────

function CrearSolicitudModal({
  preselectedProductoId,
  onClose,
}: {
  preselectedProductoId?: string;
  onClose: () => void;
}) {
  const [productoId, setProductoId] = useState(preselectedProductoId ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [prioridad, setPrioridad] = useState<PrioridadSolicitud>("NORMAL");
  const [notas, setNotas] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: productosData } = useProductos({ activo: true, pageSize: 200 });
  const createMutation = useCreateSolicitud();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!productoId) {
      setServerError("Selecciona un producto");
      return;
    }

    const body: CreateSolicitudCompraInput = {
      producto_id: productoId,
      cantidad_solicitada: cantidad,
      prioridad,
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
          <h2 className="text-base font-semibold text-neutral-900">Nueva solicitud de compra</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="sc-producto" className="text-xs font-medium text-neutral-700">
                Producto
              </label>
              <select
                id="sc-producto"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className={SELECT}
              >
                <option value="">Seleccionar...</option>
                {productosData?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="sc-cantidad" className="text-xs font-medium text-neutral-700">
                  Cantidad
                </label>
                <input
                  id="sc-cantidad"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="sc-prioridad" className="text-xs font-medium text-neutral-700">
                  Prioridad
                </label>
                <select
                  id="sc-prioridad"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as PrioridadSolicitud)}
                  className={SELECT}
                >
                  <option value="BAJA">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sc-notas" className="text-xs font-medium text-neutral-700">
                Notas <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="sc-notas"
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
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createMutation.isPending ? "Creando..." : "Crear solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel lateral stock bajo ─────────────────────────────────────────────────

function StockBajoPanel({ onQuickAdd }: { onQuickAdd: (productoId: string) => void }) {
  const { data, isLoading } = useStockBajo();

  return (
    <div className="w-72 shrink-0 rounded-xl border border-orange-200 bg-orange-50">
      <div className="flex items-center gap-2 border-b border-orange-200 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-orange-800">Stock bajo mínimo</span>
      </div>
      <div className="max-h-96 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        )}
        {data?.data.length === 0 && (
          <p className="py-4 text-center text-xs text-neutral-500">Sin alertas</p>
        )}
        {data?.data.map((item) => (
          <div
            key={item.producto_id}
            className="flex items-center justify-between rounded-lg bg-white p-2 text-xs shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-neutral-900">{item.nombre}</p>
              <p className="text-neutral-500">
                Stock: <span className="font-semibold text-orange-600">{item.stock_actual}</span>
                {" / "}Min: {item.stock_minimo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onQuickAdd(item.producto_id)}
              className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              title="Crear solicitud"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SolicitudesPage() {
  const [page, setPage] = useState(1);
  const [filterEstado, setFilterEstado] = useState("");
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [showCrear, setShowCrear] = useState(false);
  const [quickAddProductoId, setQuickAddProductoId] = useState<string | undefined>(undefined);

  const params: SolicitudesParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(filterEstado ? { estado: filterEstado as EstadoSolicitudCompra } : {}),
    ...(filterPrioridad ? { prioridad: filterPrioridad as PrioridadSolicitud } : {}),
  };

  const { data, isLoading, isError } = useSolicitudes(params);
  const deleteMutation = useDeleteSolicitud();
  const meta = data?.meta;

  function handleQuickAdd(productoId: string) {
    setQuickAddProductoId(productoId);
    setShowCrear(true);
  }

  function handleCloseModal() {
    setShowCrear(false);
    setQuickAddProductoId(undefined);
  }

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="flex gap-4">
      {/* Tabla principal */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Solicitudes de compra</h1>
          <button
            type="button"
            onClick={() => setShowCrear(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Nueva solicitud
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_OC">En OC</option>
            <option value="COMPLETADA">Completada</option>
          </select>
          <select
            value={filterPrioridad}
            onChange={(e) => {
              setFilterPrioridad(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Todas las prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="BAJA">Baja</option>
          </select>
          {(filterEstado || filterPrioridad) && (
            <button
              type="button"
              onClick={() => {
                setFilterEstado("");
                setFilterPrioridad("");
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-danger-600">Error al cargar solicitudes.</p>
          )}
          {!isLoading && !isError && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Estado
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                    Notas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-500">
                      No se encontraron solicitudes.
                    </td>
                  </tr>
                )}
                {data?.data.map((s: SolicitudDto) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {s.producto_nombre ?? s.producto_id}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {s.cantidad_solicitada}
                    </td>
                    <td className="px-4 py-3">
                      <PrioridadBadge prioridad={s.prioridad} />
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={s.estado} />
                    </td>
                    <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                      {s.notas ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {s.estado === "PENDIENTE" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            title="Eliminar"
                            disabled={deleteMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta !== undefined && meta.total > 0 && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>
              {meta.total} solicitud{meta.total !== 1 ? "es" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-xs">
                {page} / {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral stock bajo */}
      <StockBajoPanel onQuickAdd={handleQuickAdd} />

      {showCrear && (
        <CrearSolicitudModal
          {...(quickAddProductoId !== undefined
            ? { preselectedProductoId: quickAddProductoId }
            : {})}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
