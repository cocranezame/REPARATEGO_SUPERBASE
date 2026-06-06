import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, UserCheck, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import {
  useAsistenciaHoy,
  useRegistroManual,
  useTrabajadores,
  useTurnos,
} from "../hooks/useAsistencia";
import type { AsistenciaHoyRegistroDto } from "../types/asistencia";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const ERR = "mt-1 text-xs text-red-600";

const registroSchema = z.object({
  usuario_id: z.string().uuid("Seleccione un trabajador"),
  tipo_evento: z.enum(["ENTRADA", "SALIDA", "BREAK_INICIO", "BREAK_FIN"]),
  fecha_hora: z.string().min(1, "Requerido"),
  observacion: z.string().max(500).optional(),
});

type RegistroForm = z.infer<typeof registroSchema>;

// ─── Badge estado ─────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<AsistenciaHoyRegistroDto["estado"], { cls: string; label: string }> = {
  PRESENTE: { cls: "bg-green-100 text-green-700", label: "Presente" },
  TARDANZA: { cls: "bg-yellow-100 text-yellow-700", label: "Tardanza" },
  FALTA: { cls: "bg-red-100 text-red-700", label: "Falta" },
  PERMISO: { cls: "bg-blue-100 text-blue-700", label: "Permiso" },
  DESCANSO: { cls: "bg-neutral-100 text-neutral-600", label: "Descanso" },
};

function nowLocalISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// ─── Modal registro manual ────────────────────────────────────────────────────

function ModalRegistroManual({ onClose }: { onClose: () => void }) {
  const registroManual = useRegistroManual();
  const { data: trabajadoresData } = useTrabajadores();
  const trabajadores = trabajadoresData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: { tipo_evento: "ENTRADA", fecha_hora: nowLocalISO() },
  });

  async function onSubmit(data: RegistroForm) {
    await registroManual.mutateAsync({
      ...data,
      fecha_hora: new Date(data.fecha_hora).toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Registrar manual</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="rm-trabajador"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Trabajador
            </label>
            <select id="rm-trabajador" {...register("usuario_id")} className={SELECT}>
              <option value="">Seleccionar…</option>
              {trabajadores.map((t) => (
                <option key={t.usuario_id} value={t.usuario_id}>
                  {t.usuario_nombre} {t.usuario_apellidos}
                </option>
              ))}
            </select>
            {errors.usuario_id && <p className={ERR}>{errors.usuario_id.message}</p>}
          </div>

          <div>
            <label htmlFor="rm-tipo" className="mb-1 block text-sm font-medium text-neutral-700">
              Tipo evento
            </label>
            <select id="rm-tipo" {...register("tipo_evento")} className={SELECT}>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="BREAK_INICIO">Inicio break</option>
              <option value="BREAK_FIN">Fin break</option>
            </select>
            {errors.tipo_evento && <p className={ERR}>{errors.tipo_evento.message}</p>}
          </div>

          <div>
            <label htmlFor="rm-fecha" className="mb-1 block text-sm font-medium text-neutral-700">
              Fecha y hora
            </label>
            <input
              id="rm-fecha"
              {...register("fecha_hora")}
              type="datetime-local"
              className={INPUT}
            />
            {errors.fecha_hora && <p className={ERR}>{errors.fecha_hora.message}</p>}
          </div>

          <div>
            <label htmlFor="rm-obs" className="mb-1 block text-sm font-medium text-neutral-700">
              Observación
            </label>
            <textarea
              id="rm-obs"
              {...register("observacion")}
              rows={2}
              className={INPUT}
              placeholder="Motivo del registro manual…"
            />
            {errors.observacion && <p className={ERR}>{errors.observacion.message}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registroManual.isPending}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {registroManual.isPending ? "Registrando…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function PanelHoyPage() {
  const user = useAuthStore((s) => s.user);
  const [turnoFiltro, setTurnoFiltro] = useState("");
  const [sucursalFiltro, setSucursalFiltro] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, dataUpdatedAt } = useAsistenciaHoy({
    turno_id: turnoFiltro || undefined,
    sucursal_id: sucursalFiltro || undefined,
  });
  const { data: turnosData } = useTurnos();
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });

  const turnos = turnosData?.data ?? [];
  const sucursales = sucursalesData?.data ?? [];
  const hoy = data?.data;

  if (!user || user.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;

  const fechaStr = hoy?.fecha
    ? new Date(hoy.fecha).toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const updateStr = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold capitalize text-neutral-900">{fechaStr}</h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <RefreshCw className="h-3 w-3" />
            Actualizado a las {updateStr} · refresca cada 60s
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <UserCheck className="h-4 w-4" />
          Registrar manual
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Presentes</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-green-700">{hoy?.presentes ?? 0}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Tardanzas</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-700">{hoy?.tardanzas ?? 0}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">Faltas</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-700">{hoy?.faltas ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Con permiso</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700">{hoy?.con_permiso ?? 0}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-3">
        <select
          value={turnoFiltro}
          onChange={(e) => setTurnoFiltro(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todos los turnos</option>
          {turnos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          value={sucursalFiltro}
          onChange={(e) => setSucursalFiltro(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-500">Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Turno
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Entrada prog.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Entrada real
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Salida real
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                    Tardanza
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(!hoy || hoy.registros.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-500">
                      Sin registros para hoy.
                    </td>
                  </tr>
                )}
                {hoy?.registros.map((reg) => {
                  const badge = ESTADO_BADGE[reg.estado] ?? {
                    cls: "bg-neutral-100 text-neutral-600",
                    label: reg.estado,
                  };
                  return (
                    <tr key={reg.usuario_id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{reg.nombre}</td>
                      <td className="px-4 py-3 text-neutral-600">{reg.turno_nombre}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-neutral-600">
                        {reg.hora_inicio_prog}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-neutral-700">
                        {reg.hora_entrada_real ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-neutral-700">
                        {reg.hora_salida_real ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-neutral-600">
                        {reg.minutos_tardanza > 0 ? (
                          <span className="font-medium text-yellow-700">
                            {reg.minutos_tardanza} min
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <ModalRegistroManual onClose={() => setShowModal(false)} />}
    </div>
  );
}
