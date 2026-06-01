import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useBuscarPresupuesto } from "../hooks/useOrdenesServicio";
import type { BuscarPresupuestoParams, PresupuestoItem } from "../types/orden-servicio";

type NivelTab = "compatibilidad" | "marca" | "categoria" | "global";

type Props = {
  tipo: "REPUESTO" | "SERVICIO";
  categoriaId?: string | undefined;
  marcaId?: string | undefined;
  modeloId?: string | undefined;
  componenteId?: string | undefined;
  esPreventivo: boolean;
  onSelect: (item: PresupuestoItem, esPreventivo: boolean) => void;
  onClose: () => void;
};

export function BusquedaPresupuesto({
  tipo,
  categoriaId,
  marcaId,
  modeloId,
  componenteId,
  esPreventivo,
  onSelect,
  onClose,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [activeNivel, setActiveNivel] = useState<NivelTab>("compatibilidad");

  const [filtros, setFiltros] = useState({
    categoria_id: categoriaId,
    marca_id: marcaId,
    modelo_id: modeloId,
    componente_id: componenteId,
  });

  const nivelMap: Record<NivelTab, NonNullable<BuscarPresupuestoParams["nivel"]>> = {
    compatibilidad: "COMPAT",
    marca: "MARCA",
    categoria: "CATEGORIA",
    global: "GLOBAL",
  };

  const params: BuscarPresupuestoParams & { enabled: boolean } = {
    tipo,
    nivel: nivelMap[activeNivel],
    ...(filtros.categoria_id ? { categoria_id: filtros.categoria_id } : {}),
    ...(filtros.marca_id ? { marca_id: filtros.marca_id } : {}),
    ...(filtros.modelo_id ? { modelo_id: filtros.modelo_id } : {}),
    ...(filtros.componente_id ? { componente_id: filtros.componente_id } : {}),
    ...(busqueda ? { busqueda } : {}),
    page,
    pageSize: 50,
    enabled: true,
  };

  const { data, isLoading } = useBuscarPresupuesto(params);
  const result = data?.data;
  const items = result?.items ?? [];
  const counts = result?.counts ?? { compatibilidad: 0, marca: 0, categoria: 0, global: 0 };

  const TABS: { key: NivelTab; label: string }[] = [
    { key: "compatibilidad", label: `Compatibilidad (${counts.compatibilidad})` },
    { key: "marca", label: `Marca (${counts.marca})` },
    { key: "categoria", label: `Categoría (${counts.categoria})` },
    { key: "global", label: `Global (${counts.global})` },
  ];

  function removeFilter(key: keyof typeof filtros) {
    setFiltros((prev) => ({ ...prev, [key]: undefined }));
  }

  function restoreFilters() {
    setFiltros({
      categoria_id: categoriaId,
      marca_id: marcaId,
      modelo_id: modeloId,
      componente_id: componenteId,
    });
  }

  function removeAll() {
    setFiltros({
      categoria_id: undefined,
      marca_id: undefined,
      modelo_id: undefined,
      componente_id: undefined,
    });
  }

  function handleSelect(item: PresupuestoItem) {
    if (tipo === "REPUESTO" && !item.stock_disponible) return;
    onSelect(item, esPreventivo);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
          <h3 className="font-semibold text-neutral-900">
            Buscar {tipo === "REPUESTO" ? "repuesto" : "servicio"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-neutral-200 px-5 py-3 shrink-0 space-y-2">
          <div className="flex flex-wrap gap-1">
            {filtros.categoria_id && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Categoría
                <button
                  type="button"
                  onClick={() => removeFilter("categoria_id")}
                  className="ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filtros.marca_id && (
              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                Marca
                <button type="button" onClick={() => removeFilter("marca_id")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filtros.modelo_id && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Modelo
                <button type="button" onClick={() => removeFilter("modelo_id")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filtros.componente_id && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                Componente
                <button type="button" onClick={() => removeFilter("componente_id")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={removeAll}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200"
            >
              Ver global
            </button>
            <button
              type="button"
              onClick={restoreFilters}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200"
            >
              Restaurar filtros
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 shrink-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveNivel(t.key);
                setPage(1);
              }}
              className={`shrink-0 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeNivel === t.key
                  ? "border-b-2 border-primary-600 text-primary-700"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="py-10 text-center text-sm text-neutral-400">Sin resultados</div>
          )}
          {!isLoading && items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                    Código
                  </th>
                  {tipo === "REPUESTO" && (
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500">
                      Stock
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500">
                    Precio
                  </th>
                  {activeNivel === "global" && (
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-neutral-500">
                      Nivel
                    </th>
                  )}
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => {
                  const disabled = tipo === "REPUESTO" && !item.stock_disponible;
                  return (
                    <tr key={item.id} className={disabled ? "opacity-50" : "hover:bg-neutral-50"}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-neutral-900">{item.nombre}</p>
                        {item.componente_nombre && (
                          <p className="text-xs text-neutral-400">{item.componente_nombre}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                        {item.codigo}
                      </td>
                      {tipo === "REPUESTO" && (
                        <td className="px-4 py-2 text-right text-xs">
                          <span
                            className={item.stock_disponible ? "text-green-700" : "text-red-600"}
                          >
                            {item.stock_total}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-2 text-right font-medium text-neutral-800">
                        S/ {Number(item.precio_venta).toFixed(2)}
                      </td>
                      {activeNivel === "global" && (
                        <td className="px-4 py-2 text-center">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                            {item.nivel_alcance}
                          </span>
                        </td>
                      )}
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSelect(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {(result?.total ?? 0) > 50 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3 shrink-0">
            <p className="text-xs text-neutral-500">{result?.total} resultados</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
