import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrdenes } from "../hooks/useOrdenesServicio";
import type { EstadoOS, OrdenServicioResumen } from "../types/orden-servicio";

const ESTADO_COLORS: Record<EstadoOS, string> = {
  VALIDACION: "bg-slate-100 text-slate-700",
  REVISION: "bg-purple-100 text-purple-700",
  DIAG_PRELIMINAR: "bg-blue-100 text-blue-700",
  DIAG_FINAL: "bg-indigo-100 text-indigo-700",
  COTIZADO: "bg-yellow-100 text-yellow-700",
  APROBADO: "bg-orange-100 text-orange-700",
  AGREGAR_SKU: "bg-amber-100 text-amber-700",
  PRIORIDAD: "bg-red-100 text-red-700",
  REPARADO: "bg-teal-100 text-teal-700",
  AVISADO: "bg-cyan-100 text-cyan-700",
  ENTREGADO: "bg-green-100 text-green-700",
  GARANTIA: "bg-amber-100 text-amber-700",
  DEVOLUCION: "bg-red-100 text-red-600",
};

const ESTADOS: EstadoOS[] = [
  "VALIDACION",
  "REVISION",
  "DIAG_PRELIMINAR",
  "DIAG_FINAL",
  "COTIZADO",
  "APROBADO",
  "AGREGAR_SKU",
  "PRIORIDAD",
  "REPARADO",
  "AVISADO",
  "ENTREGADO",
  "GARANTIA",
  "DEVOLUCION",
];

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function OSRow({ os }: { os: OrdenServicioResumen }) {
  const navigate = useNavigate();
  return (
    <tr className="hover:bg-neutral-50">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold">
        <Link to={`/servicios/${os.id}`} className="text-primary-600 hover:underline">
          {os.codigo}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-700">{os.cliente_nombre ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-neutral-600">{os.producto_nombre ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-neutral-500">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            os.canal === "DOMICILIO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {os.canal}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-600">{os.tecnico_nombre ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[os.estado]}`}
        >
          {os.estado.replace(/_/g, " ")}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
        {fmtDate(os.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link
            to={`/servicios/${os.id}`}
            title="Ver detalle"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            title="Editar orden"
            onClick={() => navigate(`/servicios/${os.id}/editar`)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ServiciosPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoOS | "">("");
  const [page, setPage] = useState(1);

  const params = {
    page,
    pageSize: 20,
    ...(search ? { search } : {}),
    ...(estado ? { estado } : {}),
  };

  const { data, isLoading, isError } = useOrdenes(params);
  const ordenes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por código, cliente, falla..."
            className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoOS | "");
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

      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-red-600">Error al cargar órdenes.</p>
        )}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  {[
                    "Código",
                    "Cliente",
                    "Producto",
                    "Canal",
                    "Técnico",
                    "Estado",
                    "Fecha",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ordenes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-neutral-500">
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
