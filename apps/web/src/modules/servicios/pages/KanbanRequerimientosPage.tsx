import {
  useCambiarEstadoRequerimiento,
  useOrdenes,
  useRequerimientos,
} from "../hooks/useOrdenesServicio";
import type { EstadoRequerimiento, RequerimientoOrden } from "../types/orden-servicio";

const COLUMNAS: { estado: EstadoRequerimiento; label: string; color: string }[] = [
  { estado: "PENDIENTE", label: "Pendiente", color: "border-yellow-300 bg-yellow-50" },
  { estado: "EN_COMPRA", label: "En compra", color: "border-blue-300 bg-blue-50" },
  { estado: "ATENDIDO", label: "Atendido", color: "border-green-300 bg-green-50" },
  { estado: "ANULADO", label: "Anulado", color: "border-neutral-300 bg-neutral-50" },
];

type ReqConOrden = RequerimientoOrden & { orden_codigo?: string };

function nextEstados(current: EstadoRequerimiento): EstadoRequerimiento[] {
  switch (current) {
    case "PENDIENTE":
      return ["EN_COMPRA", "ANULADO"];
    case "EN_COMPRA":
      return ["ATENDIDO", "ANULADO"];
    default:
      return [];
  }
}

function ReqCard({
  req,
  onCambiarEstado,
  isPending,
}: {
  req: ReqConOrden;
  onCambiarEstado: (req: ReqConOrden, estado: EstadoRequerimiento) => void;
  isPending: boolean;
}) {
  const siguientes = nextEstados(req.estado);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      {req.orden_codigo && (
        <p className="font-mono text-xs font-semibold text-primary-600">{req.orden_codigo}</p>
      )}
      <p className="mt-1 text-xs font-medium text-neutral-800">{req.descripcion}</p>
      {req.producto_nombre && <p className="text-xs text-neutral-500">{req.producto_nombre}</p>}
      <div className="mt-1 flex gap-2 text-xs text-neutral-400">
        <span>Cant: {req.cantidad}</span>
        {req.observacion && <span>· {req.observacion}</span>}
      </div>
      {req.imagen_url && (
        <a
          href={req.imagen_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs text-primary-600 hover:underline"
        >
          Ver imagen
        </a>
      )}
      {siguientes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {siguientes.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => onCambiarEstado(req, s)}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
            >
              → {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdenReqsForCol({
  ordenId,
  ordenCodigo,
  estado,
  onCambiarEstado,
  isPending,
}: {
  ordenId: string;
  ordenCodigo: string;
  estado: EstadoRequerimiento;
  onCambiarEstado: (req: ReqConOrden, estado: EstadoRequerimiento) => void;
  isPending: boolean;
}) {
  const { data } = useRequerimientos(ordenId);
  const reqs = (data?.data ?? [])
    .filter((r) => r.estado === estado)
    .map((r) => ({ ...r, orden_codigo: ordenCodigo }));

  return (
    <>
      {reqs.map((req) => (
        <ReqCard key={req.id} req={req} onCambiarEstado={onCambiarEstado} isPending={isPending} />
      ))}
    </>
  );
}

const ESTADOS_ACTIVOS = [
  "REVISION",
  "DIAG_PRELIMINAR",
  "DIAG_FINAL",
  "COTIZADO",
  "APROBADO",
  "AGREGAR_SKU",
  "PRIORIDAD",
];

export function KanbanRequerimientosPage() {
  const { data: ordenesData, isLoading } = useOrdenes({ pageSize: 200 });
  const cambiarEstado = useCambiarEstadoRequerimiento();

  const ordenes = (ordenesData?.data ?? [])
    .filter((o) => ESTADOS_ACTIVOS.includes(o.estado))
    .map((o) => ({ id: o.id, codigo: o.codigo }));

  async function handleCambiarEstado(req: ReqConOrden, estado: EstadoRequerimiento) {
    try {
      await cambiarEstado.mutateAsync({
        requerimientoId: req.id,
        ordenId: req.orden_servicio_id,
        estado,
      });
    } catch {
      // silently ignored; no toast system yet
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Kanban — Requerimientos</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {!isLoading && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map(({ estado, label, color }) => (
            <div
              key={estado}
              className={`flex w-56 shrink-0 flex-col rounded-xl border-2 ${color}`}
              style={{ maxHeight: "calc(100vh - 160px)" }}
            >
              <div className="shrink-0 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  {label}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {ordenes.length === 0 && (
                  <p className="py-4 text-center text-xs text-neutral-400">Sin órdenes activas</p>
                )}
                {ordenes.map((o) => (
                  <OrdenReqsForCol
                    key={o.id}
                    ordenId={o.id}
                    ordenCodigo={o.codigo}
                    estado={estado}
                    onCambiarEstado={handleCambiarEstado}
                    isPending={cambiarEstado.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
