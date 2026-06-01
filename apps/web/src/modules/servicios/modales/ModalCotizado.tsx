import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useCreateAceptacion } from "../hooks/useOrdenesServicio";
import type { OrdenServicioDetalle } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

type Props = { orden: OrdenServicioDetalle; onClose: () => void };

export function ModalCotizado({ orden, onClose }: Props) {
  const [tab, setTab] = useState<"wa" | "manual">("wa");
  const [canal, setCanal] = useState<"TIENDA" | "WHATSAPP">("TIENDA");
  const [preventivoAccepted, setPreventivoAccepted] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useCreateAceptacion();

  const hasPreventivo = Number(orden.cotizacion.total_preventivo) > 0;

  const waUrl = `https://reparatego.com/mis-equipos?codigo=${orden.codigo}`;
  const waMsg = encodeURIComponent(
    `Hola ${orden.cliente_nombre ?? "cliente"}, tu cotización para ${orden.producto_nombre ?? ""} (${orden.codigo}) está lista. Revísala aquí: ${waUrl}`
  );
  const waLink = `https://wa.me/?text=${waMsg}`;

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (canal === "WHATSAPP" && !evidenceUrl) {
      setError("Adjunta la captura de aprobación por WhatsApp");
      return;
    }
    try {
      await mutation.mutateAsync({
        ordenId: orden.id,
        tipo: "PRESUPUESTO",
        canal_aceptacion: canal === "TIENDA" ? "MANUAL_TIENDA" : "MANUAL_WHATSAPP",
        manual_reason: canal,
        password,
        preventivo_accepted: hasPreventivo ? preventivoAccepted : undefined,
        ...(canal === "WHATSAPP" && evidenceUrl ? { evidence_image_url: evidenceUrl } : {}),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Aprobación de Cotización — {orden.codigo}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {orden.cliente_nombre ?? "—"} · {orden.producto_nombre ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resumen cotización */}
        <div className="border-b border-neutral-200 px-6 py-3">
          <div className="flex gap-4 text-sm">
            <span className="text-yellow-700">
              Correctivo: S/ {Number(orden.cotizacion.total_correctivo).toFixed(2)}
            </span>
            {hasPreventivo && (
              <span className="text-green-700">
                Preventivo: S/ {Number(orden.cotizacion.total_preventivo).toFixed(2)}
              </span>
            )}
            <span className="font-semibold text-neutral-900">
              Total: S/ {Number(orden.cotizacion.total).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex border-b border-neutral-200">
          {(["wa", "manual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-primary-600 text-primary-700"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t === "wa" ? "Enviar por WhatsApp" : "Aprobación manual"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "wa" ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Envía el enlace al cliente para que revise y apruebe la cotización desde el portal.
              </p>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 break-all">
                {waUrl}
              </div>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </a>
              <p className="text-center text-xs text-neutral-400">
                El estado cambia a APROBADO cuando el cliente acepta desde el portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManual} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1">
                <label htmlFor="cot-canal" className="text-xs font-medium text-neutral-700">
                  Canal de aprobación
                </label>
                <select
                  id="cot-canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as "TIENDA" | "WHATSAPP")}
                  className={INPUT}
                >
                  <option value="TIENDA">En tienda (presencial)</option>
                  <option value="WHATSAPP">Por WhatsApp (captura)</option>
                </select>
              </div>

              {hasPreventivo && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-green-800">
                    <input
                      type="checkbox"
                      checked={preventivoAccepted}
                      onChange={(e) => setPreventivoAccepted(e.target.checked)}
                      className="rounded border-green-300"
                    />
                    Cliente aprueba también los ítems preventivos (S/{" "}
                    {Number(orden.cotizacion.total_preventivo).toFixed(2)})
                  </label>
                </div>
              )}

              {canal === "WHATSAPP" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="cot-evidence" className="text-xs font-medium text-neutral-700">
                    URL de la captura <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cot-evidence"
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="cot-password" className="text-xs font-medium text-neutral-700">
                  Contraseña del vendedor <span className="text-red-500">*</span>
                </label>
                <input
                  id="cot-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>

              {error !== null && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {mutation.isPending ? "Guardando..." : "Confirmar aprobación → APROBADO"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
