import { Eye, Printer } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { imprimirVoucherSimple } from "../components/VoucherPrint";
import { useVentas } from "../hooks/useVentas";

// ─── Badges ───────────────────────────────────────────────────────────────────

const PAGO_BADGE: Record<string, string> = {
  PAGO_PENDIENTE: "bg-amber-100 text-amber-700",
  COMPLETADA: "bg-green-100 text-green-700",
  ANULADA: "bg-red-100 text-red-700",
};

const PAGO_LABEL: Record<string, string> = {
  PAGO_PENDIENTE: "Pendiente",
  COMPLETADA: "Pagada",
  ANULADA: "Anulada",
};

const DESPACHO_BADGE: Record<string, string> = {
  SIN_ENVIO: "bg-neutral-100 text-neutral-600",
  ENVIO_PENDIENTE: "bg-blue-100 text-blue-700",
  DESPACHADO: "bg-green-100 text-green-700",
};

const DESPACHO_LABEL: Record<string, string> = {
  SIN_ENVIO: "Sin envío",
  ENVIO_PENDIENTE: "Envío pendiente",
  DESPACHADO: "Despachado",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VentasListaPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === "ADMIN";

  const [estadoPago, setEstadoPago] = useState("");
  const [estadoDespacho, setEstadoDespacho] = useState("");
  const [tipo, setTipo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useVentas({
    ...(estadoPago ? { estado_pago: estadoPago } : {}),
    ...(estadoDespacho ? { estado_despacho: estadoDespacho } : {}),
    ...(tipo ? { tipo } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
    page,
    pageSize: 20,
  });

  const ventas = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Ventas</h1>
        <button
          type="button"
          onClick={() => navigate("/ventas/pos")}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + Nueva venta (POS)
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={estadoPago}
          onChange={(e) => {
            setEstadoPago(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Estado pago</option>
          <option value="PAGO_PENDIENTE">Pendiente</option>
          <option value="COMPLETADA">Pagada</option>
          <option value="ANULADA">Anulada</option>
        </select>

        <select
          value={estadoDespacho}
          onChange={(e) => {
            setEstadoDespacho(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Estado despacho</option>
          <option value="SIN_ENVIO">Sin envío</option>
          <option value="ENVIO_PENDIENTE">Envío pendiente</option>
          <option value="DESPACHADO">Despachado</option>
        </select>

        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Tipo</option>
          <option value="LIBRE">Libre</option>
          <option value="SERVICIO">Servicio</option>
          <option value="REVISION_DOMICILIO">Revisión domicilio</option>
          <option value="REVISION_DEVOLUCION">Revisión devolución</option>
        </select>

        <input
          type="date"
          value={desde}
          onChange={(e) => {
            setDesde(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          placeholder="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => {
            setHasta(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          placeholder="Hasta"
        />

        {(estadoPago || estadoDespacho || tipo || desde || hasta) && (
          <button
            type="button"
            onClick={() => {
              setEstadoPago("");
              setEstadoDespacho("");
              setTipo("");
              setDesde("");
              setHasta("");
              setPage(1);
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {!isAdmin && <p className="text-xs text-neutral-500">Mostrando tus ventas (P4 — V27).</p>}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-red-600">Error al cargar ventas.</div>
        ) : ventas.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">No hay ventas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Saldo</th>
                  <th className="px-4 py-3 text-center font-medium text-neutral-600">Pago</th>
                  <th className="px-4 py-3 text-center font-medium text-neutral-600">Despacho</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Vendedor</th>
                  )}
                  <th className="px-4 py-3 text-center font-medium text-neutral-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-900">
                      {v.codigo}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-neutral-700">
                      {v.cliente_nombre ?? "Sin cliente"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(v.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                        {v.tipo_venta === "LIBRE"
                          ? "Libre"
                          : v.tipo_venta === "SERVICIO"
                            ? "Servicio"
                            : v.tipo_venta.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">
                      S/ {Number(v.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-600">
                      {Number(v.saldo_pendiente) > 0 ? (
                        <span className="font-medium text-amber-700">
                          S/ {Number(v.saldo_pendiente).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAGO_BADGE[v.estado_pago] ?? "bg-neutral-100 text-neutral-700"}`}
                      >
                        {PAGO_LABEL[v.estado_pago] ?? v.estado_pago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DESPACHO_BADGE[v.estado_despacho] ?? "bg-neutral-100 text-neutral-700"}`}
                      >
                        {DESPACHO_LABEL[v.estado_despacho] ?? v.estado_despacho}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-neutral-600">{v.vendedor_nombre ?? "—"}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/ventas/${v.id}`)}
                          title="Ver detalle"
                          className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => imprimirVoucherSimple(v)}
                          title="Imprimir voucher"
                          className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          <Printer className="h-4 w-4" />
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
    </div>
  );
}
