import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2, Wifi, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useSucursales } from "../../sucursales/hooks/useSucursales";
import {
  type PuntoControlDto,
  type TurnoDto,
  useCreatePuntoControl,
  useCreateTurno,
  useDeletePuntoControl,
  useDeleteTurno,
  usePuntosControl,
  useTurnos,
  useUpdatePuntoControl,
  useUpdateTurno,
} from "../hooks/useAsistencia";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";
const ERR = "mt-1 text-xs text-red-600";

const DIAS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;
type Dia = (typeof DIAS)[number];

const DIA_LABEL: Record<Dia, string> = {
  LUN: "L",
  MAR: "M",
  MIE: "X",
  JUE: "J",
  VIE: "V",
  SAB: "S",
  DOM: "D",
};

const turnoSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(100),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  tolerancia_minutos: z.number().int().min(0).max(60),
  dias_laborales: z.array(z.enum(DIAS)).min(1, "Seleccione al menos un día"),
  activo: z.boolean(),
});

type TurnoForm = z.infer<typeof turnoSchema>;

const puntoSchema = z.object({
  sucursal_id: z.string().uuid("Seleccione una sucursal"),
  nombre: z.string().min(1, "Requerido").max(100),
  ssid: z.string().min(1, "Requerido").max(100),
  bssid: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, "Formato MAC (AA:BB:CC:DD:EE:FF)")
    .or(z.literal(""))
    .optional(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  radio_metros: z.number().int().min(1).max(500),
  activo: z.boolean(),
});

type PuntoForm = z.infer<typeof puntoSchema>;

// ─── Modal Turno ──────────────────────────────────────────────────────────────

function ModalTurno({ item, onClose }: { item: TurnoDto | null; onClose: () => void }) {
  const createTurno = useCreateTurno();
  const updateTurno = useUpdateTurno();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TurnoForm>({
    resolver: zodResolver(turnoSchema),
    defaultValues: item
      ? {
          nombre: item.nombre,
          hora_inicio: item.hora_inicio,
          hora_fin: item.hora_fin,
          tolerancia_minutos: item.tolerancia_minutos,
          dias_laborales: item.dias_laborales as Dia[],
          activo: item.activo,
        }
      : {
          tolerancia_minutos: 15,
          dias_laborales: ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"],
          activo: true,
        },
  });

  const diasSel = watch("dias_laborales") ?? [];

  function toggleDia(dia: Dia) {
    if (diasSel.includes(dia)) {
      setValue(
        "dias_laborales",
        diasSel.filter((d) => d !== dia),
        { shouldValidate: true }
      );
    } else {
      setValue("dias_laborales", [...diasSel, dia], { shouldValidate: true });
    }
  }

  async function onSubmit(data: TurnoForm) {
    if (item) {
      await updateTurno.mutateAsync({ id: item.id, ...data });
    } else {
      await createTurno.mutateAsync(data);
    }
    onClose();
  }

  const isPending = createTurno.isPending || updateTurno.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {item ? "Editar turno" : "Nuevo turno"}
          </h2>
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
            <label htmlFor="t-nombre" className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre
            </label>
            <input
              id="t-nombre"
              {...register("nombre")}
              className={INPUT}
              placeholder="Ej: Turno mañana"
            />
            {errors.nombre && <p className={ERR}>{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-inicio" className="mb-1 block text-sm font-medium text-neutral-700">
                Hora inicio
              </label>
              <input id="t-inicio" {...register("hora_inicio")} type="time" className={INPUT} />
              {errors.hora_inicio && <p className={ERR}>{errors.hora_inicio.message}</p>}
            </div>
            <div>
              <label htmlFor="t-fin" className="mb-1 block text-sm font-medium text-neutral-700">
                Hora fin
              </label>
              <input id="t-fin" {...register("hora_fin")} type="time" className={INPUT} />
              {errors.hora_fin && <p className={ERR}>{errors.hora_fin.message}</p>}
            </div>
          </div>

          <div>
            <label
              htmlFor="t-tolerancia"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Tolerancia (minutos)
            </label>
            <input
              id="t-tolerancia"
              {...register("tolerancia_minutos", { valueAsNumber: true })}
              type="number"
              min={0}
              max={60}
              className={INPUT}
            />
            {errors.tolerancia_minutos && (
              <p className={ERR}>{errors.tolerancia_minutos.message}</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Días laborales</p>
            <div className="flex gap-1.5">
              {DIAS.map((dia) => {
                const activo = diasSel.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(dia)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      activo
                        ? "bg-primary-600 text-white"
                        : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    {DIA_LABEL[dia]}
                  </button>
                );
              })}
            </div>
            {errors.dias_laborales && <p className={ERR}>{errors.dias_laborales.message}</p>}
          </div>

          {item && (
            <div className="flex items-center gap-2">
              <input {...register("activo")} type="checkbox" id="t-activo" />
              <label htmlFor="t-activo" className="text-sm text-neutral-700">
                Activo
              </label>
            </div>
          )}

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
              disabled={isPending}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Punto de Control ───────────────────────────────────────────────────

function ModalPuntoControl({
  item,
  onClose,
}: {
  item: PuntoControlDto | null;
  onClose: () => void;
}) {
  const createPunto = useCreatePuntoControl();
  const updatePunto = useUpdatePuntoControl();
  const { data: sucursalesData } = useSucursales({ activo: true, pageSize: 100 });
  const sucursales = sucursalesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PuntoForm>({
    resolver: zodResolver(puntoSchema),
    defaultValues: item
      ? {
          sucursal_id: item.sucursal_id,
          nombre: item.nombre,
          ssid: item.ssid,
          bssid: item.bssid ?? "",
          latitud: item.latitud,
          longitud: item.longitud,
          radio_metros: item.radio_metros,
          activo: item.activo,
        }
      : { radio_metros: 50, activo: true },
  });

  const latitud = useWatch({ control, name: "latitud" });
  const longitud = useWatch({ control, name: "longitud" });

  const hasCoords =
    latitud !== undefined &&
    longitud !== undefined &&
    !Number.isNaN(Number(latitud)) &&
    !Number.isNaN(Number(longitud));

  async function onSubmit(data: PuntoForm) {
    const payload = { ...data, bssid: data.bssid && data.bssid !== "" ? data.bssid : null };
    if (item) {
      await updatePunto.mutateAsync({ id: item.id, ...payload });
    } else {
      await createPunto.mutateAsync(payload);
    }
    onClose();
  }

  const isPending = createPunto.isPending || updatePunto.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {item ? "Editar punto de control" : "Nuevo punto de control"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-4 p-6">
            <div>
              <label
                htmlFor="p-sucursal"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Sucursal
              </label>
              <select id="p-sucursal" {...register("sucursal_id")} className={SELECT}>
                <option value="">Seleccionar…</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errors.sucursal_id && <p className={ERR}>{errors.sucursal_id.message}</p>}
            </div>

            <div>
              <label htmlFor="p-nombre" className="mb-1 block text-sm font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="p-nombre"
                {...register("nombre")}
                className={INPUT}
                placeholder="Ej: Recepción principal"
              />
              {errors.nombre && <p className={ERR}>{errors.nombre.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-ssid" className="mb-1 block text-sm font-medium text-neutral-700">
                  SSID (red WiFi)
                </label>
                <input
                  id="p-ssid"
                  {...register("ssid")}
                  className={INPUT}
                  placeholder="NombreRed"
                />
                {errors.ssid && <p className={ERR}>{errors.ssid.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="p-bssid"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  BSSID (MAC router)
                </label>
                <input
                  id="p-bssid"
                  {...register("bssid")}
                  className={INPUT}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
                {errors.bssid && <p className={ERR}>{errors.bssid.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-lat" className="mb-1 block text-sm font-medium text-neutral-700">
                  Latitud
                </label>
                <input
                  id="p-lat"
                  {...register("latitud", { valueAsNumber: true })}
                  type="number"
                  step="0.00000001"
                  className={INPUT}
                  placeholder="-12.04318"
                />
                {errors.latitud && <p className={ERR}>{errors.latitud.message}</p>}
              </div>
              <div>
                <label htmlFor="p-lng" className="mb-1 block text-sm font-medium text-neutral-700">
                  Longitud
                </label>
                <input
                  id="p-lng"
                  {...register("longitud", { valueAsNumber: true })}
                  type="number"
                  step="0.00000001"
                  className={INPUT}
                  placeholder="-77.02824"
                />
                {errors.longitud && <p className={ERR}>{errors.longitud.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="p-radio" className="mb-1 block text-sm font-medium text-neutral-700">
                Radio (metros)
              </label>
              <input
                id="p-radio"
                {...register("radio_metros", { valueAsNumber: true })}
                type="number"
                min={1}
                max={500}
                className={INPUT}
              />
              {errors.radio_metros && <p className={ERR}>{errors.radio_metros.message}</p>}
            </div>

            {hasCoords && (
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-700">Vista en mapa</p>
                <iframe
                  title="Mapa punto de control"
                  className="h-48 w-full rounded-lg border border-neutral-200"
                  src={`https://maps.google.com/maps?q=${latitud},${longitud}&z=17&output=embed`}
                  loading="lazy"
                />
                <a
                  href={`https://www.google.com/maps?q=${latitud},${longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  Abrir en Google Maps
                </a>
              </div>
            )}

            {item && (
              <div className="flex items-center gap-2">
                <input {...register("activo")} type="checkbox" id="p-activo" />
                <label htmlFor="p-activo" className="text-sm text-neutral-700">
                  Activo
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ConfiguracionAsistenciaPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"turnos" | "puntos">("turnos");

  const [editTurno, setEditTurno] = useState<TurnoDto | null>(null);
  const [showCreateTurno, setShowCreateTurno] = useState(false);
  const [deleteTurno, setDeleteTurno] = useState<TurnoDto | null>(null);

  const [editPunto, setEditPunto] = useState<PuntoControlDto | null>(null);
  const [showCreatePunto, setShowCreatePunto] = useState(false);
  const [deletePunto, setDeletePunto] = useState<PuntoControlDto | null>(null);

  const { data: turnosData, isLoading: loadingTurnos } = useTurnos();
  const { data: puntosData, isLoading: loadingPuntos } = usePuntosControl();
  const deleteTurnoMut = useDeleteTurno();
  const deletePuntoMut = useDeletePuntoControl();

  const turnos = turnosData?.data ?? [];
  const puntos = puntosData?.data ?? [];

  if (!user || user.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Configuración de asistencia</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setTab("turnos")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "turnos" ? "bg-primary-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          Turnos
        </button>
        <button
          type="button"
          onClick={() => setTab("puntos")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "puntos" ? "bg-primary-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Wifi className="h-4 w-4" />
          Puntos de control
        </button>
      </div>

      {/* Tab Turnos */}
      {tab === "turnos" && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="font-medium text-neutral-900">Turnos de trabajo</h2>
            <button
              type="button"
              onClick={() => setShowCreateTurno(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo turno
            </button>
          </div>

          {loadingTurnos ? (
            <div className="py-16 text-center text-sm text-neutral-500">Cargando…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Horario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Tolerancia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Días
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-500">
                      Sin turnos configurados.
                    </td>
                  </tr>
                )}
                {turnos.map((turno) => (
                  <tr key={turno.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{turno.nombre}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {turno.hora_inicio} – {turno.hora_fin}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{turno.tolerancia_minutos} min</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {DIAS.map((dia) => (
                          <span
                            key={dia}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${
                              turno.dias_laborales.includes(dia)
                                ? "bg-primary-100 text-primary-700"
                                : "bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            {DIA_LABEL[dia]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          turno.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {turno.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTurno(turno)}
                          className="text-neutral-400 hover:text-primary-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTurno(turno)}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab Puntos de control */}
      {tab === "puntos" && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="font-medium text-neutral-900">Puntos de control WiFi</h2>
            <button
              type="button"
              onClick={() => setShowCreatePunto(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo punto
            </button>
          </div>

          {loadingPuntos ? (
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
                      Sucursal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                      SSID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                      BSSID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                      Coordenadas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                      Radio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                      Estado
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {puntos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-neutral-500">
                        Sin puntos configurados.
                      </td>
                    </tr>
                  )}
                  {puntos.map((punto) => (
                    <tr key={punto.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{punto.nombre}</td>
                      <td className="px-4 py-3 text-neutral-600">{punto.sucursal_nombre ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">{punto.ssid}</td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                        {punto.bssid ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                        {punto.latitud.toFixed(5)}, {punto.longitud.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{punto.radio_metros} m</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            punto.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {punto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditPunto(punto)}
                            className="text-neutral-400 hover:text-primary-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePunto(punto)}
                            className="text-neutral-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Modales turnos */}
      {(showCreateTurno || editTurno) && (
        <ModalTurno
          item={editTurno}
          onClose={() => {
            setShowCreateTurno(false);
            setEditTurno(null);
          }}
        />
      )}

      {/* Modales puntos */}
      {(showCreatePunto || editPunto) && (
        <ModalPuntoControl
          item={editPunto}
          onClose={() => {
            setShowCreatePunto(false);
            setEditPunto(null);
          }}
        />
      )}

      {/* Confirm delete turno */}
      {deleteTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">Eliminar turno</h3>
            <p className="mt-2 text-sm text-neutral-600">
              ¿Eliminar el turno{" "}
              <span className="font-medium">&ldquo;{deleteTurno.nombre}&rdquo;</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTurno(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteTurnoMut.isPending}
                onClick={async () => {
                  await deleteTurnoMut.mutateAsync(deleteTurno.id);
                  setDeleteTurno(null);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTurnoMut.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete punto */}
      {deletePunto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">Eliminar punto de control</h3>
            <p className="mt-2 text-sm text-neutral-600">
              ¿Eliminar <span className="font-medium">&ldquo;{deletePunto.nombre}&rdquo;</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletePunto(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletePuntoMut.isPending}
                onClick={async () => {
                  await deletePuntoMut.mutateAsync(deletePunto.id);
                  setDeletePunto(null);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePuntoMut.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
