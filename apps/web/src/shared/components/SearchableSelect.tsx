import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** If provided, shows "Crear '[text]'" as the first option when the typed text doesn't match any existing option */
  onCreate?: (name: string) => Promise<string>;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— Selecciona —",
  disabled,
  onCreate,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  const canCreate =
    onCreate !== undefined &&
    search.trim() !== "" &&
    !filtered.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setCreateError(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
    setCreateError(null);
  }

  async function handleCreate() {
    if (!onCreate || !search.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const newId = await onCreate(search.trim());
      handleSelect(newId);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative${className ? ` ${className}` : ""}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`truncate ${selectedLabel ? "text-neutral-900" : "text-neutral-400"}`}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-neutral-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) void handleCreate();
                  else if (filtered.length === 1 && filtered[0]) handleSelect(filtered[0].value);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setSearch("");
                }
              }}
              placeholder="Escribir para buscar..."
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {/* Create option */}
            {canCreate && (
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2 text-left text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {creating ? "Creando..." : `Crear "${search.trim()}"`}
              </button>
            )}

            {/* Create error */}
            {createError !== null && (
              <p className="border-b border-neutral-100 px-3 py-1.5 text-xs text-red-600">
                {createError}
              </p>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2.5 text-sm text-neutral-400">Sin resultados</p>
            )}

            {/* Options */}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 ${
                  o.value === value
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-neutral-700"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && (
                  <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
