import { useState } from "react";
import { useAnularVenta, useVentas } from "../hooks/useVentas";

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  PAGADA: "bg-green-100 text-green-700",
  PARCIAL: "bg-blue-100 text-blue-700",
  ANULADA: "bg-red-100 text-red-700",
};

export function HistorialVentasPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useVentas({
    ...(search ? { search } : {}),
    ...(estado ? { estado } : {}),
    page,
    pageSize: 20,
  });

  const ventas = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Historial de ventas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADA">Pagada</option>
          <option value="PARCIAL">Parcial</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Cargando...</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">No hay ventas</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Código</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Tipo</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <VentaRow key={v.id} venta={v} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            {meta.total} ventas · página {meta.page} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VentaRow({
  venta,
}: {
  venta: {
    id: string;
    codigo: string;
    created_at: string;
    cliente_nombre?: string;
    tipo_venta: string;
    total: string;
    estado: string;
  };
}) {
  const { mutate: anular, isPending } = useAnularVenta();
  const [confirm, setConfirm] = useState(false);

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      <td className="px-4 py-3 font-mono text-xs text-neutral-900">{venta.codigo}</td>
      <td className="px-4 py-3 text-neutral-600">
        {new Date(venta.created_at).toLocaleDateString("es-PE")}
      </td>
      <td className="px-4 py-3 text-neutral-600">{venta.cliente_nombre ?? "—"}</td>
      <td className="px-4 py-3 text-neutral-600">{venta.tipo_venta}</td>
      <td className="px-4 py-3 text-right font-medium text-neutral-900">S/ {venta.total}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[venta.estado] ?? "bg-neutral-100 text-neutral-700"}`}
        >
          {venta.estado}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {venta.estado !== "ANULADA" &&
          (confirm ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => anular({ id: venta.id, motivo: "Anulación manual" })}
                disabled={isPending}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="text-xs text-red-500 hover:underline"
            >
              Anular
            </button>
          ))}
      </td>
    </tr>
  );
}
