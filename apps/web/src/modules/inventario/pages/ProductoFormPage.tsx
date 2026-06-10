import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { SearchableSelect } from "../../../shared/components/SearchableSelect";
import { useCategorias, useCreateCategoria } from "../../catalogos/hooks/useCategorias";
import { useComponentes, useCreateComponente } from "../../catalogos/hooks/useComponentes";
import { useCreateMarca, useMarcas } from "../../catalogos/hooks/useMarcas";
import { useCreateModelo, useModelos } from "../../catalogos/hooks/useModelos";
import { useCreateTipoRepuesto, useTiposRepuesto } from "../../catalogos/hooks/useTiposRepuesto";
import {
  useCategoriasProducto,
  useCompatibilidades,
  useCreateProducto,
  useProducto,
  useSyncCategoriasProducto,
  useSyncCompatibilidades,
  useUpdateProducto,
} from "../hooks/useInventario";

// ─── Schema ───────────────────────────────────────────────────────────────────

const catRowSchema = z.object({
  categoria_id: z.string(),
  componente_id: z.string().optional(),
});

const productoFormSchema = z.object({
  tipo: z.enum(["PRODUCTO", "SERVICIO"] as const),
  alcance: z.enum(["GLOBAL", "CATEGORIA", "MARCA", "COMPATIBILIDAD"] as const),
  nombre: z.string().min(1, "Requerido").max(200),
  descripcion: z.string().optional(),
  // GLOBAL
  componente_global: z.string().optional(),
  marca_global: z.string().optional(),
  // CATEGORIA — array of rows
  catRows: z.array(catRowSchema),
  marca_cat: z.string().optional(),
  // MARCA + COMPATIBILIDAD
  categoria_id: z.string().optional(),
  componente_id: z.string().optional(),
  marca_id: z.string().optional(),
  // COMPATIBILIDAD — modelos seleccionados
  modelo_ids: z.array(z.string()),
  // Tipo dependiente de componente
  tipo_repuesto_id: z.string().optional(),
  // Common
  stock_minimo: z.string().optional(),
  imagen_url: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
});

type ProductoFormValues = z.infer<typeof productoFormSchema>;

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const LABEL = "text-xs font-medium text-neutral-700";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseIntVal(val: string | undefined): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = Number.parseInt(val, 10);
  return Number.isNaN(n) ? undefined : n;
}

function fmtPEN(val: string | null | undefined): string {
  if (!val) return "—";
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? "—" : `S/ ${n.toFixed(2)}`;
}

// ─── Precios info (readonly) ──────────────────────────────────────────────────

function PreciosInfo({
  precioVenta,
  precioCompra,
}: {
  precioVenta: string | undefined;
  precioCompra: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Precios</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-neutral-500">Precio de venta</p>
          <p className="mt-0.5 text-base font-semibold text-neutral-900">{fmtPEN(precioVenta)}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            Calculado desde{" "}
            <a href="/inventario/tasas-precio" className="text-primary-600 hover:underline">
              Tasas %
            </a>
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Precio de costo</p>
          <p className="mt-0.5 text-base font-semibold text-neutral-900">{fmtPEN(precioCompra)}</p>
          <p className="mt-0.5 text-xs text-neutral-400">Cotización del último ingreso</p>
        </div>
      </div>
    </div>
  );
}

// ─── CatRow — fila de categoría + componente con SearchableSelect ─────────────

function CatRow({
  index,
  control,
  setValue,
  onRemove,
  canRemove,
  onComponenteChange,
}: {
  index: number;
  control: ReturnType<typeof useForm<ProductoFormValues>>["control"];
  setValue: ReturnType<typeof useForm<ProductoFormValues>>["setValue"];
  onRemove: () => void;
  canRemove: boolean;
  onComponenteChange?: ((val: string) => void) | undefined;
}) {
  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 200 });
  const catId = useWatch({ control, name: `catRows.${index}.categoria_id` });
  const { data: componentesData } = useComponentes({
    activo: true,
    pageSize: 200,
    ...(catId ? { categoria_id: catId } : {}),
  });
  const createCategoria = useCreateCategoria();
  const createComponente = useCreateComponente();

  const categoriasOpts = (categoriasData?.data ?? []).map((c) => ({
    value: c.id,
    label: c.nombre,
  }));
  const componentesOpts = (componentesData?.data ?? []).map((c) => ({
    value: c.id,
    label: c.nombre,
  }));

  return (
    <div className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex-1 flex flex-col gap-1">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
        <label className={LABEL}>
          Categoría <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name={`catRows.${index}.categoria_id`}
          render={({ field }) => (
            <SearchableSelect
              options={categoriasOpts}
              value={field.value ?? ""}
              onChange={(val) => {
                field.onChange(val);
                setValue(`catRows.${index}.componente_id`, "");
              }}
              placeholder="— Selecciona categoría —"
              onCreate={async (nombre) => {
                const res = await createCategoria.mutateAsync({ nombre, orden: 0 });
                return res.data.id;
              }}
            />
          )}
        />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
        <label className={LABEL}>Componente (opcional)</label>
        <Controller
          control={control}
          name={`catRows.${index}.componente_id`}
          render={({ field }) => (
            <SearchableSelect
              options={componentesOpts}
              value={field.value ?? ""}
              onChange={(val) => {
                field.onChange(val);
                onComponenteChange?.(val);
              }}
              placeholder={catId ? "— Selecciona —" : "— Primero categoría —"}
              disabled={!catId}
              {...(catId
                ? {
                    onCreate: async (nombre: string) => {
                      const res = await createComponente.mutateAsync({
                        categoria_id: catId,
                        nombre,
                      });
                      return res.data.id;
                    },
                  }
                : {})}
            />
          )}
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── CompatibilidadSelector — form-controlled, con create inline ─────────────

function CompatibilidadSelector({
  marcaId,
  categoriaId,
  value,
  onChange,
}: {
  marcaId: string;
  categoriaId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const createModelo = useCreateModelo();
  const { data: modelosData, isLoading } = useModelos({
    activo: true,
    pageSize: 300,
    ...(marcaId ? { marca_id: marcaId } : {}),
    ...(categoriaId ? { categoria_id: categoriaId } : {}),
    enabled: !!(marcaId || categoriaId),
  });

  const modelos = modelosData?.data ?? [];
  const selectedSet = new Set(value);

  function toggle(modeloId: string) {
    const next = new Set(selectedSet);
    if (next.has(modeloId)) next.delete(modeloId);
    else next.add(modeloId);
    onChange(Array.from(next));
  }

  if (!marcaId && !categoriaId) {
    return (
      <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
        Selecciona una categoría y marca para ver los modelos disponibles.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador / crear nuevo modelo */}
      <div className="flex flex-col gap-1">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
        <label className="text-xs font-medium text-neutral-500">
          Buscar modelo o registrar nuevo
        </label>
        <SearchableSelect
          options={modelos
            .filter((m) => !selectedSet.has(m.id))
            .map((m) => ({ value: m.id, label: m.nombre }))}
          value=""
          onChange={(id) => {
            if (!id || selectedSet.has(id)) return;
            onChange([...value, id]);
          }}
          placeholder="Escribir para buscar o crear..."
          onCreate={async (nombre) => {
            if (!marcaId || !categoriaId) return "";
            const res = await createModelo.mutateAsync({
              nombre,
              marca_id: marcaId,
              categoria_id: categoriaId,
            });
            const newId = res.data.id;
            onChange([...value, newId]);
            return newId;
          }}
        />
        {(!marcaId || !categoriaId) && (
          <p className="text-xs text-amber-600">
            {!marcaId ? "Selecciona una marca" : "Selecciona una categoría"} para poder crear
            modelos.
          </p>
        )}
      </div>

      {/* Grid de modelos */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-xs text-neutral-400">Cargando modelos...</span>
        </div>
      ) : modelos.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          No hay modelos registrados. Escribe un nombre arriba para crear uno.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Clic para seleccionar / deseleccionar
            {value.length > 0 && (
              <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                {value.length} seleccionado{value.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {modelos.map((m) => {
              const isSel = selectedSet.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-all select-none ${
                    isSel
                      ? "border-green-400 bg-green-50 text-green-800 shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:bg-primary-50"
                  }`}
                >
                  <span className="truncate font-medium">{m.nombre}</span>
                  {isSel && <span className="ml-1 text-xs text-green-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProductoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined && id !== "nuevo";
  const formId = useId();

  const { data: productoData, isLoading: loadingProducto } = useProducto(isEdit ? (id ?? "") : "");

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const createCategoria = useCreateCategoria();
  const createMarca = useCreateMarca();
  const createComponente = useCreateComponente();
  const syncCategorias = useSyncCategoriasProducto();
  const syncCompatibilidades = useSyncCompatibilidades();

  const [serverError, setServerError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const existing = productoData?.data;
  const editId = isEdit ? (id ?? "") : (createdId ?? "");

  const { data: categoriasProductoData } = useCategoriasProducto(editId);
  const { data: compatibilidadesData } = useCompatibilidades(editId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoFormSchema),
    defaultValues: {
      tipo: "PRODUCTO",
      alcance: "GLOBAL",
      nombre: "",
      descripcion: "",
      componente_global: "",
      marca_global: "",
      catRows: [{ categoria_id: "", componente_id: "" }],
      marca_cat: "",
      categoria_id: "",
      componente_id: "",
      marca_id: "",
      modelo_ids: [],
      tipo_repuesto_id: "",
      stock_minimo: "0",
      imagen_url: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "catRows" });

  // Evita que refetches de sub-queries reseteen el form mientras el usuario edita.
  // Se guarda el id del producto ya inicializado; "new" para productos nuevos.
  const initializedForId = useRef<string>("");

  useEffect(() => {
    if (existing === undefined) return;
    const alcance = existing.alcance ?? "GLOBAL";

    // Esperar sub-queries necesarias antes de inicializar
    if (alcance === "CATEGORIA" && isEdit && categoriasProductoData === undefined) return;
    if (alcance === "COMPATIBILIDAD" && isEdit && compatibilidadesData === undefined) return;

    // Solo inicializar una vez por producto
    const key = isEdit ? (id ?? "new") : "new";
    if (initializedForId.current === key) return;
    initializedForId.current = key;

    let catRowsLoaded: { categoria_id: string; componente_id: string }[];
    if (alcance === "CATEGORIA" && categoriasProductoData !== undefined) {
      catRowsLoaded =
        categoriasProductoData.data.length > 0
          ? categoriasProductoData.data.map((r) => ({
              categoria_id: r.categoria_id,
              componente_id: r.componente_id ?? "",
            }))
          : [{ categoria_id: "", componente_id: "" }];
    } else {
      catRowsLoaded = [{ categoria_id: "", componente_id: "" }];
    }

    const modeloIdsLoaded =
      alcance === "COMPATIBILIDAD" && compatibilidadesData !== undefined
        ? compatibilidadesData.data.map((c) => c.modelo_id)
        : [];

    reset({
      tipo: existing.tipo as "PRODUCTO" | "SERVICIO",
      alcance,
      nombre: existing.nombre,
      descripcion: existing.descripcion ?? "",
      componente_global: alcance === "GLOBAL" ? (existing.componente_id ?? "") : "",
      marca_global: alcance === "GLOBAL" ? (existing.marca_id ?? "") : "",
      catRows: catRowsLoaded,
      marca_cat: alcance === "CATEGORIA" ? (existing.marca_id ?? "") : "",
      categoria_id:
        alcance === "MARCA" || alcance === "COMPATIBILIDAD" ? (existing.categoria_id ?? "") : "",
      componente_id:
        alcance === "MARCA" || alcance === "COMPATIBILIDAD" ? (existing.componente_id ?? "") : "",
      marca_id:
        alcance === "MARCA" || alcance === "COMPATIBILIDAD" ? (existing.marca_id ?? "") : "",
      modelo_ids: modeloIdsLoaded,
      tipo_repuesto_id: existing.tipo_repuesto_id ?? "",
      stock_minimo: String(existing.stock_minimo),
      imagen_url: existing.imagen_url ?? "",
    });
  }, [existing, categoriasProductoData, compatibilidadesData, reset, isEdit, id]);

  const tipo = useWatch({ control, name: "tipo" });
  const alcance = useWatch({ control, name: "alcance" });

  // Active componente per alcance
  const compGlobal = useWatch({ control, name: "componente_global" });
  const compCatFirst = useWatch({ control, name: "catRows.0.componente_id" });
  const compId = useWatch({ control, name: "componente_id" });
  const catMarcaId = useWatch({ control, name: "categoria_id" });
  const marcaCompatId = useWatch({ control, name: "marca_id" });

  const activeComponenteId =
    alcance === "GLOBAL"
      ? (compGlobal ?? "")
      : alcance === "CATEGORIA"
        ? (compCatFirst ?? "")
        : (compId ?? "");

  // Data fetches
  const { data: marcasData } = useMarcas({ activo: true, pageSize: 200 });
  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 200 });
  const { data: componentesGlobalData } = useComponentes({ activo: true, pageSize: 200 });
  const { data: componentesMarcaData } = useComponentes({
    activo: true,
    pageSize: 200,
    ...(catMarcaId ? { categoria_id: catMarcaId } : {}),
  });
  // En edit mode, mientras activeComponenteId aún es "" (antes del reset),
  // usar existing.componente_id para disparar el query y tener el caché listo
  const _tiposCompId =
    activeComponenteId ||
    (isEdit && existing
      ? (existing.alcance ?? "GLOBAL") === "CATEGORIA"
        ? (categoriasProductoData?.data[0]?.componente_id ?? "")
        : (existing.componente_id ?? "")
      : "");
  const { data: tiposRepuestoData } = useTiposRepuesto({
    ...(_tiposCompId ? { componente_id: _tiposCompId } : {}),
    activo: true,
    pageSize: 100,
  });
  const createTipoRepuesto = useCreateTipoRepuesto();

  const marcas = marcasData?.data ?? [];
  const categorias = categoriasData?.data ?? [];
  const componentesGlobal = componentesGlobalData?.data ?? [];
  const componentesMarca = componentesMarcaData?.data ?? [];
  const tiposRepuesto = tiposRepuestoData?.data ?? [];

  // Modelos para generar nombre en COMPATIBILIDAD
  const { data: modelosForGenData } = useModelos({
    activo: true,
    pageSize: 300,
    ...(marcaCompatId ? { marca_id: marcaCompatId } : {}),
    ...(catMarcaId ? { categoria_id: catMarcaId } : {}),
    enabled: alcance === "COMPATIBILIDAD" && !!(marcaCompatId || catMarcaId),
  });
  const modelosForGen = modelosForGenData?.data ?? [];

  // Options for SearchableSelect
  const marcasOpts = marcas.map((m) => ({ value: m.id, label: m.nombre }));
  const categoriasOpts = categorias.map((c) => ({ value: c.id, label: c.nombre }));
  const compGlobalOpts = componentesGlobal.map((c) => ({ value: c.id, label: c.nombre }));
  const compMarcaOpts = componentesMarca.map((c) => ({ value: c.id, label: c.nombre }));
  const tiposOpts = tiposRepuesto.map((t) => ({ value: t.id, label: t.nombre }));

  // ── Generar nombre — construye desde los campos del alcance actual ──────────

  function buildGenName(): string {
    const vals = getValues();
    const allComps = [...componentesGlobal, ...componentesMarca];

    let cId = "";
    if (alcance === "CATEGORIA") cId = vals.catRows[0]?.componente_id ?? "";
    else if (alcance === "MARCA" || alcance === "COMPATIBILIDAD") cId = vals.componente_id ?? "";
    const compName = allComps.find((c) => c.id === cId)?.nombre;

    let mId = "";
    if (alcance === "CATEGORIA") mId = vals.marca_cat ?? "";
    else if (alcance === "MARCA" || alcance === "COMPATIBILIDAD") mId = vals.marca_id ?? "";
    const marcaName = marcas.find((m) => m.id === mId)?.nombre;

    const tipoName = tiposRepuesto.find((t) => t.id === vals.tipo_repuesto_id)?.nombre;

    const parts: string[] = [];
    if (compName) parts.push(compName);
    if (marcaName) parts.push(marcaName);
    if (tipoName) parts.push(tipoName);
    if (alcance === "COMPATIBILIDAD") {
      const selectedModelos = modelosForGen.filter((m) => (vals.modelo_ids ?? []).includes(m.id));
      if (selectedModelos.length > 0) parts.push(selectedModelos.map((m) => m.nombre).join(" / "));
    }
    return parts.join(" ");
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: ProductoFormValues) {
    setServerError(null);
    const stockMinimo = parseIntVal(values.stock_minimo);

    let resolvedCatId: string | undefined;
    let resolvedCompId: string | undefined;
    let resolvedMarcaId: string | undefined;

    if (values.alcance === "GLOBAL") {
      resolvedCompId = values.componente_global || undefined;
      resolvedMarcaId = values.marca_global || undefined;
    } else if (values.alcance === "CATEGORIA") {
      resolvedMarcaId = values.marca_cat || undefined;
    } else {
      resolvedCatId = values.categoria_id || undefined;
      resolvedCompId = values.componente_id || undefined;
      resolvedMarcaId = values.marca_id || undefined;
    }

    const common = {
      alcance: values.alcance,
      nombre: values.nombre,
      ...(values.descripcion ? { descripcion: values.descripcion } : {}),
      ...(resolvedCatId ? { categoria_id: resolvedCatId } : {}),
      ...(resolvedCompId ? { componente_id: resolvedCompId } : {}),
      ...(resolvedMarcaId ? { marca_id: resolvedMarcaId } : {}),
      ...(values.tipo_repuesto_id ? { tipo_repuesto_id: values.tipo_repuesto_id } : {}),
      ...(stockMinimo !== undefined ? { stock_minimo: stockMinimo } : {}),
      ...(values.imagen_url && values.imagen_url !== "" ? { imagen_url: values.imagen_url } : {}),
    };

    const pares =
      values.alcance === "CATEGORIA"
        ? values.catRows
            .filter((r) => r.categoria_id !== "")
            .map((r) => ({
              categoria_id: r.categoria_id,
              ...(r.componente_id && r.componente_id !== ""
                ? { componente_id: r.componente_id }
                : {}),
            }))
        : [];

    if (isEdit) {
      try {
        await updateMutation.mutateAsync({ id: id ?? "", ...common });
        if (values.alcance === "CATEGORIA") {
          await syncCategorias.mutateAsync({ productoId: id ?? "", pares });
        }
        if (values.alcance === "COMPATIBILIDAD") {
          await syncCompatibilidades.mutateAsync({
            productoId: id ?? "",
            modelo_ids: values.modelo_ids,
          });
        }
        navigate("/inventario/productos");
      } catch (err) {
        setServerError((err as Error).message);
      }
    } else {
      try {
        const res = await createMutation.mutateAsync({
          tipo: values.tipo === "PRODUCTO" ? "PRODUCTO" : "SERVICIO",
          ...common,
        });
        const newId = res.data.id;
        if (values.alcance === "CATEGORIA") {
          await syncCategorias.mutateAsync({ productoId: newId, pares });
        }
        if (values.alcance === "COMPATIBILIDAD") {
          await syncCompatibilidades.mutateAsync({
            productoId: newId,
            modelo_ids: values.modelo_ids,
          });
        }
        setCreatedId(newId);
        navigate(`/inventario/productos/${newId}`, { replace: true });
      } catch (err) {
        setServerError((err as Error).message);
      }
    }
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    syncCategorias.isPending ||
    syncCompatibilidades.isPending;

  if (isEdit && loadingProducto) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // ── Shared catalog field block (tipo + subtipo, below componente) ─────────

  function CatalogDependents({ componenteId }: { componenteId: string }) {
    if (!componenteId) return null;
    return (
      <div className="flex flex-col gap-1">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
        <label className={LABEL}>Tipo</label>
        <Controller
          control={control}
          name="tipo_repuesto_id"
          render={({ field }) => (
            <SearchableSelect
              options={tiposOpts}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="— Selecciona tipo —"
              onCreate={async (nombre) => {
                const res = await createTipoRepuesto.mutateAsync({
                  componente_id: componenteId,
                  nombre,
                });
                return res.data.id;
              }}
            />
          )}
        />
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
            {isEdit ? "Editar repuesto" : "Nuevo repuesto"}
          </h1>
          {isEdit && existing !== undefined && (
            <p className="text-sm text-neutral-500">{existing.codigo}</p>
          )}
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="space-y-5 p-6">
            {/* ── Tipo + Alcance ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={LABEL} htmlFor="pf-tipo">
                  Clasificación
                </label>
                <select
                  id="pf-tipo"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  {...register("tipo")}
                >
                  <option value="PRODUCTO">Repuesto</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>
              {tipo === "PRODUCTO" && (
                <div className="flex flex-col gap-1">
                  <label className={LABEL} htmlFor="pf-alcance">
                    Alcance <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pf-alcance"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    {...register("alcance")}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="CATEGORIA">Por categoría</option>
                    <option value="MARCA">Por marca</option>
                    <option value="COMPATIBILIDAD">Por compatibilidad</option>
                  </select>
                </div>
              )}
            </div>

            {/* ── Nombre + Generar ───────────────────────────────────── */}
            <div className="flex flex-col gap-1">
              <label className={LABEL} htmlFor="pf-nombre">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="pf-nombre"
                  type="text"
                  placeholder="Pantalla LCD Samsung A32"
                  className={`${INPUT} flex-1`}
                  {...register("nombre")}
                />
                {alcance !== "GLOBAL" && tipo === "PRODUCTO" && (
                  <button
                    type="button"
                    onClick={() => {
                      const name = buildGenName();
                      if (name) setValue("nombre", name);
                    }}
                    className="flex h-full shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generar
                  </button>
                )}
              </div>
              {errors.nombre && (
                <span className="text-xs text-red-600">{errors.nombre.message}</span>
              )}
            </div>

            {/* ── Descripción ────────────────────────────────────────── */}
            <div className="flex flex-col gap-1">
              <label className={LABEL} htmlFor="pf-descripcion">
                Descripción <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <textarea
                id="pf-descripcion"
                rows={2}
                className={`${INPUT} resize-none`}
                {...register("descripcion")}
              />
            </div>

            <hr className="border-neutral-100" />

            {/* ── Campos por alcance ─────────────────────────────────── */}

            {/* GLOBAL */}
            {alcance === "GLOBAL" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Alcance global — aplica a cualquier categoría
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>Componente (opcional)</label>
                    <Controller
                      control={control}
                      name="componente_global"
                      render={({ field }) => (
                        <SearchableSelect
                          options={compGlobalOpts}
                          value={field.value ?? ""}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue("tipo_repuesto_id", "");
                          }}
                          placeholder="— Selecciona —"
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>Marca (opcional)</label>
                    <Controller
                      control={control}
                      name="marca_global"
                      render={({ field }) => (
                        <SearchableSelect
                          options={marcasOpts}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="— Selecciona —"
                          onCreate={async (nombre) => {
                            const res = await createMarca.mutateAsync({ nombre });
                            return res.data.id;
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
                <CatalogDependents componenteId={compGlobal ?? ""} />
              </div>
            )}

            {/* CATEGORIA — multi-row */}
            {alcance === "CATEGORIA" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Categorías del repuesto
                  </p>
                  <button
                    type="button"
                    onClick={() => append({ categoria_id: "", componente_id: "" })}
                    className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar categoría
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <CatRow
                      key={field.id}
                      index={idx}
                      control={control}
                      setValue={setValue}
                      onRemove={() => remove(idx)}
                      canRemove={fields.length > 1}
                      onComponenteChange={
                        idx === 0 ? () => setValue("tipo_repuesto_id", "") : undefined
                      }
                    />
                  ))}
                </div>
                {fields.length > 1 && (
                  <p className="text-xs text-amber-600">
                    Nota: se guarda la primera categoría como principal. Las adicionales quedarán en
                    próxima versión.
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                  <label className={LABEL}>Marca (opcional)</label>
                  <Controller
                    control={control}
                    name="marca_cat"
                    render={({ field }) => (
                      <SearchableSelect
                        options={marcasOpts}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="— Selecciona —"
                        onCreate={async (nombre) => {
                          const res = await createMarca.mutateAsync({ nombre });
                          return res.data.id;
                        }}
                      />
                    )}
                  />
                </div>
                <CatalogDependents componenteId={compCatFirst ?? ""} />
              </div>
            )}

            {/* MARCA */}
            {alcance === "MARCA" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Por marca específica
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="categoria_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={categoriasOpts}
                          value={field.value ?? ""}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue("componente_id", "");
                          }}
                          placeholder="— Selecciona —"
                          onCreate={async (nombre) => {
                            const res = await createCategoria.mutateAsync({ nombre, orden: 0 });
                            return res.data.id;
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Componente <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="componente_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={compMarcaOpts}
                          value={field.value ?? ""}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue("tipo_repuesto_id", "");
                          }}
                          placeholder={catMarcaId ? "— Selecciona —" : "— Primero categoría —"}
                          disabled={!catMarcaId}
                          {...(catMarcaId
                            ? {
                                onCreate: async (nombre: string) => {
                                  const res = await createComponente.mutateAsync({
                                    categoria_id: catMarcaId,
                                    nombre,
                                  });
                                  return res.data.id;
                                },
                              }
                            : {})}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="marca_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={marcasOpts}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="— Selecciona —"
                          onCreate={async (nombre) => {
                            const res = await createMarca.mutateAsync({ nombre });
                            return res.data.id;
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
                <CatalogDependents componenteId={compId ?? ""} />
              </div>
            )}

            {/* COMPATIBILIDAD */}
            {alcance === "COMPATIBILIDAD" && (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Compatibilidad con modelos
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="categoria_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={categoriasOpts}
                          value={field.value ?? ""}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue("componente_id", "");
                          }}
                          placeholder="— Selecciona —"
                          onCreate={async (nombre) => {
                            const res = await createCategoria.mutateAsync({ nombre, orden: 0 });
                            return res.data.id;
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Componente <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="componente_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={compMarcaOpts}
                          value={field.value ?? ""}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue("tipo_repuesto_id", "");
                          }}
                          placeholder={catMarcaId ? "— Selecciona —" : "— Primero categoría —"}
                          disabled={!catMarcaId}
                          {...(catMarcaId
                            ? {
                                onCreate: async (nombre: string) => {
                                  const res = await createComponente.mutateAsync({
                                    categoria_id: catMarcaId,
                                    nombre,
                                  });
                                  return res.data.id;
                                },
                              }
                            : {})}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: SearchableSelect is a custom component */}
                    <label className={LABEL}>
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="marca_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={marcasOpts}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="— Selecciona —"
                          onCreate={async (nombre) => {
                            const res = await createMarca.mutateAsync({ nombre });
                            return res.data.id;
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
                <CatalogDependents componenteId={compId ?? ""} />

                <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Selecciona compatibilidad
                  </p>
                  <Controller
                    control={control}
                    name="modelo_ids"
                    render={({ field }) => (
                      <CompatibilidadSelector
                        marcaId={marcaCompatId ?? ""}
                        categoriaId={catMarcaId ?? ""}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            <hr className="border-neutral-100" />

            {/* ── Otros ──────────────────────────────────────────────── */}
            {tipo === "PRODUCTO" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={LABEL} htmlFor="pf-stock-minimo">
                    Stock mínimo{" "}
                    <span className="font-normal text-neutral-400" title="Alerta reabastecimiento">
                      ⓘ
                    </span>
                  </label>
                  <input
                    id="pf-stock-minimo"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    className={INPUT}
                    {...register("stock_minimo")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={LABEL} htmlFor="pf-imagen-url">
                    URL de imagen <span className="font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <input
                    id="pf-imagen-url"
                    type="url"
                    placeholder="https://..."
                    className={INPUT}
                    {...register("imagen_url")}
                  />
                  {errors.imagen_url && (
                    <span className="text-xs text-red-600">{errors.imagen_url.message}</span>
                  )}
                </div>
              </div>
            )}

            {isEdit && tipo === "PRODUCTO" && (
              <PreciosInfo
                precioVenta={existing?.precio_venta}
                precioCompra={existing?.precio_compra}
              />
            )}
          </div>

          {serverError !== null && (
            <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
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
              form={formId}
              disabled={isPending || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
