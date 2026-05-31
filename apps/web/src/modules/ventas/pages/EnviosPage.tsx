import { useState } from "react";
import { useUpdateEnvioEstado, useVentasEnvios } from "../hooks/useVentas";

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  EN_CAMINO: "bg-blue-100 text-blue-700",
  ENTREGADO: "bg-green-100 text-green-700",
};

const SIGUIENTE_ESTADO: Record<string, "PENDIENTE" | "EN_CAMINO" | "ENTREGADO"> = {
  PENDIENTE: "EN_CAMINO",
  EN_CAMINO: "ENTREGADO",
};

export function EnviosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVentasEnvios({ page, pageSize: 20 });
  const envios = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Envíos</h1>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Cargando...</div>
        ) : envios.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">No hay envíos registrados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Venta</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Dirección</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Costo</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Fecha envío</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {envios.map((envio) => (
                <EnvioRow key={envio.id} envio={envio} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            {meta.total} envíos · página {meta.page} de {meta.totalPages}
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

function EnvioRow({
  envio,
}: {
  envio: {
    id: string;
    venta_id: string;
    direccion_texto: string;
    estado: string;
    costo_envio: string;
    fecha_envio: string | null;
  };
}) {
  const { mutate: cambiarEstado, isPending } = useUpdateEnvioEstado();
  const siguiente = SIGUIENTE_ESTADO[envio.estado];

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      <td className="px-4 py-3 font-mono text-xs text-neutral-900">
        {envio.venta_id.slice(0, 8)}…
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-neutral-600">{envio.direccion_texto}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[envio.estado] ?? "bg-neutral-100 text-neutral-700"}`}
        >
          {envio.estado.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-neutral-600">S/ {envio.costo_envio}</td>
      <td className="px-4 py-3 text-neutral-600">
        {envio.fecha_envio ? new Date(envio.fecha_envio).toLocaleDateString("es-PE") : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        {siguiente && (
          <button
            type="button"
            onClick={() => cambiarEstado({ ventaId: envio.venta_id, estado: siguiente })}
            disabled={isPending}
            className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            → {siguiente.replace("_", " ")}
          </button>
        )}
      </td>
    </tr>
  );
}
