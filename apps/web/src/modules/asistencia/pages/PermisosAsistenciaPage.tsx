import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, DollarSign, Plus, X, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  type PermisoDto,
  useAprobarPermiso,
  useCreatePermiso,
  usePermisos,
  useRechazarPermiso,
  useTrabajadores,
} from "../hooks/useAsistencia";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const ERR = "mt-1 text-xs text-red-600";

const TIPOS_PERMISO = [
  { value: "MEDICO", label: "Médico" },
  { value: "PERSONAL", label: "Personal" },
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "CAPACITACION", label: "Capacitación" },
  { value: "LICENCIA", label: "Licencia" },
  { value: "OTRO", label: "Otro" },
] as const;

type TipoPermiso = (typeof TIPOS_PERMISO)[number]["value"];

const ESTADO_BADGE: Record<PermisoDto["estado"], { cls: string; label: string }> = {
  PENDIENTE: { cls: "bg-yellow-100 text-yellow-700", label: "Pendiente" },
  APROBADO: { cls: "bg-green-100 text-green-700", label: "Aprobado" },
  RECHAZADO: { cls: "bg-red-100 text-red-700", label: "Rechazado" },
};

const TIPO_BADGE: Record<TipoPermiso, string> = {
  MEDICO: "bg-blue-100 text-blue-700",
  PERSONAL: "bg-neutral-100 text-neutral-600",
  VACACIONES: "bg-green-100 text-green-700",
  CAPACITACION: "bg-purple-100 text-purple-700",
  LICENCIA: "bg-orange-100 text-orange-700",
  OTRO: "bg-neutral-100 text-neutral-500",
};

// ─── Schema formulario ────────────────────────────────────────────────────────

const permisoSchema = z.object({
  usuario_id: z.string().uuid("Seleccione un trabajador"),
  tipo_permiso: z.enum(["MEDICO", "PERSONAL", "VACACIONES", "CAPACITACION", "LICENCIA", "OTRO"], {
    message: "Seleccione un tipo",
  }),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Requerido"),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Requerido"),
  motivo: z.string().min(1, "Requerido").max(1000),
  archivo_url: z.string().url("URL inválida").or(z.literal("")).optional(),
  afecta_pago: z.boolean().default(false),
});

type PermisoForm = z.infer<typeof permisoSchema>;

// ─── Modal nuevo permiso ──────────────────────────────────────────────────────

function ModalNuevoPermiso({ onClose }: { onClose: () => void }) {
  const createPermiso = useCreatePermiso();
  const { data: trabajadoresData } = useTrabajadores();
  const trabajadores = trabajadoresData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PermisoForm>({
    resolver: zodResolver(permisoSchema),
    defaultValues: { afecta_pago: false },
  });

  async function onSubmit(data: PermisoForm) {
    await createPermiso.mutateAsync({
      ...data,
      archivo_url: data.archivo_url && data.archivo_url !== "" ? data.archivo_url : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Nuevo permiso</h2>
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
              htmlFor="pm-trabajador"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Trabajador
            </label>
            <select id="pm-trabajador" {...register("usuario_id")} className={SELECT}>
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
            <label htmlFor="pm-tipo" className="mb-1 block text-sm font-medium text-neutral-700">
              Tipo permiso
            </label>
            <select id="pm-tipo" {...register("tipo_permiso")} className={SELECT}>
              <option value="">Seleccionar…</option>
              {TIPOS_PERMISO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.tipo_permiso && <p className={ERR}>{errors.tipo_permiso.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pm-inicio"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Fecha inicio
              </label>
              <input id="pm-inicio" {...register("fecha_inicio")} type="date" className={INPUT} />
              {errors.fecha_inicio && <p className={ERR}>{errors.fecha_inicio.message}</p>}
            </div>
            <div>
              <label htmlFor="pm-fin" className="mb-1 block text-sm font-medium text-neutral-700">
                Fecha fin
              </label>
              <input id="pm-fin" {...register("fecha_fin")} type="date" className={INPUT} />
              {errors.fecha_fin && <p className={ERR}>{errors.fecha_fin.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="pm-motivo" className="mb-1 block text-sm font-medium text-neutral-700">
              Motivo
            </label>
            <textarea
              id="pm-motivo"
              {...register("motivo")}
              rows={3}
              className={INPUT}
              placeholder="Descripción del motivo…"
            />
            {errors.motivo && <p className={ERR}>{errors.motivo.message}</p>}
          </div>

          <div>
            <label htmlFor="pm-archivo" className="mb-1 block text-sm font-medium text-neutral-700">
              URL adjunto (opcional)
            </label>
            <input
              id="pm-archivo"
              {...register("archivo_url")}
              className={INPUT}
              placeholder="https://…"
              type="url"
            />
            {errors.archivo_url && <p className={ERR}>{errors.archivo_url.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input {...register("afecta_pago")} type="checkbox" id="pm-afecta" />
            <label htmlFor="pm-afecta" className="text-sm text-neutral-700">
              Afecta pago
            </label>
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
              disabled={createPermiso.isPending}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createPermiso.isPending ? "Enviando…" : "Solicitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal detalle / aprobar-rechazar ─────────────────────────────────────────

function ModalDetalle({ permiso, onClose }: { permiso: PermisoDto; onClose: () => void }) {
  const aprobar = useAprobarPermiso();
  const rechazar = useRechazarPermiso();
  const [showRechazo, setShowRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const badge = ESTADO_BADGE[permiso.estado];
  const tipoBadge =
    TIPO_BADGE[permiso.tipo_permiso as TipoPermiso] ?? "bg-neutral-100 text-neutral-500";
  const tipoLabel =
    TIPOS_PERMISO.find((t) => t.value === permiso.tipo_permiso)?.label ?? permiso.tipo_permiso;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Detalle de permiso</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadge}`}
            >
              {tipoLabel}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
            >
              {badge.label}
            </span>
            {permiso.afecta_pago && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                <DollarSign className="h-3 w-3" />
                Afecta pago
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Trabajador</span>
              <span className="font-medium">{permiso.nombre ?? permiso.usuario_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Período</span>
              <span>
                {permiso.fecha_inicio} → {permiso.fecha_fin}
              </span>
            </div>
            <div>
              <p className="text-neutral-500">Motivo</p>
              <p className="mt-0.5 text-neutral-800">{permiso.motivo}</p>
            </div>
            {permiso.archivo_url && (
              <div>
                <p className="text-neutral-500">Adjunto</p>
                <a
                  href={permiso.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-primary-600 hover:underline"
                >
                  Ver archivo
                </a>
              </div>
            )}
            {permiso.estado !== "PENDIENTE" && permiso.aprobado_por_nombre && (
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {permiso.estado === "APROBADO" ? "Aprobado por" : "Rechazado por"}
                </span>
                <span>{permiso.aprobado_por_nombre}</span>
              </div>
            )}
            {permiso.estado === "RECHAZADO" && permiso.motivo_rechazo && (
              <div>
                <p className="text-neutral-500">Motivo rechazo</p>
                <p className="mt-0.5 text-red-700">{permiso.motivo_rechazo}</p>
              </div>
            )}
          </div>

          {permiso.estado === "PENDIENTE" && !showRechazo && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={aprobar.isPending}
                onClick={async () => {
                  await aprobar.mutateAsync(permiso.id);
                  onClose();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {aprobar.isPending ? "Aprobando…" : "Aprobar"}
              </button>
              <button
                type="button"
                onClick={() => setShowRechazo(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </div>
          )}

          {showRechazo && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <label
                htmlFor="motivo-rechazo"
                className="block text-sm font-medium text-neutral-700"
              >
                Motivo de rechazo (opcional)
              </label>
              <textarea
                id="motivo-rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={2}
                className={INPUT}
                placeholder="Descripción…"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRechazo(false)}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={rechazar.isPending}
                  onClick={async () => {
                    await rechazar.mutateAsync({
                      id: permiso.id,
                      motivo_rechazo: motivoRechazo || undefined,
                    });
                    onClose();
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {rechazar.isPending ? "Rechazando…" : "Confirmar rechazo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function PermisosAsistenciaPage() {
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<PermisoDto | null>(null);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const { data, isLoading } = usePermisos({
    estado: filtroEstado as PermisoDto["estado"] | undefined,
    tipo_permiso: filtroTipo || undefined,
    fecha_desde: filtroDesde || undefined,
    fecha_hasta: filtroHasta || undefined,
  });

  const permisos = data?.data ?? [];

  if (!user || user.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Permisos y justificaciones</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo permiso
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-3">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_PERMISO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            placeholder="Desde"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-500">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Trabajador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Fecha inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Fecha fin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Motivo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                  Pago
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Aprobado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {permisos.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-neutral-500">
                    Sin permisos.
                  </td>
                </tr>
              )}
              {permisos.map((p) => {
                const badge = ESTADO_BADGE[p.estado];
                const tipoCls =
                  TIPO_BADGE[p.tipo_permiso as TipoPermiso] ?? "bg-neutral-100 text-neutral-500";
                const tipoLabel =
                  TIPOS_PERMISO.find((t) => t.value === p.tipo_permiso)?.label ?? p.tipo_permiso;
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {p.nombre ?? p.usuario_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tipoCls}`}
                      >
                        {tipoLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.fecha_inicio}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.fecha_fin}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-neutral-600">{p.motivo}</td>
                    <td className="px-4 py-3 text-center">
                      {p.afecta_pago ? (
                        <DollarSign className="mx-auto h-4 w-4 text-orange-500" />
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{p.aprobado_por_nombre ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <ModalNuevoPermiso onClose={() => setShowCreate(false)} />}
      {selected && <ModalDetalle permiso={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
