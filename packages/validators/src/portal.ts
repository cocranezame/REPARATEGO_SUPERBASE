import { z } from "zod";

export const portalLoginSchema = z.object({
  numero_doc: z.string().min(6).max(20),
  celular: z.string().min(7).max(20),
});
export type PortalLoginInput = z.infer<typeof portalLoginSchema>;

export const portalAceptarValidacionSchema = z.object({
  texto_mostrado: z.string().min(1),
  documento_version: z.string().min(1),
});
export type PortalAceptarValidacionInput = z.infer<typeof portalAceptarValidacionSchema>;

export const portalAceptarPresupuestoSchema = z.object({
  preventivo_accepted: z.boolean(),
  texto_mostrado: z.string().min(1),
  documento_version: z.string().min(1),
});
export type PortalAceptarPresupuestoInput = z.infer<typeof portalAceptarPresupuestoSchema>;
