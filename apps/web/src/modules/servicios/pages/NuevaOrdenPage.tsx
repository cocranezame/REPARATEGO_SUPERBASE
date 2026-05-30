import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useMarcas } from "../../catalogos/hooks/useMarcas";
import { useModelos } from "../../catalogos/hooks/useModelos";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useCreateOrdenServicio } from "../hooks/useOrdenesServicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const PASOS = ["Cliente", "Equipo", "Problema", "Confirmar"];

type ComponenteItem = {
  key: string;
  componente_id: string;
  estado_componente: string;
  notas: string;
};

export function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const [searchCliente, setSearchCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");

  const [categoriaId, setCategoriaId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [serie, setSerie] = useState("");
  const [color, setColor] = useState("");

  const [problema, setProblema] = useState("");
  const [tipoServicio, setTipoServicio] = useState("CORRECTIVO");
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [notasInternas, setNotasInternas] = useState("");
  const nextKey = useRef(2);
  const [componenteItems, setComponenteItems] = useState<ComponenteItem[]>([]);

  const { data: clientesData } = useClientes({
    ...(searchCliente ? { search: searchCliente } : {}),
    pageSize: 50,
  });
  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 200 });
  const { data: marcasData } = useMarcas({ activo: true, pageSize: 200 });
  const { data: modelosData } = useModelos({
    activo: true,
    pageSize: 200,
    ...(marcaId ? { marca_id: marcaId } : {}),
    ...(categoriaId ? { categoria_id: categoriaId } : {}),
  });
  const { data: componentesData } = useComponentes({ activo: true, pageSize: 200 });

  const createMutation = useCreateOrdenServicio();

  function addComponente() {
    const k = String(nextKey.current++);
    setComponenteItems((prev) => [
      ...prev,
      { key: k, componente_id: "", estado_componente: "DAÑADO", notas: "" },
    ]);
  }

  function removeComponente(k: string) {
    setComponenteItems((prev) => prev.filter((it) => it.key !== k));
  }

  function updateComponente(k: string, field: keyof Omit<ComponenteItem, "key">, value: string) {
    setComponenteItems((prev) => prev.map((it) => (it.key === k ? { ...it, [field]: value } : it)));
  }

  function canAdvance(): boolean {
    if (paso === 0) return clienteId !== "";
    if (paso === 1) return categoriaId !== "";
    if (paso === 2) return problema.trim() !== "";
    return true;
  }

  async function handleConfirmar() {
    setServerError(null);
    try {
      const result = await createMutation.mutateAsync({
        cliente_id: clienteId,
        sucursal_id: "00000000-0000-0000-0000-000000000000",
        categoria_id: categoriaId,
        ...(marcaId ? { marca_id: marcaId } : {}),
        ...(modeloId ? { modelo_id: modeloId } : {}),
        ...(serie ? { serie_equipo: serie } : {}),
        ...(color ? { color_equipo: color } : {}),
        problema_reportado: problema,
        tipo_servicio: tipoServicio as "CORRECTIVO" | "PREVENTIVO",
        prioridad: prioridad as "BAJA" | "NORMAL" | "ALTA" | "URGENTE",
        ...(notasInternas ? { notas_internas: notasInternas } : {}),
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
              className={`hidden text-xs sm:block ${i === paso ? "font-medium text-neutral-900" : "text-neutral-400"}`}
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
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      clienteId === c.id
                        ? "bg-primary-50 text-primary-800"
                        : "hover:bg-neutral-50 text-neutral-800"
                    }`}
                  >
                    <span className="font-medium">{nombre}</span>
                    <span className="ml-2 text-xs text-neutral-400">{c.numero_documento}</span>
                  </button>
                );
              })}
            </div>
            {clienteId && (
              <p className="text-xs text-primary-700 font-medium">Seleccionado: {clienteNombre}</p>
            )}
          </>
        )}

        {/* Step 1 — Equipo */}
        {paso === 1 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Datos del equipo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-categoria" className="text-xs font-medium text-neutral-700">
                  Categoría <span className="text-danger-600">*</span>
                </label>
                <select
                  id="nueva-categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className={SELECT}
                >
                  <option value="">Seleccionar...</option>
                  {(categoriasData?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-marca" className="text-xs font-medium text-neutral-700">
                  Marca
                </label>
                <select
                  id="nueva-marca"
                  value={marcaId}
                  onChange={(e) => {
                    setMarcaId(e.target.value);
                    setModeloId("");
                  }}
                  className={SELECT}
                >
                  <option value="">Sin especificar</option>
                  {(marcasData?.data ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-modelo" className="text-xs font-medium text-neutral-700">
                  Modelo
                </label>
                <select
                  id="nueva-modelo"
                  value={modeloId}
                  onChange={(e) => setModeloId(e.target.value)}
                  className={SELECT}
                >
                  <option value="">Sin especificar</option>
                  {(modelosData?.data ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-serie" className="text-xs font-medium text-neutral-700">
                  N.º de serie
                </label>
                <input
                  id="nueva-serie"
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  placeholder="Opcional"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label htmlFor="nueva-color" className="text-xs font-medium text-neutral-700">
                  Color
                </label>
                <input
                  id="nueva-color"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Opcional"
                  className={INPUT}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Problema */}
        {paso === 2 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Problema y componentes</h2>
            <div className="flex flex-col gap-1">
              <label htmlFor="nueva-problema" className="text-xs font-medium text-neutral-700">
                Problema reportado <span className="text-danger-600">*</span>
              </label>
              <textarea
                id="nueva-problema"
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                rows={3}
                placeholder="Describe el problema que reporta el cliente..."
                className={INPUT}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="nueva-tipo-servicio"
                  className="text-xs font-medium text-neutral-700"
                >
                  Tipo de servicio
                </label>
                <select
                  id="nueva-tipo-servicio"
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  className={SELECT}
                >
                  <option value="CORRECTIVO">Correctivo</option>
                  <option value="PREVENTIVO">Preventivo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-prioridad" className="text-xs font-medium text-neutral-700">
                  Prioridad
                </label>
                <select
                  id="nueva-prioridad"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className={SELECT}
                >
                  <option value="BAJA">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nueva-notas" className="text-xs font-medium text-neutral-700">
                Notas internas
              </label>
              <input
                id="nueva-notas"
                type="text"
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                placeholder="Opcional"
                className={INPUT}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">
                  Componentes preliminares (opcional)
                </span>
                <button
                  type="button"
                  onClick={addComponente}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {componenteItems.map((it) => (
                  <div key={it.key} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
                    <select
                      value={it.componente_id}
                      onChange={(e) => updateComponente(it.key, "componente_id", e.target.value)}
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Componente...</option>
                      {(componentesData?.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      value={it.estado_componente}
                      onChange={(e) =>
                        updateComponente(it.key, "estado_componente", e.target.value)
                      }
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="DAÑADO">Dañado</option>
                      <option value="FALTANTE">Faltante</option>
                      <option value="OK">OK</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeComponente(it.key)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Confirmar */}
        {paso === 3 && (
          <>
            <h2 className="text-base font-semibold text-neutral-900">Confirmar recepción</h2>
            <div className="rounded-lg bg-neutral-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Cliente</span>
                <span className="font-medium">{clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Problema</span>
                <span className="max-w-xs text-right font-medium">{problema}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipo</span>
                <span className="font-medium">{tipoServicio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Prioridad</span>
                <span className="font-medium">{prioridad}</span>
              </div>
              {componenteItems.filter((it) => it.componente_id).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Componentes</span>
                  <span className="font-medium">
                    {componenteItems.filter((it) => it.componente_id).length} registrado(s)
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Se creará la OS en estado <strong>RECEPCIÓN</strong>.
            </p>
            {serverError !== null && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
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
            onClick={() => setPaso((p) => p + 1)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={handleConfirmar}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {createMutation.isPending ? "Creando..." : "Crear OS"}
          </button>
        )}
      </div>
    </div>
  );
}
