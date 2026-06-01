import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useCreateAceptacion } from "../hooks/useOrdenesServicio";
import type { OrdenServicioResumen } from "../types/orden-servicio";

const INPUT =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

type Props = { orden: OrdenServicioResumen; onClose: () => void };

export function ModalValidacion({ orden, onClose }: Props) {
  const [tab, setTab] = useState<"wa" | "manual">("wa");
  const [canal, setCanal] = useState<"TIENDA" | "WHATSAPP">("TIENDA");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useCreateAceptacion();

  const waUrl = `https://reparatego.com/mis-equipos?codigo=${orden.codigo}`;
  const waMsg = encodeURIComponent(
    `Hola ${orden.cliente_nombre ?? "cliente"}, tu equipo ${orden.producto_nombre ?? ""} (${orden.codigo}) ha sido recibido. Por favor acepta los términos aquí: ${waUrl}`
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
        tipo: "VALIDACION",
        canal_aceptacion: canal === "TIENDA" ? "MANUAL_TIENDA" : "MANUAL_WHATSAPP",
        manual_reason: canal,
        password,
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
              Validación — {orden.codigo}
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
                Envía el enlace del portal al cliente para que acepte los términos y condiciones.
                Cuando el cliente apruebe, el estado cambiará automáticamente a REVISIÓN.
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
              <p className="text-xs text-neutral-400 text-center">
                El estado cambia a REVISIÓN cuando el cliente acepta desde el portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManual} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1">
                <label htmlFor="val-canal" className="text-xs font-medium text-neutral-700">
                  Canal de aprobación
                </label>
                <select
                  id="val-canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as "TIENDA" | "WHATSAPP")}
                  className={INPUT}
                >
                  <option value="TIENDA">En tienda (presencial)</option>
                  <option value="WHATSAPP">Por WhatsApp (captura)</option>
                </select>
              </div>

              {canal === "WHATSAPP" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="val-evidence" className="text-xs font-medium text-neutral-700">
                    URL de la captura <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="val-evidence"
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="val-password" className="text-xs font-medium text-neutral-700">
                  Contraseña del vendedor <span className="text-red-500">*</span>
                </label>
                <input
                  id="val-password"
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
                  {mutation.isPending ? "Guardando..." : "Confirmar aprobación → REVISIÓN"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
