import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "../../clientes/hooks/useClientes";
import {
  useCostosRevision,
  useCreateInstancia,
  useCreateOrden,
  useInstancias,
} from "../hooks/useOrdenesServicio";
import type { Instancia } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none";

const PASOS = ["Cliente", "Instancia", "Orden", "Confirmar"];

type TipoServicio = "CORRECTIVO" | "PREVENTIVO" | "MIXTO";
type Canal = "TIENDA" | "DOMICILIO";

export function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  // Step 0 — Cliente
  const [searchCliente, setSearchCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");

  // Step 1 — Instancia
  const [instancia, setInstancia] = useState<Instancia | null>(null);
  const [showNewInstancia, setShowNewInstancia] = useState(false);
  const [newProductoId, setNewProductoId] = useState("");
  const [newNumeroSerie, setNewNumeroSerie] = useState("");

  // Step 2 — Orden
  const [fallaIngreso, setFallaIngreso] = useState("");
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("CORRECTIVO");
  const [canal, setCanal] = useState<Canal>("TIENDA");

  // Hooks
  const { data: clientesData } = useClientes({
    ...(searchCliente ? { search: searchCliente } : {}),
    pageSize: 50,
  });
  const { data: instanciasData, isLoading: instanciasLoading } = useInstancias({
    cliente_id: clienteId,
    pageSize: 50,
  });
  const { data: costosData } = useCostosRevision();
  const createInstancia = useCreateInstancia();
  const createOrden = useCreateOrden();

  const instancias = instanciasData?.data ?? [];
  const costos = costosData?.data ?? [];

  const costoRevision = instancia?.categoria_id
    ? (costos.find((c) => c.categoria_id === instancia.categoria_id)?.monto ?? "0")
    : "0";

  function canAdvance(): boolean {
    if (paso === 0) return clienteId !== "";
    if (paso === 1) return instancia !== null;
    if (paso === 2) return fallaIngreso.trim() !== "";
    return true;
  }

  async function handleCrearInstancia() {
    if (!newProductoId) {
      setServerError("El ID de producto es obligatorio");
      return;
    }
    setServerError(null);
    try {
      const result = await createInstancia.mutateAsync({
        cliente_id: clienteId,
        producto_id: newProductoId,
        ...(newNumeroSerie ? { numero_serie: newNumeroSerie } : {}),
      });
      setInstancia(result.data);
      setShowNewInstancia(false);
      setNewProductoId("");
      setNewNumeroSerie("");
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function handleConfirmar() {
    if (!instancia) return;
    setServerError(null);
    try {
      const result = await createOrden.mutateAsync({
        instancia_id: instancia.id,
        canal,
        tipo_servicio: tipoServicio,
        falla_ingreso: fallaIngreso,
        costo_revision: parseFloat(costoRevision),
      });
      navigate(`/servicios/${result.data.id}`);
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (paso > 0 ? setPaso((p) => p - 1) : navigate("/servicios"))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-neutral-900">Nueva orden de servicio</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {PASOS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < paso
                  ? "bg-green-500 text-white"
                  : i === paso
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {i < paso ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`hidden text-xs sm:block ${
                i === paso ? "font-medium text-neutral-900" : "text-neutral-400"
              }`}
            >
              {label}
            </span>
            {i < PASOS.length - 1 && <div className="h-px w-6 bg-neutral-200" />}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        {/* Step 0 — Cliente */}
        {paso === 0 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Seleccionar cliente</h2>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="nueva-search-cliente"
                className="text-xs font-medium text-neutral-700"
              >
                Buscar cliente
              </label>
              <input
                id="nueva-search-cliente"
                type="text"
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                placeholder="Nombre, documento, teléfono..."
                className={INPUT}
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
              {(clientesData?.data ?? []).length === 0 && (
                <p className="py-6 text-center text-xs text-neutral-400">
                  {searchCliente ? "Sin resultados" : "Escribe para buscar clientes"}
                </p>
              )}
              {(clientesData?.data ?? []).map((c) => {
                const nombre =
                  c.tipo_persona === "JURIDICA"
                    ? (c.razon_social ?? "—")
                    : [c.nombres, c.apellidos].filter(Boolean).join(" ") || "—";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClienteId(c.id);
                      setClienteNombre(nombre);
                      setInstancia(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      clienteId === c.id
                        ? "bg-primary-50 text-primary-800"
                        : "text-neutral-800 hover:bg-neutral-50"
                    }`}
                  >
                    <span className="font-medium">{nombre}</span>
                    <span className="ml-2 text-xs text-neutral-400">{c.numero_documento}</span>
                  </button>
                );
              })}
            </div>
            {clienteId && (
              <p className="text-xs font-medium text-primary-700">Seleccionado: {clienteNombre}</p>
            )}
          </>
        )}

        {/* Step 1 — Instancia */}
        {paso === 1 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Equipo del cliente</h2>
            <p className="text-xs text-neutral-500">
              Selecciona un equipo existente de {clienteNombre} o registra uno nuevo.
            </p>

            {instanciasLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              </div>
            )}

            {!instanciasLoading && instancias.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                {instancias.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      setInstancia(inst);
                      setShowNewInstancia(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      instancia?.id === inst.id
                        ? "bg-primary-50 text-primary-800"
                        : "text-neutral-800 hover:bg-neutral-50"
                    }`}
                  >
                    <p className="font-medium">{inst.producto_nombre ?? "Producto desconocido"}</p>
                    <div className="flex gap-3 text-xs text-neutral-500">
                      {inst.numero_serie && <span>S/N: {inst.numero_serie}</span>}
                      <span className="text-xs text-neutral-400">
                        {new Date(inst.created_at).toLocaleDateString("es-PE")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!instanciasLoading && instancias.length === 0 && !showNewInstancia && (
              <p className="text-sm text-neutral-400">Este cliente no tiene equipos registrados.</p>
            )}

            {!showNewInstancia ? (
              <button
                type="button"
                onClick={() => setShowNewInstancia(true)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Registrar nuevo equipo
              </button>
            ) : (
              <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Nuevo equipo</h3>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="inst-producto-id"
                    className="text-xs font-medium text-neutral-700"
                  >
                    ID de Producto (UUID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="inst-producto-id"
                    type="text"
                    value={newProductoId}
                    onChange={(e) => setNewProductoId(e.target.value)}
                    placeholder="UUID del modelo de dispositivo"
                    className={INPUT}
                  />
                  <p className="text-xs text-neutral-400">
                    Ingresa el UUID del modelo de producto del catálogo
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="inst-serie" className="text-xs font-medium text-neutral-700">
                    Número de serie
                  </label>
                  <input
                    id="inst-serie"
                    type="text"
                    value={newNumeroSerie}
                    onChange={(e) => setNewNumeroSerie(e.target.value)}
                    placeholder="Opcional"
                    className={INPUT}
                  />
                </div>
                {serverError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {serverError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewInstancia(false);
                      setServerError(null);
                    }}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={createInstancia.isPending}
                    onClick={handleCrearInstancia}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {createInstancia.isPending ? "Creando..." : "Crear equipo"}
                  </button>
                </div>
              </div>
            )}

            {instancia && (
              <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                <span className="font-medium">Equipo seleccionado:</span>{" "}
                {instancia.producto_nombre ?? "Equipo"}{" "}
                {instancia.numero_serie && `(S/N: ${instancia.numero_serie})`}
              </div>
            )}
          </>
        )}

        {/* Step 2 — Orden */}
        {paso === 2 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Datos de la orden</h2>
            <div className="flex flex-col gap-1">
              <label htmlFor="nueva-falla" className="text-xs font-medium text-neutral-700">
                Falla reportada <span className="text-red-500">*</span>
              </label>
              <textarea
                id="nueva-falla"
                value={fallaIngreso}
                onChange={(e) => setFallaIngreso(e.target.value)}
                rows={3}
                placeholder="Describe el problema que reporta el cliente..."
                className={INPUT}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-tipo" className="text-xs font-medium text-neutral-700">
                  Tipo de servicio
                </label>
                <select
                  id="nueva-tipo"
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value as TipoServicio)}
                  className={SELECT}
                >
                  <option value="CORRECTIVO">Correctivo</option>
                  <option value="PREVENTIVO">Preventivo</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-canal" className="text-xs font-medium text-neutral-700">
                  Canal
                </label>
                <select
                  id="nueva-canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as Canal)}
                  className={SELECT}
                >
                  <option value="TIENDA">Tienda (presencial)</option>
                  <option value="DOMICILIO">Domicilio</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
              <span className="text-neutral-500">Costo de revisión:</span>{" "}
              <span className="font-semibold text-neutral-800">
                S/ {Number(costoRevision).toFixed(2)}
              </span>
              {!instancia?.categoria_id && (
                <span className="ml-2 text-xs text-neutral-400">
                  (sin tarifa para esta categoría)
                </span>
              )}
            </div>
          </>
        )}

        {/* Step 3 — Confirmar */}
        {paso === 3 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Confirmar recepción</h2>
            <div className="rounded-lg bg-neutral-50 p-4 text-sm space-y-2">
              {[
                { label: "Cliente", value: clienteNombre },
                {
                  label: "Equipo",
                  value: instancia?.producto_nombre ?? "—",
                },
                {
                  label: "N/S",
                  value: instancia?.numero_serie ?? "—",
                },
                { label: "Falla", value: fallaIngreso },
                { label: "Tipo", value: tipoServicio },
                { label: "Canal", value: canal },
                { label: "Costo revisión", value: `S/ ${Number(costoRevision).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-neutral-500">{label}</span>
                  <span className="text-right font-medium text-neutral-800">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500">
              Se creará la OS en estado <strong>VALIDACIÓN</strong>.
            </p>
            {serverError !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {serverError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => (paso > 0 ? setPaso((p) => p - 1) : navigate("/servicios"))}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          {paso === 0 ? "Cancelar" : "Anterior"}
        </button>
        {paso < PASOS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => {
              setServerError(null);
              setPaso((p) => p + 1);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={createOrden.isPending}
            onClick={handleConfirmar}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {createOrden.isPending ? "Creando..." : "Crear OS"}
          </button>
        )}
      </div>
    </div>
  );
}
