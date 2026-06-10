import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateCotizacionCompraInput, CreateTasaPrecioInput } from "@kallpasoft/validators";
import {
  Camera,
  Check,
  ChevronRight,
  Image,
  MessageCircle,
  Package,
  Pencil,
  Percent,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useMarcas } from "../../catalogos/hooks/useMarcas";
import {
  useCotizaciones,
  useCreateCotizacion,
  useDeleteCotizacion,
  useUpdateCotizacion,
} from "../../compras/hooks/useCotizaciones";
import type { CotizacionDto } from "../../compras/types/cotizacion";
import {
  useCreateProducto,
  useCreateTasaPrecio,
  useDeleteTasaPrecio,
  useProducto,
  useProductos,
  useProveedoresSugeridos,
  useTasasPrecio,
  useUpdateProducto,
} from "../hooks/useInventario";
import type { ProductoDto, ProveedorSugeridoDto } from "../types/inventario";

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const SELECT =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(val: string | null | undefined) {
  if (!val) return "—";
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? "—" : `S/ ${n.toFixed(2)}`;
}

function buildWaUrl(proveedor: ProveedorSugeridoDto, productoNombre: string): string {
  const tel = (proveedor.telefono ?? "").replace(/\D/g, "");
  if (!tel) return "";
  const msg = `Estimado ${proveedor.razon_social}, quisiera consultar precio de ${productoNombre}. ¿Cuál es el costo por unidad?`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const nuevoRepuestoSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(200),
  categoria_id: z.string().min(1, "Requerido"),
  componente_id: z.string().optional(),
  marca_id: z.string().optional(),
  descripcion: z.string().optional(),
  stock_minimo: z.number().int().min(0),
});
type NuevoRepuestoValues = z.infer<typeof nuevoRepuestoSchema>;

const imagenUrlSchema = z.object({
  imagen_url: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
});
type ImagenUrlValues = z.infer<typeof imagenUrlSchema>;

const cotizacionSchema = z.object({
  proveedor_id: z.string().min(1, "Requerido"),
  precio_unitario: z.number().min(0).optional(),
  notas: z.string().optional(),
});
type CotizacionValues = z.infer<typeof cotizacionSchema>;

const tasaSchema = z.object({
  tasa_valor: z.number().min(0),
});
type TasaValues = z.infer<typeof tasaSchema>;

// ─── NuevoRepuestoModal ───────────────────────────────────────────────────────

function NuevoRepuestoModal({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateProducto();
  const { data: categoriasData } = useCategorias({ pageSize: 200, activo: true });
  const { data: componentesData } = useComponentes({ pageSize: 200, activo: true });
  const { data: marcasData } = useMarcas({ pageSize: 200, activo: true });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevoRepuestoValues>({
    resolver: zodResolver(nuevoRepuestoSchema),
    defaultValues: { stock_minimo: 0 },
  });

  async function onSubmit(values: NuevoRepuestoValues) {
    setServerError(null);
    createMutation.mutate(
      {
        tipo: "PRODUCTO",
        nombre: values.nombre,
        categoria_id: values.categoria_id,
        ...(values.componente_id ? { componente_id: values.componente_id } : {}),
        ...(values.marca_id ? { marca_id: values.marca_id } : {}),
        ...(values.descripcion ? { descripcion: values.descripcion } : {}),
        stock_minimo: values.stock_minimo,
      },
      { onSuccess: onClose, onError: (err) => setServerError(err.message) }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Nuevo repuesto</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="rc-nombre" className="text-xs font-medium text-neutral-700">
                Nombre
              </label>
              <input
                id="rc-nombre"
                type="text"
                className={INPUT}
                placeholder="Ej: Pantalla Samsung A52"
                {...register("nombre")}
              />
              {errors.nombre && (
                <span className="text-xs text-danger-600">{errors.nombre.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-categoria-id" className="text-xs font-medium text-neutral-700">
                Categoría
              </label>
              <select id="rc-categoria-id" className={SELECT} {...register("categoria_id")}>
                <option value="">— Selecciona —</option>
                {(categoriasData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.categoria_id && (
                <span className="text-xs text-danger-600">{errors.categoria_id.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-componente-id" className="text-xs font-medium text-neutral-700">
                Componente <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <select id="rc-componente-id" className={SELECT} {...register("componente_id")}>
                <option value="">—</option>
                {(componentesData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-marca-id" className="text-xs font-medium text-neutral-700">
                Marca <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <select id="rc-marca-id" className={SELECT} {...register("marca_id")}>
                <option value="">—</option>
                {(marcasData?.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-stock-minimo" className="text-xs font-medium text-neutral-700">
                Stock mínimo
              </label>
              <input
                id="rc-stock-minimo"
                type="number"
                min={0}
                className={INPUT}
                {...register("stock_minimo", { valueAsNumber: true })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="rc-descripcion" className="text-xs font-medium text-neutral-700">
                Descripción <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                id="rc-descripcion"
                type="text"
                className={INPUT}
                {...register("descripcion")}
              />
            </div>
          </div>
          {serverError !== null && (
            <div className="mx-6 mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-danger-600">
              {serverError}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createMutation.isPending || isSubmitting ? "Creando..." : "Crear repuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PasoImagen ───────────────────────────────────────────────────────────────

function PasoImagen({ producto }: { producto: ProductoDto }) {
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const updateMutation = useUpdateProducto();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ImagenUrlValues>({
    resolver: zodResolver(imagenUrlSchema),
    defaultValues: { imagen_url: producto.imagen_url ?? "" },
  });

  function onSubmit(values: ImagenUrlValues) {
    setServerError(null);
    if (!values.imagen_url) {
      setEditing(false);
      return;
    }
    updateMutation.mutate(
      { id: producto.id, imagen_url: values.imagen_url },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => setServerError(err.message),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900">Imagen del repuesto</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            {producto.imagen_url ? "Cambiar" : "Agregar imagen"}
          </button>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-4">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="h-32 w-32 rounded-xl border border-neutral-200 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50">
              <div className="text-center">
                <Image className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-1 text-xs text-neutral-400">Sin imagen</p>
              </div>
            </div>
          )}
          {producto.imagen_url && (
            <div className="space-y-1 text-xs text-neutral-500">
              <p className="break-all">{producto.imagen_url}</p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="rc-imagen-url" className="text-xs font-medium text-neutral-700">
              URL de imagen
            </label>
            <input
              id="rc-imagen-url"
              type="url"
              placeholder="https://..."
              className={INPUT}
              {...register("imagen_url")}
            />
            {errors.imagen_url && (
              <span className="text-xs text-danger-600">{errors.imagen_url.message}</span>
            )}
          </div>
          {serverError !== null && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-danger-600">{serverError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateMutation.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {updateMutation.isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {producto.imagen_url && !editing && (
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
            <Check className="h-3.5 w-3.5" />
            Imagen registrada
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PasoCotizaciones ─────────────────────────────────────────────────────────

function PasoCotizaciones({ producto }: { producto: ProductoDto }) {
  const [showForm, setShowForm] = useState(false);
  const [editCot, setEditCot] = useState<CotizacionDto | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: cotizData, isLoading } = useCotizaciones({
    producto_id: producto.id,
    pageSize: 50,
  });
  const { data: sugeridosData } = useProveedoresSugeridos(producto.id);
  const createMut = useCreateCotizacion();
  const updateMut = useUpdateCotizacion();
  const deleteMut = useDeleteCotizacion();

  const cotizaciones = cotizData?.data ?? [];
  const sugeridos = [
    ...(sugeridosData?.data?.seguros ?? []),
    ...(sugeridosData?.data?.posibles ?? []),
  ];

  const allProveedores = sugeridos.filter(
    (p) => !cotizaciones.find((c) => c.proveedor_id === p.proveedor_id)
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CotizacionValues>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: { proveedor_id: "", notas: "" },
  });

  function openCreate() {
    setEditCot(null);
    reset({ proveedor_id: "", notas: "" });
    setShowForm(true);
  }

  function openEdit(cot: CotizacionDto) {
    setEditCot(cot);
    reset({
      proveedor_id: cot.proveedor_id,
      precio_unitario: cot.precio_unitario ? Number.parseFloat(cot.precio_unitario) : undefined,
      notas: cot.notas ?? "",
    });
    setShowForm(true);
  }

  function onSubmit(values: CotizacionValues) {
    setServerError(null);
    if (editCot) {
      updateMut.mutate(
        {
          id: editCot.id,
          ...(values.precio_unitario !== undefined
            ? { precio_unitario: values.precio_unitario }
            : {}),
          ...(values.notas ? { notas: values.notas } : {}),
        },
        { onSuccess: () => setShowForm(false), onError: (e) => setServerError(e.message) }
      );
    } else {
      const body: CreateCotizacionCompraInput = {
        proveedor_id: values.proveedor_id,
        producto_id: producto.id,
        ...(values.precio_unitario !== undefined
          ? { precio_unitario: values.precio_unitario }
          : {}),
        ...(values.notas ? { notas: values.notas } : {}),
      };
      createMut.mutate(body, {
        onSuccess: () => setShowForm(false),
        onError: (e) => setServerError(e.message),
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900">
          Cotizaciones ({cotizaciones.length})
        </h3>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva cotización
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3"
        >
          <p className="text-xs font-medium text-primary-700">
            {editCot ? "Editar precio" : "Registrar cotización"}
          </p>
          {!editCot && (
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-proveedor-id" className="text-xs font-medium text-neutral-700">
                Proveedor
              </label>
              <select id="rc-proveedor-id" className={SELECT} {...register("proveedor_id")}>
                <option value="">— Selecciona proveedor —</option>
                {allProveedores.map((p) => (
                  <option key={p.proveedor_id} value={p.proveedor_id}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
              {errors.proveedor_id && (
                <span className="text-xs text-danger-600">{errors.proveedor_id.message}</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-precio-unitario" className="text-xs font-medium text-neutral-700">
                Precio (S/)
              </label>
              <input
                id="rc-precio-unitario"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                className={INPUT}
                {...register("precio_unitario", { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rc-notas" className="text-xs font-medium text-neutral-700">
                Notas
              </label>
              <input id="rc-notas" type="text" className={INPUT} {...register("notas")} />
            </div>
          </div>
          {serverError !== null && <p className="text-xs text-danger-600">{serverError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createMut.isPending || updateMut.isPending || isSubmitting
                ? "Guardando..."
                : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {!isLoading && cotizaciones.length === 0 && (
        <p className="text-center text-sm text-neutral-400 py-6">Sin cotizaciones registradas.</p>
      )}

      {cotizaciones.map((cot) => {
        const proveedor = sugeridos.find((p) => p.proveedor_id === cot.proveedor_id);
        const waUrl = proveedor ? buildWaUrl(proveedor, producto.nombre) : "";
        return (
          <div
            key={cot.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">
                {cot.proveedor_nombre ?? cot.proveedor_id}
              </p>
              <p className="text-sm font-semibold text-primary-700">
                {fmtPEN(cot.precio_unitario)}
              </p>
              {cot.notas && <p className="mt-0.5 truncate text-xs text-neutral-400">{cot.notas}</p>}
            </div>
            <div className="ml-3 flex items-center gap-1 shrink-0">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => openEdit(cot)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteMut.mutate(cot.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {sugeridos.length > 0 && !showForm && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500">Proveedores sugeridos</p>
          <div className="space-y-1">
            {sugeridos.map((p) => {
              const waUrl = buildWaUrl(p, producto.nombre);
              const yaCotizado = cotizaciones.some((c) => c.proveedor_id === p.proveedor_id);
              return (
                <div
                  key={p.proveedor_id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                    yaCotizado ? "bg-green-50 text-green-700" : "bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <span className="font-medium">{p.razon_social}</span>
                  <div className="flex items-center gap-1">
                    {yaCotizado && <Check className="h-3 w-3" />}
                    {waUrl && !yaCotizado && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Consultar
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PasoTasa ─────────────────────────────────────────────────────────────────

function PasoTasa({ producto }: { producto: ProductoDto }) {
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: tasasData } = useTasasPrecio();
  const createMut = useCreateTasaPrecio();
  const deleteMut = useDeleteTasaPrecio();

  const tasaEspecifica = (tasasData?.data ?? []).find(
    (t) => t.nivel === "POR_REPUESTO" && t.producto_id === producto.id
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TasaValues>({
    resolver: zodResolver(tasaSchema),
    defaultValues: {
      tasa_valor: tasaEspecifica ? Number.parseFloat(tasaEspecifica.tasa_valor) : 0,
    },
  });

  function onSubmit(values: TasaValues) {
    setServerError(null);
    const body: CreateTasaPrecioInput = {
      nivel: "POR_REPUESTO",
      producto_id: producto.id,
      tasa_tipo: "PORCENTAJE",
      tasa_valor: values.tasa_valor,
    };
    createMut.mutate(body, {
      onSuccess: () => setShowForm(false),
      onError: (e) => setServerError(e.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900">Tasa de precio (% margen)</h3>
        {!tasaEspecifica && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Asignar tasa
          </button>
        )}
      </div>

      {tasaEspecifica && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Tasa específica para este repuesto</p>
              <p className="text-2xl font-bold text-green-700">
                {Number.parseFloat(tasaEspecifica.tasa_valor).toFixed(1)}%
              </p>
              {tasaEspecifica.precio_venta && (
                <p className="text-xs text-green-600">
                  Precio venta: {fmtPEN(tasaEspecifica.precio_venta)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteMut.mutate(tasaEspecifica.id)}
              disabled={deleteMut.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-danger-600 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!tasaEspecifica && !showForm && (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center">
          <Percent className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-sm text-neutral-400">Sin tasa específica.</p>
          <p className="text-xs text-neutral-400">
            Se aplicarán tasas por componente o tipo si existen.
          </p>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3"
        >
          <p className="text-xs font-medium text-primary-700">Nueva tasa por repuesto</p>
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor="rc-tasa-valor" className="text-xs font-medium text-neutral-700">
                % de margen (sobre costo)
              </label>
              <input
                id="rc-tasa-valor"
                type="number"
                step="0.1"
                min={0}
                placeholder="30"
                className={INPUT}
                {...register("tasa_valor", { valueAsNumber: true })}
              />
              {errors.tasa_valor && (
                <span className="text-xs text-danger-600">{errors.tasa_valor.message}</span>
              )}
            </div>
            <span className="mb-2 text-lg font-bold text-neutral-400">%</span>
          </div>
          {serverError !== null && <p className="text-xs text-danger-600">{serverError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMut.isPending || isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createMut.isPending || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── PanelDetalle ─────────────────────────────────────────────────────────────

type PasoId = "imagen" | "cotizaciones" | "tasa";

const PASOS: { id: PasoId; label: string; icon: React.ReactNode }[] = [
  { id: "imagen", label: "Imagen", icon: <Camera className="h-4 w-4" /> },
  { id: "cotizaciones", label: "Cotizaciones", icon: <Tag className="h-4 w-4" /> },
  { id: "tasa", label: "Tasa precio", icon: <Percent className="h-4 w-4" /> },
];

function PanelDetalle({ productoId }: { productoId: string }) {
  const [paso, setPaso] = useState<PasoId>("imagen");
  const { data, isLoading, isError } = useProducto(productoId);
  const producto = data?.data;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-danger-600">Error al cargar el repuesto.</p>
      </div>
    );
  }

  const haImagen = !!producto.imagen_url;
  const _hasTasa = false; // will be determined in PasoTasa

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-6 py-4">
        <p className="text-xs font-mono text-neutral-400">{producto.codigo}</p>
        <h2 className="mt-0.5 text-base font-semibold text-neutral-900">{producto.nombre}</h2>
        {producto.descripcion && (
          <p className="mt-0.5 text-xs text-neutral-500">{producto.descripcion}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {haImagen && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Check className="h-3 w-3" /> Imagen
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            {fmtPEN(producto.precio_venta)} venta
          </span>
        </div>
      </div>

      <div className="flex border-b border-neutral-200">
        {PASOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPaso(p.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              paso === p.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {paso === "imagen" && <PasoImagen producto={producto} />}
        {paso === "cotizaciones" && <PasoCotizaciones producto={producto} />}
        {paso === "tasa" && <PasoTasa producto={producto} />}
      </div>
    </div>
  );
}

// ─── Filtro chips ─────────────────────────────────────────────────────────────

type FiltroChip = "sin_imagen" | "sin_cotizacion" | "sin_tasa";

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary-600 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RegistroCompletoPage() {
  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState<Set<FiltroChip>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [page, setPage] = useState(1);

  function toggleFiltro(f: FiltroChip) {
    setFiltros((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
    setPage(1);
  }

  const params = {
    tipo: "PRODUCTO" as const,
    activo: true,
    ...(search ? { search } : {}),
    ...(filtros.has("sin_imagen") ? { con_imagen: false } : {}),
    ...(filtros.has("sin_cotizacion") ? { sin_cotizacion: true } : {}),
    ...(filtros.has("sin_tasa") ? { sin_tasa: true } : {}),
    page,
    pageSize: 30,
  };

  const { data, isLoading } = useProductos(params);
  const productos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ─── Panel izquierdo: lista ─────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-neutral-900">Registro completo</h1>
            <button
              type="button"
              onClick={() => setShowNuevo(true)}
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar repuesto..."
              className="w-full rounded-lg border border-neutral-300 py-1.5 pl-8 pr-3 text-xs focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Filter chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ChipButton
              active={filtros.has("sin_imagen")}
              onClick={() => toggleFiltro("sin_imagen")}
            >
              Sin imagen
            </ChipButton>
            <ChipButton
              active={filtros.has("sin_cotizacion")}
              onClick={() => toggleFiltro("sin_cotizacion")}
            >
              Sin cotización
            </ChipButton>
            <ChipButton active={filtros.has("sin_tasa")} onClick={() => toggleFiltro("sin_tasa")}>
              Sin tasa
            </ChipButton>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}
          {!isLoading && productos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-neutral-200" />
              <p className="mt-2 text-sm text-neutral-400">Sin resultados.</p>
            </div>
          )}
          {productos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`flex w-full items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                selectedId === p.id ? "bg-primary-50" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{p.nombre}</p>
                <p className="text-xs text-neutral-400">{p.codigo}</p>
                <div className="mt-0.5 flex gap-1">
                  {p.imagen_url && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Imagen" />
                  )}
                  {p.precio_venta !== "0.00" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" title="Precio venta" />
                  )}
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 shrink-0 ${selectedId === p.id ? "text-primary-600" : "text-neutral-300"}`}
              />
            </button>
          ))}
        </div>

        {/* Pagination */}
        {meta && meta.total > 30 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
            <span>{meta.total} repuestos</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded px-2 py-1 hover:bg-neutral-100 disabled:opacity-40"
              >
                ←
              </button>
              <span>
                {page}/{meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="rounded px-2 py-1 hover:bg-neutral-100 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Panel derecho: detalle ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-neutral-50">
        {selectedId ? (
          <PanelDetalle productoId={selectedId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Package className="h-14 w-14 text-neutral-200" />
            <p className="text-sm font-medium text-neutral-400">
              Selecciona un repuesto para completar su registro
            </p>
            <p className="max-w-xs text-xs text-neutral-300">
              Aquí podrás agregar imagen, registrar cotizaciones de proveedores y asignar tasas de
              precio.
            </p>
          </div>
        )}
      </div>

      {showNuevo && <NuevoRepuestoModal onClose={() => setShowNuevo(false)} />}
    </div>
  );
}
