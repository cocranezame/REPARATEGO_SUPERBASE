import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../shared/stores/auth-store";
import { useCategorias } from "../../catalogos/hooks/useCategorias";
import { useComponentes } from "../../catalogos/hooks/useComponentes";
import { useDeleteProducto, useProductos } from "../hooks/useInventario";
import type { ProductoDto, ProductosParams } from "../types/inventario";

const PAGE_SIZE = 20;

const SELECT =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

function TipoBadge({ tipo }: { tipo: "PRODUCTO" | "SERVICIO" }) {
  return tipo === "PRODUCTO" ? (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      Repuesto
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
      Servicio
    </span>
  );
}

type AlcanceValue = "GLOBAL" | "CATEGORIA" | "MARCA" | "COMPATIBILIDAD";

const ALCANCE_LABEL: Record<AlcanceValue, string> = {
  GLOBAL: "Global",
  CATEGORIA: "Categoría",
  MARCA: "Marca",
  COMPATIBILIDAD: "Compat.",
};

const ALCANCE_CLASS: Record<AlcanceValue, string> = {
  GLOBAL: "bg-neutral-100 text-neutral-600",
  CATEGORIA: "bg-sky-100 text-sky-700",
  MARCA: "bg-amber-100 text-amber-700",
  COMPATIBILIDAD: "bg-emerald-100 text-emerald-700",
};

function AlcanceBadge({ alcance }: { alcance: AlcanceValue | null }) {
  if (!alcance) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ALCANCE_CLASS[alcance]}`}
    >
      {ALCANCE_LABEL[alcance]}
    </span>
  );
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      Inactivo
    </span>
  );
}

function ConfirmModal({
  nombre,
  onConfirm,
  onCancel,
  isLoading,
}: {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <p className="text-sm text-neutral-900">
          ¿Eliminar <strong>{nombre}</strong>? Esta acción lo desactivará.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-500 disabled:opacity-60"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductosPage() {
  const navigate = useNavigate();
  const rol = useAuthStore((s) => s.user?.rol);
  const puedeEscribir = rol === "ADMIN" || rol === "ALMACEN" || rol === "TECNICO";

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterAlcance, setFilterAlcance] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterComponente, setFilterComponente] = useState("");
  const [filterActivo, setFilterActivo] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ProductoDto | null>(null);

  const params: ProductosParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(filterTipo !== "" ? { tipo: filterTipo as "PRODUCTO" | "SERVICIO" } : {}),
    ...(filterCategoria !== "" ? { categoria_id: filterCategoria } : {}),
    ...(filterComponente !== "" ? { componente_id: filterComponente } : {}),
    ...(search !== "" ? { search } : {}),
    ...(filterActivo !== "" ? { activo: filterActivo === "true" } : {}),
  };

  const { data, isLoading, isError } = useProductos(params);
  const deleteMutation = useDeleteProducto();

  const { data: categoriasData } = useCategorias({ activo: true, pageSize: 200 });
  const { data: componentesData } = useComponentes({
    activo: true,
    pageSize: 200,
    ...(filterCategoria !== "" ? { categoria_id: filterCategoria } : {}),
  });

  const categorias = categoriasData?.data ?? [];
  const componentes = componentesData?.data ?? [];

  function resetFilters() {
    setSearch("");
    setFilterTipo("");
    setFilterAlcance("");
    setFilterCategoria("");
    setFilterComponente("");
    setFilterActivo("");
    setPage(1);
  }

  const hasFilters =
    search !== "" ||
    filterTipo !== "" ||
    filterAlcance !== "" ||
    filterCategoria !== "" ||
    filterComponente !== "" ||
    filterActivo !== "";

  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Repuestos</h1>
        {puedeEscribir && (
          <button
            type="button"
            onClick={() => navigate("/inventario/productos/nuevo")}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo repuesto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre o código..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={filterTipo}
          onChange={(e) => {
            setFilterTipo(e.target.value);
            setFilterAlcance("");
            setPage(1);
          }}
          className={SELECT}
        >
          <option value="">Repuesto + Servicio</option>
          <option value="PRODUCTO">Repuesto</option>
          <option value="SERVICIO">Servicio</option>
        </select>
        {(filterTipo === "PRODUCTO" || filterTipo === "") && (
          <select
            value={filterAlcance}
            onChange={(e) => {
              setFilterAlcance(e.target.value);
              setPage(1);
            }}
            className={SELECT}
          >
            <option value="">Todos los alcances</option>
            <option value="GLOBAL">Global</option>
            <option value="CATEGORIA">Por categoría</option>
            <option value="MARCA">Por marca</option>
            <option value="COMPATIBILIDAD">Por compatibilidad</option>
          </select>
        )}
        <select
          value={filterCategoria}
          onChange={(e) => {
            setFilterCategoria(e.target.value);
            setFilterComponente("");
            setPage(1);
          }}
          className={SELECT}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {componentes.length > 0 && (
          <select
            value={filterComponente}
            onChange={(e) => {
              setFilterComponente(e.target.value);
              setPage(1);
            }}
            className={SELECT}
          >
            <option value="">Todos los componentes</option>
            {componentes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
        <select
          value={filterActivo}
          onChange={(e) => {
            setFilterActivo(e.target.value);
            setPage(1);
          }}
          className={SELECT}
        >
          <option value="">Activos + Inactivos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger-600">
            Error al cargar repuestos. Intenta recargar la página.
          </p>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 md:table-cell">
                  Tipo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Alcance
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Precio venta
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 lg:table-cell">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-neutral-500">
                    No se encontraron repuestos.
                  </td>
                </tr>
              )}
              {data?.data.map((p) => {
                const stockActual = 0;
                const bajStock = stockActual < p.stock_minimo && p.tipo === "PRODUCTO";
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-medium text-neutral-700">
                        {p.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{p.nombre}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <TipoBadge tipo={p.tipo} />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {p.tipo === "PRODUCTO" && <AlcanceBadge alcance={p.alcance} />}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-neutral-700 lg:table-cell">
                      S/ {Number(p.precio_venta).toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={bajStock ? "font-medium text-danger-600" : "text-neutral-700"}
                        >
                          {stockActual}
                        </span>
                        {bajStock && <AlertTriangle className="h-3.5 w-3.5 text-danger-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={p.activo} />
                    </td>
                    {puedeEscribir && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/inventario/productos/${p.id}`)}
                            title="Editar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(p)}
                            title="Eliminar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-danger-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta !== undefined && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {meta.total} repuesto{meta.total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-xs">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {pendingDelete !== null && (
        <ConfirmModal
          nombre={pendingDelete.nombre}
          onConfirm={() => {
            if (pendingDelete !== null) {
              deleteMutation.mutate(pendingDelete.id, {
                onSuccess: () => setPendingDelete(null),
              });
            }
          }}
          onCancel={() => setPendingDelete(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
