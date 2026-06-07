-- C006 (2026-06-02): Agregar WHATSAPP al enum canal_servicio
-- La tool crearServicio de Nico necesita registrar OS con canal WHATSAPP.
-- El enum fue creado en 0016_e10_servicios_c002.sql solo con TIENDA y DOMICILIO.
ALTER TYPE "public"."canal_servicio" ADD VALUE IF NOT EXISTS 'WHATSAPP';
