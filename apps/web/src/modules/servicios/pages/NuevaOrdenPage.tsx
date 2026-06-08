import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategorias, useCreateCategoria } from "../../catalogos/hooks/useCategorias";
import { useCreateMarca, useMarcas } from "../../catalogos/hooks/useMarcas";
import { useCreateModelo, useModelos } from "../../catalogos/hooks/useModelos";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useProductos } from "../../inventario/hooks/useProductos";
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
const BTN_INLINE =
  "shrink-0 flex items-center gap-1 rounded-lg border border-primary-300 px-2.5 py-1.5 text-xs text-primary-600 hover:bg-primary-50";
const BTN_SAVE =
  "shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60";
const BTN_CANCEL =
  "shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700";

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

  // Step 1 — Instancia (selects en cascada)
  const [instancia, setInstancia] = useState<Instancia | null>(null);
  const [showNewInstancia, setShowNewInstancia] = useState(false);
  const [newCategoriaId, setNewCategoriaId] = useState("");
  const [newMarcaId, setNewMarcaId] = useState("");
  const [selectedModeloId, setSelectedModeloId] = useState("");
  const [newNumeroSerie, setNewNumeroSerie] = useState("");

  // Inline create toggles
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaMarca, setShowNuevaMarca] = useState(false);
  const [showNuevoModelo, setShowNuevoModelo] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [nuevaMarcaNombre, setNuevaMarcaNombre] = useState("");
  const [nuevoModeloNombre, setNuevoModeloNombre] = useState("");

  // Step 2 — Orden
  const [fallaIngreso, setFallaIngreso] = useState("");
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("CORRECTIVO");
  const [canal, setCanal] = useState<Canal>("TIENDA");

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { data: clientesData } = useClientes({
    ...(searchCliente ? { search: searchCliente } : {}),
    pageSize: 50,
  });
  const { data: instanciasData, isLoading: instanciasLoading } = useInstancias({
    ...(clienteId ? { cliente_id: clienteId } : {}),
    pageSize: 50,
    enabled: clienteId !== "",
  });
  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 100 });
  const { data: marcasData } = useMarcas({ activo: true, pageSize: 100 });
  const { data: modelosData } = useModelos({
    ...(newCategoriaId ? { categoria_id: newCategoriaId } : {}),
    ...(newMarcaId ? { marca_id: newMarcaId } : {}),
    activo: true,
    pageSize: 100,
    enabled: newCategoriaId !== "" && newMarcaId !== "",
  });
  const { data: productosData } = useProductos({
    ...(newCategoriaId ? { categoria_id: newCategoriaId } : {}),
    ...(newMarcaId ? { marca_id: newMarcaId } : {}),
    activo: true,
    pageSize: 100,
    enabled: newCategoriaId !== "" && newMarcaId !== "",
  });
  const { data: costosData } = useCostosRevision();
  const createCategoria = useCreateCategoria();
  const createMarca = useCreateMarca();
  const createModelo = useCreateModelo();
  const createInstancia = useCreateInstancia();
  const createOrden = useCreateOrden();

  const instancias = instanciasData?.data ?? [];
  const costos = costosData?.data ?? [];

  // Cuando hay modelo seleccionado, resuelve el primer producto que coincide con categoria + marca
  const productoResuelto = selectedModeloId !== "" ? (productosData?.data?.[0] ?? null) : null;
  const sinProducto =
    selectedModeloId !== "" && productosData !== undefined && productoResuelto === null;

  const costoRevision = instancia?.categoria_id
    ? (costos.find((c) => c.categoria_id === instancia.categoria_id)?.monto ?? "0")
    : "0";

  function canAdvance(): boolean {
    if (paso === 0) return clienteId !== "";
    if (paso === 1) return instancia !== null;
    if (paso === 2) return fallaIngreso.trim() !== "";
    return true;
  }

  // ── Handlers inline create ──────────────────────────────────────────────────

  async function handleGuardarCategoria() {
    if (!nuevaCategoriaNombre.trim()) return;
    setServerError(null);
    try {
      const result = await createCategoria.mutateAsync({
        nombre: nuevaCategoriaNombre.trim(),
        orden: 0,
      });
      setNewCategoriaId(result.data.id);
      setNewMarcaId("");
      setSelectedModeloId("");
      setShowNuevoModelo(false);
      setNuevoModeloNombre("");
      setShowNuevaMarca(false);
      setNuevaMarcaNombre("");
      setShowNuevaCategoria(false);
      setNuevaCategoriaNombre("");
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function handleGuardarMarca() {
    if (!nuevaMarcaNombre.trim()) return;
    setServerError(null);
    try {
      const result = await createMarca.mutateAsync({ nombre: nuevaMarcaNombre.trim() });
      setNewMarcaId(result.data.id);
      setSelectedModeloId("");
      setShowNuevoModelo(false);
      setNuevoModeloNombre("");
      setShowNuevaMarca(false);
      setNuevaMarcaNombre("");
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function handleGuardarModelo() {
    if (!nuevoModeloNombre.trim() || !newMarcaId || !newCategoriaId) return;
    setServerError(null);
    try {
      const result = await createModelo.mutateAsync({
        nombre: nuevoModeloNombre.trim(),
        marca_id: newMarcaId,
        categoria_id: newCategoriaId,
      });
      setSelectedModeloId(result.data.id);
      setShowNuevoModelo(false);
      setNuevoModeloNombre("");
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function handleCrearInstancia() {
    if (!productoResuelto) {
      setServerError("No hay producto registrado para este modelo");
      return;
    }
    setServerError(null);
    try {
      const result = await createInstancia.mutateAsync({
        cliente_id: clienteId,
        producto_id: productoResuelto.id,
        ...(newNumeroSerie ? { numero_serie: newNumeroSerie } : {}),
      });
      setInstancia(result.data);
      setShowNewInstancia(false);
      setNewCategoriaId("");
      setNewMarcaId("");
      setSelectedModeloId("");
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

  // ── Render ─────────────────────────────────────────────────────────────────

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
              <div className="rounded-lg border border-neutral-200 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-800">Nuevo equipo</h3>

                {/* Categoría */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="inst-categoria" className="text-xs font-medium text-neutral-700">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  {!showNuevaCategoria ? (
                    <div className="flex gap-2">
                      <select
                        id="inst-categoria"
                        value={newCategoriaId}
                        onChange={(e) => {
                          setNewCategoriaId(e.target.value);
                          setNewMarcaId("");
                          setSelectedModeloId("");
                          setShowNuevoModelo(false);
                          setNuevoModeloNombre("");
                          setShowNuevaMarca(false);
                          setNuevaMarcaNombre("");
                        }}
                        className={SELECT}
                      >
                        <option value="">Selecciona una categoría</option>
                        {(categoriasData?.data ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNuevaCategoria(true)}
                        className={BTN_INLINE}
                      >
                        <Plus className="h-3 w-3" /> Nueva
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="inst-categoria"
                        type="text"
                        value={nuevaCategoriaNombre}
                        onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                        placeholder="Nombre de categoría"
                        className={INPUT}
                      />
                      <button
                        type="button"
                        disabled={createCategoria.isPending || !nuevaCategoriaNombre.trim()}
                        onClick={handleGuardarCategoria}
                        className={BTN_SAVE}
                      >
                        {createCategoria.isPending ? "..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNuevaCategoria(false);
                          setNuevaCategoriaNombre("");
                        }}
                        className={BTN_CANCEL}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Marca */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="inst-marca" className="text-xs font-medium text-neutral-700">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  {!showNuevaMarca ? (
                    <div className="flex gap-2">
                      <select
                        id="inst-marca"
                        value={newMarcaId}
                        disabled={newCategoriaId === ""}
                        onChange={(e) => {
                          setNewMarcaId(e.target.value);
                          setSelectedModeloId("");
                          setShowNuevoModelo(false);
                          setNuevoModeloNombre("");
                        }}
                        className={SELECT}
                      >
                        <option value="">Selecciona una marca</option>
                        {(marcasData?.data ?? []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={newCategoriaId === ""}
                        onClick={() => setShowNuevaMarca(true)}
                        className={BTN_INLINE}
                      >
                        <Plus className="h-3 w-3" /> Nueva
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="inst-marca"
                        type="text"
                        value={nuevaMarcaNombre}
                        onChange={(e) => setNuevaMarcaNombre(e.target.value)}
                        placeholder="Nombre de marca"
                        className={INPUT}
                      />
                      <button
                        type="button"
                        disabled={createMarca.isPending || !nuevaMarcaNombre.trim()}
                        onClick={handleGuardarMarca}
                        className={BTN_SAVE}
                      >
                        {createMarca.isPending ? "..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNuevaMarca(false);
                          setNuevaMarcaNombre("");
                        }}
                        className={BTN_CANCEL}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Modelo */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="inst-modelo" className="text-xs font-medium text-neutral-700">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  {!showNuevoModelo ? (
                    <div className="flex gap-2">
                      <select
                        id="inst-modelo"
                        value={selectedModeloId}
                        disabled={newMarcaId === ""}
                        onChange={(e) => setSelectedModeloId(e.target.value)}
                        className={SELECT}
                      >
                        <option value="">Selecciona un modelo</option>
                        {(modelosData?.data ?? []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={newMarcaId === ""}
                        onClick={() => setShowNuevoModelo(true)}
                        className={BTN_INLINE}
                      >
                        <Plus className="h-3 w-3" /> Nuevo
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="inst-modelo"
                        type="text"
                        value={nuevoModeloNombre}
                        onChange={(e) => setNuevoModeloNombre(e.target.value)}
                        placeholder="Nombre de modelo"
                        className={INPUT}
                      />
                      <button
                        type="button"
                        disabled={
                          createModelo.isPending ||
                          !nuevoModeloNombre.trim() ||
                          !newMarcaId ||
                          !newCategoriaId
                        }
                        onClick={handleGuardarModelo}
                        className={BTN_SAVE}
                      >
                        {createModelo.isPending ? "..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNuevoModelo(false);
                          setNuevoModeloNombre("");
                        }}
                        className={BTN_CANCEL}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Alerta sin producto */}
                {sinProducto && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    No hay producto registrado para esta combinación. Contacta a un administrador
                    para registrar el producto en el catálogo de inventario.
                  </div>
                )}

                {/* Producto resuelto */}
                {productoResuelto && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                    Producto identificado:{" "}
                    <span className="font-medium">{productoResuelto.nombre}</span>
                  </div>
                )}

                {/* Número de serie */}
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
                    disabled={createInstancia.isPending || !productoResuelto}
                    onClick={handleCrearInstancia}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    title={!productoResuelto ? "No hay producto para esta combinación" : undefined}
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
                { label: "Equipo", value: instancia?.producto_nombre ?? "—" },
                { label: "N/S", value: instancia?.numero_serie ?? "—" },
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
