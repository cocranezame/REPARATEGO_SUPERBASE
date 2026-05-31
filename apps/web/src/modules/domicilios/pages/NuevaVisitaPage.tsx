import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import { useCreateVisitaDomicilio, useTarifasDistrito } from "../hooks/useDomicilios";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

export function NuevaVisitaPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const [searchCliente, setSearchCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [direccionTexto, setDireccionTexto] = useState("");
  const [distrito, setDistrito] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivoVisita, setMotivoVisita] = useState("");
  const [notas, setNotas] = useState("");
  const [tarifaAuto, setTarifaAuto] = useState<string | null>(null);

  const { data: clientesData } = useClientes({
    ...(searchCliente ? { search: searchCliente } : {}),
    pageSize: 50,
  });
  const { data: tarifasData } = useTarifasDistrito({ activo: true });
  const { data: tecnicosData } = useUsuarios({ rol: "TECNICO", activo: true, pageSize: 200 });

  const createMutation = useCreateVisitaDomicilio();

  useEffect(() => {
    if (!distrito) {
      setTarifaAuto(null);
      return;
    }
    const tarifa = tarifasData?.data.find((t) => t.distrito === distrito);
    setTarifaAuto(tarifa ? tarifa.tarifa : null);
  }, [distrito, tarifasData]);

  function canSubmit() {
    return clienteId !== "" && direccionTexto !== "" && distrito !== "" && fechaProgramada !== "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit()) return;
    setServerError(null);
    createMutation.mutate(
      {
        cliente_id: clienteId,
        direccion_texto: direccionTexto,
        distrito,
        fecha_programada: fechaProgramada,
        ...(tecnicoId ? { tecnico_id: tecnicoId } : {}),
        ...(horaInicio ? { hora_inicio: horaInicio } : {}),
        ...(horaFin ? { hora_fin: horaFin } : {}),
        ...(motivoVisita ? { motivo_visita: motivoVisita } : {}),
        ...(notas ? { notas } : {}),
      },
      {
        onSuccess: () => navigate("/domicilios"),
        onError: (e) => setServerError(e.message),
      }
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-neutral-900">Agendar visita a domicilio</h1>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
      >
        {/* Cliente */}
        <div>
          <label
            htmlFor="search_cliente"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Buscar cliente
          </label>
          <input
            id="search_cliente"
            type="text"
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            placeholder="Nombre o documento…"
            className={INPUT}
          />
          {clientesData && clientesData.data.length > 0 && clienteId === "" && (
            <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-white text-sm shadow">
              {clientesData.data.map((c) => {
                const nombre = c.razon_social ?? `${c.nombres} ${c.apellidos}`.trim();
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-primary-50"
                      onClick={() => {
                        setClienteId(c.id);
                        setClienteNombre(nombre);
                        setSearchCliente("");
                      }}
                    >
                      {nombre}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {clienteId !== "" && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-primary-700">{clienteNombre}</span>
              <button
                type="button"
                onClick={() => {
                  setClienteId("");
                  setClienteNombre("");
                }}
                className="text-xs text-neutral-400 underline"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Dirección */}
        <div>
          <label
            htmlFor="direccion_texto"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Dirección *
          </label>
          <input
            id="direccion_texto"
            type="text"
            value={direccionTexto}
            onChange={(e) => setDireccionTexto(e.target.value)}
            placeholder="Av. Los Pinos 123, Dpto 301"
            required
            className={INPUT}
          />
        </div>

        {/* Distrito */}
        <div>
          <label htmlFor="distrito" className="mb-1 block text-sm font-medium text-neutral-700">
            Distrito *
          </label>
          <select
            id="distrito"
            value={distrito}
            onChange={(e) => setDistrito(e.target.value)}
            required
            className={SELECT}
          >
            <option value="">Seleccionar distrito…</option>
            {tarifasData?.data.map((t) => (
              <option key={t.id} value={t.distrito}>
                {t.distrito}
              </option>
            ))}
          </select>
          {tarifaAuto !== null && (
            <p className="mt-1 text-xs text-green-700">
              Tarifa automática: S/ {Number(tarifaAuto).toFixed(2)}
            </p>
          )}
          {distrito !== "" && tarifaAuto === null && (
            <p className="mt-1 text-xs text-yellow-700">
              Sin tarifa registrada para este distrito (se usará S/ 0.00)
            </p>
          )}
        </div>

        {/* Técnico */}
        <div>
          <label htmlFor="tecnico_id" className="mb-1 block text-sm font-medium text-neutral-700">
            Técnico asignado
          </label>
          <select
            id="tecnico_id"
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
            className={SELECT}
          >
            <option value="">Sin asignar</option>
            {tecnicosData?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombres} {u.apellidos}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y horas */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="fecha_programada"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Fecha *
            </label>
            <input
              id="fecha_programada"
              type="date"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
              required
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="hora_inicio"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Hora inicio
            </label>
            <input
              id="hora_inicio"
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="hora_fin" className="mb-1 block text-sm font-medium text-neutral-700">
              Hora fin
            </label>
            <input
              id="hora_fin"
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        {/* Motivo */}
        <div>
          <label
            htmlFor="motivo_visita"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Motivo de la visita
          </label>
          <textarea
            id="motivo_visita"
            rows={2}
            value={motivoVisita}
            onChange={(e) => setMotivoVisita(e.target.value)}
            placeholder="Descripción del problema o motivo…"
            className={INPUT}
          />
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notas" className="mb-1 block text-sm font-medium text-neutral-700">
            Notas internas
          </label>
          <textarea
            id="notas"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className={INPUT}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit() || createMutation.isPending}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Agendando…" : "Agendar visita"}
          </button>
        </div>
      </form>
    </div>
  );
}
