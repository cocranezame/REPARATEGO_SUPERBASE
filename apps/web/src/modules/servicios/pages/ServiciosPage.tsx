import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrdenesServicio } from "../hooks/useOrdenesServicio";
import type { EstadoOrdenServicio, OrdenServicioDto } from "../types/orden-servicio";

const ESTADO_COLORS: Record<EstadoOrdenServicio, string> = {
  RECEPCION: "bg-blue-100 text-blue-700",
  EN_DIAGNOSTICO: "bg-purple-100 text-purple-700",
  DIAGNOSTICADO: "bg-indigo-100 text-indigo-700",
  COTIZADO: "bg-yellow-100 text-yellow-700",
  APROBADO: "bg-orange-100 text-orange-700",
  EN_REPARACION: "bg-cyan-100 text-cyan-700",
  REPARADO: "bg-teal-100 text-teal-700",
  LISTO_ENTREGA: "bg-green-100 text-green-700",
  ENTREGADO: "bg-neutral-100 text-neutral-600",
  DEVOLUCION: "bg-red-100 text-red-700",
  CANCELADO: "bg-neutral-100 text-neutral-400",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: "text-neutral-400",
  NORMAL: "text-neutral-600",
  ALTA: "text-orange-600 font-semibold",
  URGENTE: "text-red-600 font-bold",
};

const ESTADOS: EstadoOrdenServicio[] = [
  "RECEPCION",
  "EN_DIAGNOSTICO",
  "DIAGNOSTICADO",
  "COTIZADO",
  "APROBADO",
  "EN_REPARACION",
  "REPARADO",
  "LISTO_ENTREGA",
  "ENTREGADO",
  "DEVOLUCION",
  "CANCELADO",
];

function EstadoBadge({ estado }: { estado: EstadoOrdenServicio }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {estado.replace(/_/g, " ")}
    </span>
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function OSRow({ os }: { os: OrdenServicioDto }) {
  return (
    <tr className="hover:bg-neutral-50">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-neutral-900">
        <Link to={`/servicios/${os.id}`} className="text-primary-600 hover:underline">
          {os.codigo}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-700">{os.cliente_nombre ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-neutral-600">
        {[os.categoria_nombre, os.marca_nombre, os.modelo_nombre].filter(Boolean).join(" / ") ||
          "—"}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">{os.tecnico_nombre ?? "Sin asignar"}</td>
      <td className="px-4 py-3">
        <EstadoBadge estado={os.estado} />
      </td>
      <td className={`px-4 py-3 text-xs ${PRIORIDAD_COLORS[os.prioridad] ?? ""}`}>
        {os.prioridad}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
        {fmtDate(os.fecha_recepcion)}
      </td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ServiciosPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoOrdenServicio | "">("");
  const [page, setPage] = useState(1);

  const params = {
    page,
    pageSize: 20,
    ...(search ? { search } : {}),
    ...(estado ? { estado } : {}),
  };

  const { data, isLoading, isError } = useOrdenesServicio(params);
  const ordenes = data?.data ?? [];
  const meta = data?.meta;

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">Servicios (OS)</h1>
        <Link
          to="/servicios/nuevo"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva OS
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por código, problema, serie..."
              className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </form>
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoOrdenServicio | "");
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-danger-600">Error al cargar órdenes.</p>
        )}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Equipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Técnico
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Recepción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ordenes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-500">
                      No hay órdenes registradas.
                    </td>
                  </tr>
                )}
                {ordenes.map((os) => (
                  <OSRow key={os.id} os={os} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
            <p className="text-xs text-neutral-500">
              {meta.total} resultados — pág {meta.page}/{meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
