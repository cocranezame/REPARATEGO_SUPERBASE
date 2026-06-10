# Epics Overview — ReparaTego

> Estado de cada épica. Se actualiza al completar tickets.
> Total: 19 épicas + deploy, ~194 tickets

| Épica | Nombre | Estado | Doc |
|-------|--------|--------|-----|
| E0 | Infraestructura y Scaffolding (Local) | ✅ DONE | E00-infraestructura.md |
| E1 | Seguridad y Acceso | ✅ DONE | E01-seguridad.md |
| E2 | Catálogos Maestros | ✅ DONE | E02-catalogos.md |
| E3 | Clientes | ✅ DONE | E03-clientes.md |
| E4 | Inventario y Productos — *Requiere parche C004 — ver corrections-log.md* | ✅ DONE | E04-inventario.md |
| E5 | Proveedores — *Requiere parche C004 — ver corrections-log.md* | ✅ DONE | E05-proveedores.md |
| E6 | Cotización a Proveedores (Compra) — *Requiere parche C004 — ver corrections-log.md* | ✅ DONE | E06-cotizacion-compra.md |
| E7 | Compras (Solicitudes + OC) | ✅ DONE | E07-compras.md |
| E8 | Lotes y Movimientos de Inventario — *Requiere parche C004 — ver corrections-log.md* | ✅ DONE | E08-lotes-inventario.md |
| E9 | Pagos a Proveedores — *Requiere parche C004 — ver corrections-log.md* | ✅ DONE | E09-pagos-proveedores.md |
| E10 | Servicios / Órdenes de Servicio — 28 tickets (6 sub-épicas: 10A-10F) | ✅ DONE | E10-servicios.md |
| E11 | Ventas — 22 tickets (5 sub-épicas: 11A-11E) | ✅ DONE | E11-ventas.md |
| E12 | Domicilios | ✅ DONE | E12-domicilios.md |
| E13 | CRM + Agente IA (Nico) — 35 tickets (7 sub-épicas: 13A-13G) | ⬜ TODO | E13-crm.md |
| E14 | Dashboard y Reportes | ⬜ TODO | E14-dashboard.md |
| E15 | QA, Performance y Pulido | ⬜ TODO | E15-qa.md |
| E0D | Deploy a Producción | ⬜ TODO | E00D-deploy.md |
| E16 | App Móvil | ⬜ TODO | E16-mobile.md |
| E17 | Integración SUNAT | ⬜ TODO | E17-sunat.md |
| E19 | Asistencia y Planilla — 12 tickets | ⬜ TODO | E19-asistencia.md |

## Orden de ejecución

1. **E0.1 → E0.13** (infraestructura local)
2. **E1 → E15** (desarrollo completo contra DB local)
3. **E0D (E0.14 → E0.24)** (deploy a producción)
4. **E16** (mobile)
5. **E17** (SUNAT)
