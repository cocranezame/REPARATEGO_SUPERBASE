// POS — Punto de Venta (Grupos 3-7 E11.3)
import { Barcode, ChevronRight, Package, Search, ShoppingCart, Wrench, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useClientes, useCreateDireccion, useDirecciones } from "../../clientes/hooks/useClientes";
import { useMetodosPago, useProductos } from "../../inventario/hooks/useInventario";
import { useCajaActiva, useCrearVenta, useRegistrarPago, useVenta } from "../hooks/useVentas";
import type { CajaDto } from "../types/ventas";
import { CajaPage } from "./CajaPage";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoItemCarrito = "PRODUCTO" | "SERVICIO";

type ItemCarrito = {
  _key: number;
  tipo: TipoItemCarrito;
  produto_id: string | null;
  lote_id: string | null;
  sku: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  es_preventivo?: boolean | undefined;
};

type MetodoPagoSeleccionado = {
  _key: number;
  metodo_pago_id: string;
  metodo_nombre: string;
  monto: number;
};

let _metodoKey = 0;

type EnvioFormData = {
  direccion_id?: string | undefined;
  metodo_envio: string;
  fecha_programada: string;
  costo_envio: number;
};

let _itemKey = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

// ─── Guard: Caja ──────────────────────────────────────────────────────────────

function CajaGuard({ caja, children }: { caja: CajaDto | null; children: React.ReactNode }) {
  const [showApertura, setShowApertura] = useState(false);

  if (!caja) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ShoppingCart className="h-8 w-8 text-amber-600" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-neutral-900">Caja no abierta</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Debes abrir tu caja antes de realizar ventas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowApertura(true)}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          Abrir caja
        </button>
        {showApertura && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <CajaPage />
              <button
                type="button"
                onClick={() => setShowApertura(false)}
                className="mt-4 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Catalog Panel ────────────────────────────────────────────────────────────

function CatalogoPanel({
  onAddServicio,
  onScanResult,
}: {
  onAddServicio: (item: Omit<ItemCarrito, "_key">) => void;
  onScanResult: (item: Omit<ItemCarrito, "_key">) => void;
}) {
  const scanRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState("");
  const [searchText, setSearchText] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "PRODUCTO" | "SERVICIO">("TODOS");
  const [scanError, setScanError] = useState<string | null>(null);

  const { data: categoriasRes } = useCategorias({});
  const categorias = categoriasRes?.data ?? [];

  const productosParams = {
    ...(searchText ? { search: searchText } : {}),
    ...(categoriaId ? { categoria_id: categoriaId } : {}),
    ...(tipoFiltro !== "TODOS" ? { tipo: tipoFiltro as "PRODUCTO" | "SERVICIO" } : {}),
    activo: true,
    pageSize: 60,
  };
  const { data: productosRes, isLoading: loadingProductos } = useProductos(productosParams);
  const productos = productosRes?.data ?? [];

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const sku = scanValue.trim();
    if (!sku) return;

    setScanError(null);
    const match = productos.find(
      (p) =>
        p.tipo === "PRODUCTO" &&
        (p.codigo.toLowerCase() === sku.toLowerCase() ||
          p.nombre.toLowerCase() === sku.toLowerCase())
    );

    if (!match) {
      setScanError(`SKU "${sku}" no encontrado. Verifica el código.`);
      setScanValue("");
      return;
    }

    onScanResult({
      tipo: "PRODUCTO",
      produto_id: match.id,
      lote_id: null,
      sku,
      descripcion: match.nombre,
      cantidad: 1,
      precio_unitario: Number(match.precio_venta),
    });
    setScanValue("");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* SKU scanner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 shrink-0 text-neutral-400" />
          <input
            ref={scanRef}
            type="text"
            placeholder="Escanear SKU (Enter para agregar)"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={handleScan}
            className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          {scanValue && (
            <button type="button" onClick={() => setScanValue("")}>
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          )}
        </div>
        {scanError !== null && <p className="mt-1.5 text-xs text-red-600">{scanError}</p>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar producto o servicio..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-neutral-300 text-sm">
          {(["TODOS", "PRODUCTO", "SERVICIO"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-2 ${
                tipoFiltro === t
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {t === "TODOS" ? "Todos" : t === "PRODUCTO" ? "Productos" : "Servicios"}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla */}
      {loadingProductos ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : productos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-neutral-400">
          <Package className="mb-2 h-8 w-8" />
          <p className="text-sm">Sin resultados</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto lg:grid-cols-3">
          {productos.map((p) => {
            const esServicio = p.tipo === "SERVICIO";
            return (
              <button
                key={p.id}
                type="button"
                disabled={!esServicio}
                title={esServicio ? "Click para agregar" : "Requiere escaneo SKU"}
                onClick={() => {
                  if (!esServicio) return;
                  onAddServicio({
                    tipo: "SERVICIO",
                    produto_id: p.id,
                    lote_id: null,
                    sku: null,
                    descripcion: p.nombre,
                    cantidad: 1,
                    precio_unitario: Number(p.precio_venta),
                  });
                }}
                className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                  esServicio
                    ? "cursor-pointer border-primary-200 bg-primary-50 hover:border-primary-400 hover:bg-primary-100"
                    : "cursor-not-allowed border-neutral-200 bg-white opacity-70"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                  {esServicio ? (
                    <Wrench className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Package className="h-5 w-5 text-neutral-500" />
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-900">
                  {p.nombre}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary-700">
                  {fmtPEN(Number(p.precio_venta))}
                </p>
                {!esServicio && <p className="mt-0.5 text-xs text-neutral-400">Escanear SKU</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Modal de pagos ───────────────────────────────────────────────────────────

function ModalPagos({
  total,
  saldoPendiente,
  tipoVenta,
  ventaId,
  onClose,
  onSuccess,
}: {
  total: number;
  saldoPendiente: number;
  tipoVenta: "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION";
  ventaId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: metodosRes } = useMetodosPago(true);
  const metodos = metodosRes?.data ?? [];
  const { mutate: registrarPago, isPending } = useRegistrarPago();

  const [metodosSeleccionados, setMetodosSeleccionados] = useState<MetodoPagoSeleccionado[]>([]);
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [monto, setMonto] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const totalAgregado = metodosSeleccionados.reduce((s, m) => s + m.monto, 0);
  const esServicio = tipoVenta === "SERVICIO";
  const restante = Math.max(0, saldoPendiente - totalAgregado);

  function addMetodo() {
    if (!metodoPagoId || !monto || Number(monto) <= 0) return;
    const metodo = metodos.find((m) => m.id === metodoPagoId);
    setMetodosSeleccionados((prev) => [
      ...prev,
      {
        _key: ++_metodoKey,
        metodo_pago_id: metodoPagoId,
        metodo_nombre: metodo?.nombre ?? metodoPagoId,
        monto: Number(monto),
      },
    ]);
    setMonto("");
  }

  function removeMetodo(key: number) {
    setMetodosSeleccionados((prev) => prev.filter((m) => m._key !== key));
  }

  async function handleConfirmar() {
    if (metodosSeleccionados.length === 0) {
      setError("Agrega al menos un método de pago.");
      return;
    }
    if (!esServicio) {
      const centsSaldo = Math.round(saldoPendiente * 100);
      const centsTotal = Math.round(totalAgregado * 100);
      if (centsTotal !== centsSaldo) {
        setError(
          `Venta LIBRE: la suma de pagos debe ser exactamente S/ ${saldoPendiente.toFixed(2)}.`
        );
        return;
      }
    }

    setError(null);
    for (const mp of metodosSeleccionados) {
      await new Promise<void>((resolve, reject) => {
        registrarPago(
          { ventaId, metodo_pago_id: mp.metodo_pago_id, monto: mp.monto },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          }
        );
      }).catch((err: Error) => {
        setError(err.message);
        throw err;
      });
    }
    onSuccess();
  }

  const puedeConfirmar = metodosSeleccionados.length > 0;
  const pagoParcial = esServicio && totalAgregado < saldoPendiente;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Registrar pago</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          {/* Resumen */}
          <div className="rounded-lg bg-neutral-50 p-3 text-sm space-y-1">
            <div className="flex justify-between text-neutral-600">
              <span>Total venta</span>
              <span className="font-semibold">{fmtPEN(total)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Saldo pendiente</span>
              <span className="font-semibold text-amber-700">{fmtPEN(saldoPendiente)}</span>
            </div>
            {metodosSeleccionados.length > 0 && (
              <>
                <div className="flex justify-between border-t border-neutral-200 pt-1 text-neutral-600">
                  <span>Suma este pago</span>
                  <span className="font-semibold">{fmtPEN(totalAgregado)}</span>
                </div>
                {!esServicio && restante > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Falta cubrir</span>
                    <span className="font-semibold">{fmtPEN(restante)}</span>
                  </div>
                )}
                {!esServicio && restante === 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Pago completo</span>
                    <span className="font-semibold">✓</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Agregar método */}
          <div className="flex gap-2">
            <select
              value={metodoPagoId}
              onChange={(e) => setMetodoPagoId(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Método de pago *</option>
              {metodos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addMetodo}
              disabled={!metodoPagoId || !monto}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-40"
            >
              +
            </button>
          </div>

          {/* Lista métodos */}
          {metodosSeleccionados.length > 0 && (
            <div className="rounded-lg border border-neutral-200 divide-y">
              {metodosSeleccionados.map((m) => (
                <div key={m._key} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-neutral-700">{m.metodo_nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fmtPEN(m.monto)}</span>
                    <button type="button" onClick={() => removeMetodo(m._key)}>
                      <X className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error !== null && <p className="text-sm text-red-600">{error}</p>}

          {esServicio && (
            <p className="text-xs text-neutral-500">
              Venta de servicio: puedes registrar un adelanto parcial.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmar()}
            disabled={!puedeConfirmar || isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isPending ? "Procesando..." : pagoParcial ? "Registrar adelanto" : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sección envío ────────────────────────────────────────────────────────────

function SeccionEnvio({
  clienteId,
  data,
  onChange,
}: {
  clienteId: string | null;
  data: EnvioFormData;
  onChange: (d: EnvioFormData) => void;
}) {
  const { data: direccionesRes } = useDirecciones(clienteId ?? "");
  const direcciones = direccionesRes?.data ?? [];
  const { mutate: crearDir, isPending: creandoDir } = useCreateDireccion();
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevaReferencia, setNuevaReferencia] = useState("");
  const [errorDir, setErrorDir] = useState<string | null>(null);

  function guardarDireccion() {
    if (!clienteId || !nuevaDireccion.trim()) {
      setErrorDir("La dirección es obligatoria.");
      return;
    }
    crearDir(
      {
        clienteId,
        etiqueta: "OTRO",
        direccion: nuevaDireccion.trim(),
        ...(nuevaReferencia ? { referencia: nuevaReferencia } : {}),
        es_principal: false,
      },
      {
        onSuccess: () => {
          setShowNueva(false);
          setNuevaDireccion("");
          setNuevaReferencia("");
          setErrorDir(null);
        },
        onError: (err) => setErrorDir(err.message),
      }
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
      <p className="text-sm font-medium text-primary-800">Datos de envío</p>

      {clienteId ? (
        <div className="flex gap-2">
          <select
            value={data.direccion_id ?? ""}
            onChange={(e) =>
              onChange({
                ...data,
                ...(e.target.value
                  ? { direccion_id: e.target.value }
                  : { direccion_id: undefined }),
              })
            }
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Seleccionar dirección</option>
            {direcciones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.direccion}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNueva(true)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            + Nueva
          </button>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">Asocia un cliente para gestionar direcciones.</p>
      )}

      {showNueva && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
          <input
            type="text"
            placeholder="Dirección *"
            value={nuevaDireccion}
            onChange={(e) => setNuevaDireccion(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Referencia (opcional)"
            value={nuevaReferencia}
            onChange={(e) => setNuevaReferencia(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          {errorDir && <p className="text-xs text-red-600">{errorDir}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNueva(false)}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardarDireccion}
              disabled={creandoDir}
              className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white hover:bg-primary-700 disabled:opacity-60"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Método de envío"
          value={data.metodo_envio}
          onChange={(e) => onChange({ ...data, metodo_envio: e.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={data.fecha_programada}
          onChange={(e) => onChange({ ...data, fecha_programada: e.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="costo-envio" className="text-xs text-neutral-600">
          Costo envío (S/.):
        </label>
        <input
          id="costo-envio"
          type="number"
          min="0"
          step="0.01"
          value={data.costo_envio}
          onChange={(e) => onChange({ ...data, costo_envio: Number(e.target.value) })}
          className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// ─── Cart Panel ───────────────────────────────────────────────────────────────

function CarritoPanel({
  items,
  tipoVenta,
  clienteNombre,
  clienteId,
  ordenServicioId,
  ventaIdExistente,
  saldoPendienteExistente,
  requiereEnvio,
  envioData,
  onSetRequiereEnvio,
  onSetEnvioData,
  onRemoveItem,
  onUpdateCantidad,
  onVentaCreada,
  onPagoRegistrado,
}: {
  items: ItemCarrito[];
  tipoVenta: "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION";
  clienteNombre: string;
  clienteId: string | null;
  ordenServicioId: string | null;
  ventaIdExistente: string | null;
  saldoPendienteExistente: number;
  requiereEnvio: boolean;
  envioData: EnvioFormData;
  onSetRequiereEnvio: (v: boolean) => void;
  onSetEnvioData: (d: EnvioFormData) => void;
  onRemoveItem: (key: number) => void;
  onUpdateCantidad: (key: number, delta: number) => void;
  onVentaCreada: (ventaId: string, saldo: number) => void;
  onPagoRegistrado: () => void;
}) {
  const { mutate: crearVenta, isPending: creando } = useCrearVenta();
  const [showModal, setShowModal] = useState(false);
  const [currentVentaId, setCurrentVentaId] = useState<string | null>(ventaIdExistente);
  const [currentSaldo, setCurrentSaldo] = useState(saldoPendienteExistente);
  const [error, setError] = useState<string | null>(null);
  const [ventaCompletada, setVentaCompletada] = useState(false);

  // Cargar detalle de venta existente para mostrar historial abonos
  const { data: ventaDetalleRes } = useVenta(currentVentaId ?? "");
  const ventaDetalle = ventaDetalleRes?.data ?? null;
  const abonosPrevios = ventaDetalle?.pagos ?? [];

  // Search client
  const [clienteSearch, setClienteSearch] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(clienteId);
  const [selectedClienteNombre, setSelectedClienteNombre] = useState(clienteNombre);
  const { data: clientesRes } = useClientes(
    clienteSearch.length >= 2 ? { search: clienteSearch, pageSize: 5 } : {}
  );
  const clientesSugeridos = clienteSearch.length >= 2 ? (clientesRes?.data ?? []) : [];

  useEffect(() => {
    setCurrentVentaId(ventaIdExistente);
    setCurrentSaldo(saldoPendienteExistente);
  }, [ventaIdExistente, saldoPendienteExistente]);

  const esLibre = tipoVenta === "LIBRE";
  const esServicio = tipoVenta === "SERVICIO";

  const subtotalProductos = items
    .filter((it) => it.tipo === "PRODUCTO")
    .reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);
  const subtotalServicios = items
    .filter((it) => it.tipo === "SERVICIO")
    .reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);
  const costoEnvio = requiereEnvio ? envioData.costo_envio : 0;
  const total = subtotalProductos + subtotalServicios + costoEnvio;
  const saldoActual = currentVentaId ? currentSaldo : total;

  function handlePagar() {
    if (items.length === 0 && !currentVentaId) {
      setError("Agrega al menos un item al carrito.");
      return;
    }
    if (!currentVentaId) {
      // Crear nueva venta primero, luego abrir modal pagos
      setError(null);
      const ventaItems = items.map((it) => ({
        tipo_item: it.tipo as "PRODUCTO" | "SERVICIO",
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        ...(it.produto_id ? { produto_id: it.produto_id } : {}),
        ...(it.lote_id ? { lote_id: it.lote_id } : {}),
        ...(it.sku ? { sku: it.sku } : {}),
        ...(it.es_preventivo !== undefined ? { es_preventivo: it.es_preventivo } : {}),
      }));
      if (requiereEnvio) {
        ventaItems.push({
          tipo_item: "ENVIO" as const,
          descripcion: "Costo de envío",
          cantidad: 1,
          precio_unitario: costoEnvio,
        });
      }
      crearVenta(
        {
          tipo: tipoVenta,
          ...(selectedClienteId ? { cliente_id: selectedClienteId } : {}),
          ...(ordenServicioId ? { orden_servicio_id: ordenServicioId } : {}),
          items: ventaItems,
          ...(requiereEnvio && envioData.fecha_programada
            ? {
                requiere_envio: true,
                datos_envio: {
                  ...(envioData.direccion_id ? { direccion_id: envioData.direccion_id } : {}),
                  ...(envioData.metodo_envio ? { metodo_envio: envioData.metodo_envio } : {}),
                  fecha_programada: envioData.fecha_programada,
                  costo_envio: costoEnvio,
                },
              }
            : {}),
          pagos: [],
        },
        {
          onSuccess: (res) => {
            const vid = res.data.id;
            const saldo = Number(
              (res.data as unknown as { saldo_pendiente: string }).saldo_pendiente ?? total
            );
            setCurrentVentaId(vid);
            setCurrentSaldo(saldo);
            onVentaCreada(vid, saldo);
            setShowModal(true);
          },
          onError: (err) => setError(err.message),
        }
      );
      return;
    }
    setShowModal(true);
  }

  if (ventaCompletada) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ShoppingCart className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-900">
            {esServicio ? "Pago registrado" : "¡Venta completada!"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{currentVentaId ?? ""}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVentaCompletada(false);
            setCurrentVentaId(null);
            setCurrentSaldo(0);
            onPagoRegistrado();
          }}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          Nueva venta
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Cliente */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3">
        <p className="mb-1 text-xs font-medium text-neutral-500">Cliente</p>
        {!esLibre ? (
          <p className="text-sm font-medium text-neutral-900">
            {selectedClienteNombre || "Vinculado al servicio"}
          </p>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente (opcional)..."
              value={clienteSearch || selectedClienteNombre}
              onChange={(e) => {
                setClienteSearch(e.target.value);
                if (!e.target.value) {
                  setSelectedClienteId(null);
                  setSelectedClienteNombre("");
                }
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            {clientesSugeridos.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
                {clientesSugeridos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClienteId(c.id);
                      const nombre =
                        c.tipo_persona === "NATURAL"
                          ? `${c.nombres ?? ""} ${c.apellidos ?? ""}`.trim()
                          : (c.razon_social ?? "");
                      setSelectedClienteNombre(nombre);
                      setClienteSearch("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">{c.numero_documento}</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                    <span className="text-neutral-600">
                      {c.tipo_persona === "NATURAL"
                        ? `${c.nombres ?? ""} ${c.apellidos ?? ""}`.trim()
                        : (c.razon_social ?? "")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle envío */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
        <input
          type="checkbox"
          checked={requiereEnvio}
          onChange={(e) => onSetRequiereEnvio(e.target.checked)}
          className="h-4 w-4 accent-primary-600"
        />
        <span className="text-sm font-medium text-neutral-700">Requiere envío</span>
      </label>

      {/* Sección envío */}
      {requiereEnvio && (
        <SeccionEnvio clienteId={selectedClienteId} data={envioData} onChange={onSetEnvioData} />
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-white">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
            <ShoppingCart className="mb-2 h-7 w-7" />
            <p className="text-sm">Carrito vacío</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {/* Separación correctivo/preventivo para ventas de servicio */}
            {esServicio && items.some((it) => it.es_preventivo === false) && (
              <p className="bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                CORRECTIVO
              </p>
            )}
            {items
              .filter((it) => !esServicio || it.es_preventivo !== true)
              .map((it) => (
                <div key={it._key} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {it.descripcion}
                    </p>
                    {it.sku && <p className="text-xs text-neutral-400">SKU: {it.sku}</p>}
                    <p className="text-xs text-neutral-500">{fmtPEN(it.precio_unitario)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateCantidad(it._key, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{it.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateCantidad(it._key, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-neutral-900">
                    {fmtPEN(it.cantidad * it.precio_unitario)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(it._key)}
                    className="ml-1 text-neutral-300 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

            {esServicio && items.some((it) => it.es_preventivo === true) && (
              <>
                <p className="bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  PREVENTIVO
                </p>
                {items
                  .filter((it) => it.es_preventivo === true)
                  .map((it) => (
                    <div key={it._key} className="flex items-center gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {it.descripcion}
                        </p>
                        <p className="text-xs text-neutral-500">{fmtPEN(it.precio_unitario)}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {fmtPEN(it.cantidad * it.precio_unitario)}
                      </span>
                      <button type="button" onClick={() => onRemoveItem(it._key)}>
                        <X className="h-4 w-4 text-neutral-300 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm space-y-1">
        {subtotalProductos > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Productos</span>
            <span>{fmtPEN(subtotalProductos)}</span>
          </div>
        )}
        {subtotalServicios > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Servicios</span>
            <span>{fmtPEN(subtotalServicios)}</span>
          </div>
        )}
        {costoEnvio > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Envío</span>
            <span>{fmtPEN(costoEnvio)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-200 pt-1 font-bold text-neutral-900">
          <span>TOTAL</span>
          <span>{fmtPEN(total)}</span>
        </div>
        {currentVentaId && currentSaldo < total && (
          <div className="flex justify-between text-amber-700">
            <span>Saldo pendiente</span>
            <span className="font-semibold">{fmtPEN(currentSaldo)}</span>
          </div>
        )}
      </div>

      {/* Historial de abonos previos — visible cuando venta servicio tiene pagos */}
      {abonosPrevios.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Abonos registrados
          </p>
          <div className="space-y-1">
            {abonosPrevios.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between text-xs text-neutral-600"
              >
                <span>{pago.metodo_nombre ?? "—"}</span>
                <span>{new Date(pago.fecha_pago).toLocaleDateString("es-PE")}</span>
                <span className="font-semibold text-neutral-900">{fmtPEN(Number(pago.monto))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error !== null && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handlePagar}
        disabled={creando || (items.length === 0 && !currentVentaId)}
        className="rounded-xl bg-primary-600 py-3 text-base font-bold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {creando ? "Creando venta..." : `PAGAR ${fmtPEN(saldoActual)}`}
      </button>

      {showModal && currentVentaId && (
        <ModalPagos
          total={total}
          saldoPendiente={currentSaldo}
          tipoVenta={tipoVenta}
          ventaId={currentVentaId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setVentaCompletada(true);
          }}
        />
      )}
    </div>
  );
}

// ─── POS Page ─────────────────────────────────────────────────────────────────

export function PosPage() {
  const [searchParams] = useSearchParams();
  const ventaIdParam = searchParams.get("venta_id");

  const { data: cajaRes, isLoading: loadingCaja } = useCajaActiva();
  const caja = cajaRes?.data ?? null;

  // Cargar venta existente si viene por query param
  const { data: ventaPreRes } = useVenta(ventaIdParam ?? "");
  const ventaPre = ventaPreRes?.data ?? null;

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [tipoVenta, setTipoVenta] = useState<
    "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION"
  >("LIBRE");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [ordenServicioId, setOrdenServicioId] = useState<string | null>(null);
  const [ventaIdExistente, setVentaIdExistente] = useState<string | null>(null);
  const [saldoPendienteExistente, setSaldoPendienteExistente] = useState(0);
  const [requiereEnvio, setRequiereEnvio] = useState(false);
  const [envioData, setEnvioData] = useState<EnvioFormData>({
    metodo_envio: "",
    fecha_programada: "",
    costo_envio: 0,
  });

  // Precargar venta existente (desde servicios — V23, V25)
  useEffect(() => {
    if (!ventaPre) return;
    setTipoVenta(
      ventaPre.tipo_venta as "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION"
    );
    setClienteNombre(ventaPre.cliente_nombre ?? "");
    setClienteId(ventaPre.cliente_id);
    setOrdenServicioId(ventaPre.orden_servicio_id);
    setVentaIdExistente(ventaPre.id);
    setSaldoPendienteExistente(Number(ventaPre.saldo_pendiente));
    // precargar items del detalle
    const loadedItems: ItemCarrito[] = ventaPre.items.map((it) => ({
      _key: ++_itemKey,
      tipo: it.tipo_item as TipoItemCarrito,
      produto_id: it.produto_id,
      lote_id: it.lote_id,
      sku: it.sku,
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precio_unitario: Number(it.precio_unitario),
      ...(it.es_preventivo !== undefined ? { es_preventivo: it.es_preventivo } : {}),
    }));
    setItems(loadedItems);
  }, [ventaPre]);

  function addItem(item: Omit<ItemCarrito, "_key">) {
    setItems((prev) => [...prev, { ...item, _key: ++_itemKey }]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((it) => it._key !== key));
  }

  function updateCantidad(key: number, delta: number) {
    setItems((prev) =>
      prev.map((it) =>
        it._key === key ? { ...it, cantidad: Math.max(1, it.cantidad + delta) } : it
      )
    );
  }

  function resetCarrito() {
    setItems([]);
    setClienteId(null);
    setClienteNombre("");
    setOrdenServicioId(null);
    setVentaIdExistente(null);
    setSaldoPendienteExistente(0);
    setTipoVenta("LIBRE");
    setRequiereEnvio(false);
    setEnvioData({ metodo_envio: "", fecha_programada: "", costo_envio: 0 });
  }

  if (loadingCaja) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <CajaGuard caja={caja}>
      <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">
        {/* Panel izquierdo — catálogo */}
        <div className="flex w-1/2 flex-col gap-3 overflow-y-auto lg:w-3/5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-neutral-900">Punto de Venta</h1>
            {tipoVenta !== "LIBRE" && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                {tipoVenta}
              </span>
            )}
          </div>
          <CatalogoPanel onAddServicio={addItem} onScanResult={addItem} />
        </div>

        {/* Panel derecho — carrito */}
        <div className="flex w-1/2 flex-col overflow-hidden lg:w-2/5">
          {caja && (
            <CarritoPanel
              items={items}
              tipoVenta={tipoVenta}
              clienteNombre={clienteNombre}
              clienteId={clienteId}
              ordenServicioId={ordenServicioId}
              ventaIdExistente={ventaIdExistente}
              saldoPendienteExistente={saldoPendienteExistente}
              requiereEnvio={requiereEnvio}
              envioData={envioData}
              onSetRequiereEnvio={setRequiereEnvio}
              onSetEnvioData={setEnvioData}
              onRemoveItem={removeItem}
              onUpdateCantidad={updateCantidad}
              onVentaCreada={(vid, saldo) => {
                setVentaIdExistente(vid);
                setSaldoPendienteExistente(saldo);
              }}
              onPagoRegistrado={resetCarrito}
            />
          )}
        </div>
      </div>
    </CajaGuard>
  );
}
