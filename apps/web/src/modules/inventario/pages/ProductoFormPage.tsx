import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useMarcas } from "../../catalogos/hooks/useMarcas";
import { useModelos } from "../../catalogos/hooks/useModelos";
import {
  useCompatibilidades,
  useCreateProducto,
  useProducto,
  useSyncCompatibilidades,
  useUpdateProducto,
} from "../hooks/useInventario";

// ─── Form schema ──────────────────────────────────────────────────────────────

const productoFormSchema = z.object({
  tipo: z.enum(["PRODUCTO", "SERVICIO"] as const),
  nombre: z.string().min(1, "Requerido").max(200),
  descripcion: z.string().optional(),
  categoria_id: z.string().min(1, "Requerido"),
  componente_id: z.string().optional(),
  marca_id: z.string().optional(),
  unidad_medida: z.string().max(10).optional(),
  precio_compra: z.string().optional(),
  precio_venta: z.string().min(1, "Requerido"),
  stock_minimo: z.string().optional(),
  imagen_url: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
});

type ProductoFormValues = z.infer<typeof productoFormSchema>;

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const LABEL = "text-xs font-medium text-neutral-700";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(val: string | undefined): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? undefined : n;
}

function parseIntVal(val: string | undefined): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = Number.parseInt(val, 10);
  return Number.isNaN(n) ? undefined : n;
}

// ─── Compatibilidades section ─────────────────────────────────────────────────

function CompatibilidadesSection({ productoId }: { productoId: string }) {
  const { data: compatData, isLoading: loadingCompat } = useCompatibilidades(productoId);
  const { data: modelosData, isLoading: loadingModelos } = useModelos({
    activo: true,
    pageSize: 200,
  });
  const { data: marcasData } = useMarcas({ activo: true, pageSize: 200 });
  const syncMutation = useSyncCompatibilidades();

  const currentModeloIds = new Set((compatData?.data ?? []).map((c) => c.modelo_id));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized && compatData !== undefined) {
      setSelected(new Set(currentModeloIds));
      setInitialized(true);
    }
  }, [compatData, initialized, currentModeloIds]);

  const modelos = modelosData?.data ?? [];
  const marcas = marcasData?.data ?? [];

  const marcaMap = new Map(marcas.map((m) => [m.id, m.nombre]));

  const byMarca = new Map<string, typeof modelos>();
  for (const m of modelos) {
    const list = byMarca.get(m.marca_id) ?? [];
    list.push(m);
    byMarca.set(m.marca_id, list);
  }

  function toggle(modeloId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(modeloId)) {
        next.delete(modeloId);
      } else {
        next.add(modeloId);
      }
      return next;
    });
  }

  function handleSave() {
    setSyncError(null);
    syncMutation.mutate(
      { productoId, modelo_ids: Array.from(selected) },
      { onError: (err) => setSyncError(err.message) }
    );
  }

  if (loadingCompat || loadingModelos) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (modelos.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No hay modelos registrados. Agrégalos en Catálogos → Modelos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Marca los modelos compatibles con este producto. Se reemplazarán todas las compatibilidades
        al guardar.
      </p>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {Array.from(byMarca.entries()).map(([marcaId, modelosList]) => (
          <div key={marcaId}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {marcaMap.get(marcaId) ?? marcaId}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {modelosList.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:border-primary-300 hover:bg-primary-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-neutral-800">{m.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {syncError !== null && <p className="text-sm text-danger-600">{syncError}</p>}

      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {selected.size} modelo{selected.size !== 1 ? "s" : ""} seleccionado
          {selected.size !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {syncMutation.isPending ? "Guardando..." : "Guardar compatibilidades"}
        </button>
      </div>

      {syncMutation.isSuccess && (
        <p className="text-sm text-green-600">Compatibilidades guardadas correctamente.</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProductoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined && id !== "nuevo";

  const { data: productoData, isLoading: loadingProducto } = useProducto(isEdit ? (id ?? "") : "");

  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 200 });
  const { data: marcasData } = useMarcas({ activo: true, pageSize: 200 });

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();

  const [tab, setTab] = useState<"datos" | "compat">("datos");
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const existing = productoData?.data;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoFormSchema),
    defaultValues: {
      tipo: "PRODUCTO",
      nombre: "",
      descripcion: "",
      categoria_id: "",
      componente_id: "",
      marca_id: "",
      unidad_medida: "UND",
      precio_compra: "",
      precio_venta: "",
      stock_minimo: "0",
      imagen_url: "",
    },
  });

  useEffect(() => {
    if (existing !== undefined) {
      reset({
        tipo: existing.tipo,
        nombre: existing.nombre,
        descripcion: existing.descripcion ?? "",
        categoria_id: existing.categoria_id,
        componente_id: existing.componente_id ?? "",
        marca_id: existing.marca_id ?? "",
        unidad_medida: existing.unidad_medida,
        precio_compra: existing.precio_compra ?? "",
        precio_venta: existing.precio_venta,
        stock_minimo: String(existing.stock_minimo),
        imagen_url: existing.imagen_url ?? "",
      });
    }
  }, [existing, reset]);

  const tipo = useWatch({ control, name: "tipo" });
  const categoriaId = useWatch({ control, name: "categoria_id" });

  const { data: componentesData } = useComponentes({
    activo: true,
    pageSize: 200,
    ...(categoriaId && categoriaId !== "" ? { categoria_id: categoriaId } : {}),
  });

  const categorias = categoriasData?.data ?? [];
  const componentes = componentesData?.data ?? [];
  const marcas = marcasData?.data ?? [];

  const editId = isEdit ? (id ?? "") : (createdId ?? "");

  async function onSubmit(values: ProductoFormValues) {
    setServerError(null);

    const precioVentaNum = parsePrice(values.precio_venta);
    if (precioVentaNum === undefined) {
      setServerError("Precio de venta inválido.");
      return;
    }

    const precioCompra = parsePrice(values.precio_compra);
    const stockMinimo = parseIntVal(values.stock_minimo);

    if (isEdit) {
      const body = {
        id: id ?? "",
        nombre: values.nombre,
        ...(values.descripcion && values.descripcion !== ""
          ? { descripcion: values.descripcion }
          : {}),
        categoria_id: values.categoria_id,
        ...(values.componente_id && values.componente_id !== ""
          ? { componente_id: values.componente_id }
          : {}),
        ...(values.marca_id && values.marca_id !== "" ? { marca_id: values.marca_id } : {}),
        ...(values.unidad_medida && values.unidad_medida !== ""
          ? { unidad_medida: values.unidad_medida }
          : {}),
        ...(precioCompra !== undefined ? { precio_compra: precioCompra } : {}),
        precio_venta: precioVentaNum,
        ...(stockMinimo !== undefined ? { stock_minimo: stockMinimo } : {}),
        ...(values.imagen_url && values.imagen_url !== "" ? { imagen_url: values.imagen_url } : {}),
      };
      updateMutation.mutate(body, {
        onSuccess: () => navigate("/inventario/productos"),
        onError: (err) => setServerError(err.message),
      });
    } else {
      const body = {
        tipo: values.tipo,
        nombre: values.nombre,
        categoria_id: values.categoria_id,
        precio_venta: precioVentaNum,
        ...(values.descripcion && values.descripcion !== ""
          ? { descripcion: values.descripcion }
          : {}),
        ...(values.componente_id && values.componente_id !== ""
          ? { componente_id: values.componente_id }
          : {}),
        ...(values.marca_id && values.marca_id !== "" ? { marca_id: values.marca_id } : {}),
        ...(values.unidad_medida && values.unidad_medida !== ""
          ? { unidad_medida: values.unidad_medida }
          : {}),
        ...(precioCompra !== undefined ? { precio_compra: precioCompra } : {}),
        ...(stockMinimo !== undefined ? { stock_minimo: stockMinimo } : {}),
        ...(values.imagen_url && values.imagen_url !== "" ? { imagen_url: values.imagen_url } : {}),
      };
      createMutation.mutate(body, {
        onSuccess: (res) => {
          setCreatedId(res.data.id);
          setTab("compat");
          navigate(`/inventario/productos/${res.data.id}`, { replace: true });
        },
        onError: (err) => setServerError(err.message),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingProducto) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/inventario/productos")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h1>
          {isEdit && existing !== undefined && (
            <p className="text-sm text-neutral-500">{existing.codigo}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab("datos")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "datos"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Datos generales
        </button>
        <button
          type="button"
          onClick={() => setTab("compat")}
          disabled={!isEdit && editId === ""}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            tab === "compat"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Compatibilidades
        </button>
      </div>

      {/* Tab: Datos generales */}
      {tab === "datos" && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="rounded-xl border border-neutral-200 bg-white">
            <div className="grid grid-cols-2 gap-4 p-6">
              {/* tipo */}
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <label htmlFor="pf-tipo" className={LABEL}>
                  Tipo
                </label>
                <select id="pf-tipo" className={SELECT} {...register("tipo")} disabled={isEdit}>
                  <option value="PRODUCTO">Producto</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>

              {/* nombre */}
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <label htmlFor="pf-nombre" className={LABEL}>
                  Nombre <span className="text-danger-500">*</span>
                </label>
                <input
                  id="pf-nombre"
                  type="text"
                  placeholder="Pantalla LCD Samsung A32"
                  className={INPUT}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <span className="text-xs text-danger-600">{errors.nombre.message}</span>
                )}
              </div>

              {/* descripcion */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-desc" className={LABEL}>
                  Descripción <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <textarea
                  id="pf-desc"
                  rows={2}
                  placeholder="Descripción del producto..."
                  className={`${INPUT} resize-none`}
                  {...register("descripcion")}
                />
              </div>

              {/* categoria_id */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-cat" className={LABEL}>
                  Categoría <span className="text-danger-500">*</span>
                </label>
                <select id="pf-cat" className={SELECT} {...register("categoria_id")}>
                  <option value="">Seleccionar...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <span className="text-xs text-danger-600">{errors.categoria_id.message}</span>
                )}
              </div>

              {/* componente_id */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-comp" className={LABEL}>
                  Componente <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <select id="pf-comp" className={SELECT} {...register("componente_id")}>
                  <option value="">Sin componente</option>
                  {componentes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* marca_id */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-marca" className={LABEL}>
                  Marca <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <select id="pf-marca" className={SELECT} {...register("marca_id")}>
                  <option value="">Sin marca</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* unidad_medida */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-um" className={LABEL}>
                  Unidad de medida
                </label>
                <input
                  id="pf-um"
                  type="text"
                  placeholder="UND"
                  className={INPUT}
                  {...register("unidad_medida")}
                />
              </div>

              {/* precio_venta */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-pv" className={LABEL}>
                  Precio de venta (S/) <span className="text-danger-500">*</span>
                </label>
                <input
                  id="pf-pv"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={INPUT}
                  {...register("precio_venta")}
                />
                {errors.precio_venta && (
                  <span className="text-xs text-danger-600">{errors.precio_venta.message}</span>
                )}
              </div>

              {/* precio_compra — solo PRODUCTO */}
              {tipo === "PRODUCTO" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="pf-pc" className={LABEL}>
                    Precio de compra (S/){" "}
                    <span className="font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <input
                    id="pf-pc"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={INPUT}
                    {...register("precio_compra")}
                  />
                </div>
              )}

              {/* stock_minimo — solo PRODUCTO */}
              {tipo === "PRODUCTO" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="pf-sm" className={LABEL}>
                    Stock mínimo
                    <span
                      className="ml-1 cursor-help text-neutral-400"
                      title="Cantidad mínima antes de generar alerta de reabastecimiento"
                    >
                      ⓘ
                    </span>
                  </label>
                  <input
                    id="pf-sm"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    className={INPUT}
                    title="Cantidad mínima antes de generar alerta de reabastecimiento"
                    {...register("stock_minimo")}
                  />
                </div>
              )}

              {/* imagen_url */}
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="pf-img" className={LABEL}>
                  URL de imagen <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  id="pf-img"
                  type="url"
                  placeholder="https://..."
                  className={INPUT}
                  {...register("imagen_url")}
                />
                {errors.imagen_url && (
                  <span className="text-xs text-danger-600">{errors.imagen_url.message}</span>
                )}
              </div>
            </div>

            {serverError !== null && (
              <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
              <button
                type="button"
                onClick={() => navigate("/inventario/productos")}
                disabled={isPending || isSubmitting}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isPending || isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Compatibilidades */}
      {tab === "compat" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          {editId !== "" ? (
            <CompatibilidadesSection productoId={editId} />
          ) : (
            <p className="text-sm text-neutral-500">
              Guarda el producto primero para agregar compatibilidades.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
