import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Cpu, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalAuthStore } from "../../../shared/stores/portal-auth-store";
import type { PortalInstancia } from "../lib/portal-api";
import { portalApi } from "../lib/portal-api";
import { estadoBadgeClass, estadoLabel } from "../lib/portal-estados";

export function MisEquiposPage() {
  const user = usePortalAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal", "mis-equipos"],
    queryFn: () => portalApi.misEquipos(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-danger-600">
        No se pudieron cargar tus equipos. Intenta recargar la página.
      </div>
    );
  }

  const instancias = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Mis Equipos</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Hola, <span className="font-medium">{user?.clienteNombre}</span>. Aquí puedes ver el
          estado de tus equipos.
        </p>
      </div>

      {instancias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 p-8 text-center">
          <Package className="h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">No tienes equipos registrados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {instancias.map((inst) => (
            <InstanciaCard key={inst.id} instancia={inst} />
          ))}
        </div>
      )}
    </div>
  );
}

function InstanciaCard({ instancia }: { instancia: PortalInstancia }) {
  const imagen = instancia.imagenes[0];
  const servicio = instancia.servicio_activo;

  const card = (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-shrink-0">
        {imagen ? (
          <img
            src={imagen.url}
            alt={instancia.producto_nombre ?? "Equipo"}
            className="h-16 w-16 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100">
            <Cpu className="h-7 w-7 text-neutral-400" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-medium text-neutral-900 text-sm">
          {instancia.producto_nombre ?? "Equipo"}
        </p>
        <p className="text-xs text-neutral-500">
          {[instancia.marca_nombre, instancia.categoria_nombre].filter(Boolean).join(" · ")}
        </p>
        {instancia.numero_serie && (
          <p className="text-xs text-neutral-400">S/N: {instancia.numero_serie}</p>
        )}
        {servicio ? (
          <span
            className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadgeClass(servicio.estado)}`}
          >
            {estadoLabel(servicio.estado)}
          </span>
        ) : (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
            Sin servicio activo
          </span>
        )}
      </div>

      {servicio && <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400" />}
    </div>
  );

  if (servicio) {
    return <Link to={`/portal/servicios/${servicio.id}`}>{card}</Link>;
  }

  return card;
}
