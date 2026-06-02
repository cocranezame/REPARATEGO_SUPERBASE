import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrden, useOrdenes } from "../hooks/useOrdenesServicio";
import { ModalAgregarSku } from "../modales/ModalAgregarSku";
import { ModalAprobado } from "../modales/ModalAprobado";
import { ModalAvisado } from "../modales/ModalAvisado";
import { ModalCotizacion } from "../modales/ModalCotizacion";
import { ModalCotizado } from "../modales/ModalCotizado";
import { ModalDevolucion } from "../modales/ModalDevolucion";
import { ModalDiagFinal } from "../modales/ModalDiagFinal";
import { ModalDiagPreliminar } from "../modales/ModalDiagPreliminar";
import { ModalGarantia } from "../modales/ModalGarantia";
import { ModalPrioridad } from "../modales/ModalPrioridad";
import { ModalReparado } from "../modales/ModalReparado";
import { ModalRevision } from "../modales/ModalRevision";
import { ModalValidacion } from "../modales/ModalValidacion";
import type { EstadoOS, OrdenServicioResumen } from "../types/orden-servicio";

type ModalType =
  | "validacion"
  | "revision"
  | "diag-preliminar"
  | "diag-final"
  | "cotizacion"
  | "cotizado"
  | "aprobado"
  | "agregar-sku"
  | "prioridad"
  | "reparado"
  | "avisado"
  | "devolucion"
  | "garantia";

const COLUMNAS: { estado: EstadoOS; label: string; color: string }[] = [
  { estado: "VALIDACION", label: "Validación", color: "border-slate-300 bg-slate-50" },
  { estado: "REVISION", label: "Revisión", color: "border-purple-300 bg-purple-50" },
  { estado: "DIAG_PRELIMINAR", label: "Diag. Preliminar", color: "border-blue-300 bg-blue-50" },
  { estado: "DIAG_FINAL", label: "Diag. Final", color: "border-indigo-300 bg-indigo-50" },
  { estado: "COTIZADO", label: "Cotizado", color: "border-yellow-300 bg-yellow-50" },
  { estado: "APROBADO", label: "Aprobado", color: "border-orange-300 bg-orange-50" },
  { estado: "AGREGAR_SKU", label: "Agregar SKU", color: "border-amber-300 bg-amber-50" },
  { estado: "PRIORIDAD", label: "Prioridad", color: "border-red-300 bg-red-50" },
  { estado: "REPARADO", label: "Reparado", color: "border-teal-300 bg-teal-50" },
  { estado: "AVISADO", label: "Avisado", color: "border-cyan-300 bg-cyan-50" },
  { estado: "ENTREGADO", label: "Entregado", color: "border-green-300 bg-green-50" },
];

function estadoToModal(estado: EstadoOS): ModalType | null {
  const map: Partial<Record<EstadoOS, ModalType>> = {
    VALIDACION: "validacion",
    REVISION: "revision",
    DIAG_PRELIMINAR: "diag-preliminar",
    DIAG_FINAL: "diag-final",
    COTIZADO: "cotizado",
    APROBADO: "aprobado",
    AGREGAR_SKU: "agregar-sku",
    PRIORIDAD: "prioridad",
    REPARADO: "reparado",
    AVISADO: "avisado",
    GARANTIA: "garantia",
    DEVOLUCION: "devolucion",
  };
  return map[estado] ?? null;
}

const NEEDS_DETALLE: ModalType[] = [
  "revision",
  "diag-preliminar",
  "diag-final",
  "cotizacion",
  "cotizado",
  "agregar-sku",
  "reparado",
];

function OSCard({ os, onClick }: { os: OrdenServicioResumen; onClick: () => void }) {
  const canalColor =
    os.canal === "DOMICILIO" ? "border-l-4 border-l-green-400" : "border-l-4 border-l-blue-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md ${canalColor}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-xs font-semibold text-primary-600">{os.codigo}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs ${
            os.canal === "DOMICILIO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {os.canal === "DOMICILIO" ? "Dom" : "Tie"}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-neutral-700">{os.cliente_nombre ?? "—"}</p>
      <p className="truncate text-xs text-neutral-400">{os.producto_nombre ?? "—"}</p>
      <p className="mt-0.5 truncate text-xs italic text-neutral-500">{os.falla_ingreso}</p>
      {os.tecnico_nombre && (
        <p className="mt-1 text-xs text-neutral-400">Téc: {os.tecnico_nombre}</p>
      )}
    </button>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
}

export function KanbanServiciosPage() {
  const [selected, setSelected] = useState<{
    orden: OrdenServicioResumen;
    modal: ModalType;
  } | null>(null);

  const { data, isLoading, isError } = useOrdenes({ pageSize: 200 });
  const ordenes = data?.data ?? [];

  const { data: detalleData, isLoading: detalleLoading } = useOrden(selected?.orden.id ?? "");
  const detalle = detalleData?.data;

  function openModal(os: OrdenServicioResumen) {
    const modal = estadoToModal(os.estado);
    if (!modal) return;
    setSelected({ orden: os, modal });
  }

  function closeModal() {
    setSelected(null);
  }

  function handleAbrirCotizacion() {
    setSelected((prev) => (prev ? { ...prev, modal: "cotizacion" } : null));
  }

  function renderModal() {
    if (!selected) return null;
    const { orden, modal } = selected;

    if (NEEDS_DETALLE.includes(modal) && detalleLoading) {
      return <LoadingOverlay />;
    }

    switch (modal) {
      case "validacion":
        return <ModalValidacion orden={orden} onClose={closeModal} />;
      case "revision":
        return (
          <ModalRevision
            orden={orden}
            existingComponentes={detalle?.componentes ?? []}
            onClose={closeModal}
          />
        );
      case "diag-preliminar":
        if (!detalle) return <LoadingOverlay />;
        return <ModalDiagPreliminar orden={detalle} onClose={closeModal} />;
      case "diag-final":
        if (!detalle) return <LoadingOverlay />;
        return (
          <ModalDiagFinal
            orden={detalle}
            onClose={closeModal}
            onAbrirCotizacion={handleAbrirCotizacion}
          />
        );
      case "cotizacion":
        if (!detalle) return <LoadingOverlay />;
        return <ModalCotizacion orden={detalle} onClose={closeModal} />;
      case "cotizado":
        if (!detalle) return <LoadingOverlay />;
        return <ModalCotizado orden={detalle} onClose={closeModal} />;
      case "aprobado":
        return <ModalAprobado orden={orden} onClose={closeModal} />;
      case "agregar-sku":
        if (!detalle) return <LoadingOverlay />;
        return <ModalAgregarSku orden={detalle} onClose={closeModal} />;
      case "prioridad":
        return <ModalPrioridad orden={orden} onClose={closeModal} />;
      case "reparado":
        if (!detalle) return <LoadingOverlay />;
        return <ModalReparado orden={detalle} onClose={closeModal} />;
      case "avisado":
        return <ModalAvisado orden={orden} onClose={closeModal} />;
      case "devolucion":
        return <ModalDevolucion orden={orden} onClose={closeModal} />;
      case "garantia":
        return <ModalGarantia orden={orden} onClose={closeModal} />;
      default:
        return null;
    }
  }

  const byEstado = (estado: EstadoOS) => ordenes.filter((o) => o.estado === estado);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Kanban Servicios</h1>
        <Link
          to="/servicios/nuevo"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nueva OS
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}
      {isError && <p className="py-8 text-center text-sm text-red-600">Error al cargar órdenes.</p>}

      {!isLoading && !isError && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map(({ estado, label, color }) => {
            const items = byEstado(estado);
            return (
              <div
                key={estado}
                className={`flex w-52 shrink-0 flex-col rounded-xl border-2 ${color}`}
                style={{ maxHeight: "calc(100vh - 160px)" }}
              >
                <div className="shrink-0 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    {label}
                  </span>
                  <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-semibold text-neutral-700">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {items.length === 0 && (
                    <p className="py-4 text-center text-xs text-neutral-400">Vacío</p>
                  )}
                  {items.map((os) => (
                    <OSCard key={os.id} os={os} onClick={() => openModal(os)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderModal()}
    </div>
  );
}
