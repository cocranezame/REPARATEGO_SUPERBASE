// Utilidad de impresión de voucher — reutilizable desde cualquier parte del módulo
import type { VentaDetalleDto, VentaDto } from "../types/ventas";

export function imprimirVoucherDetalle(venta: VentaDetalleDto) {
  const metodosStr = venta.pagos
    .map((p) => `${p.metodo_nombre ?? "—"}: S/ ${Number(p.monto).toFixed(2)}`)
    .join("<br/>");

  const itemsStr = venta.items
    .map(
      (it) =>
        `<div class="row"><span>${it.descripcion} ×${it.cantidad}</span><span>S/ ${Number(it.subtotal).toFixed(2)}</span></div>`
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Voucher ${venta.codigo}</title>
<style>
  body { font-family: 'Courier New', monospace; padding: 20px; max-width: 380px; margin: 0 auto; font-size: 12px; }
  h1 { text-align: center; font-size: 15px; margin: 0 0 4px; }
  h2 { text-align: center; font-size: 12px; margin: 0 0 8px; font-weight: normal; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
  .servicio { font-size: 10px; color: #555; }
</style></head>
<body>
  <h1>REPARATEGO</h1>
  <h2>COMPROBANTE DE VENTA</h2>
  <hr/>
  <div class="row"><span>N°:</span><span><strong>${venta.codigo}</strong></span></div>
  <div class="row"><span>Fecha:</span><span>${new Date(venta.created_at).toLocaleString("es-PE")}</span></div>
  <div class="row"><span>Cliente:</span><span>${venta.cliente_nombre ?? "Sin cliente"}</span></div>
  ${venta.vendedor_nombre ? `<div class="row"><span>Vendedor:</span><span>${venta.vendedor_nombre}</span></div>` : ""}
  ${venta.orden_servicio_id ? `<div class="row servicio"><span>Servicio:</span><span>${venta.orden_servicio_id.slice(0, 8)}… ${venta.servicio_asociado?.estado ?? ""}</span></div>` : ""}
  <hr/>
  ${itemsStr}
  <hr/>
  <div class="row total"><span>TOTAL:</span><span>S/ ${Number(venta.total).toFixed(2)}</span></div>
  ${
    venta.pagos.length > 0
      ? `<hr/><div style="font-size:11px"><strong>Pagos:</strong><br/>${metodosStr}</div>`
      : ""
  }
  ${Number(venta.saldo_pendiente) > 0 ? `<div class="row" style="color:#b45309"><span>Saldo pendiente:</span><span>S/ ${Number(venta.saldo_pendiente).toFixed(2)}</span></div>` : ""}
  <hr/>
  <p class="footer">Gracias por su preferencia<br/>ReparaTego — Lima Norte, Perú</p>
</body></html>`;

  const w = window.open("", "_blank", "width=500,height=750");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

export function imprimirVoucherSimple(venta: VentaDto) {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Voucher ${venta.codigo}</title>
<style>
  body { font-family: 'Courier New', monospace; padding: 20px; max-width: 380px; margin: 0 auto; font-size: 12px; }
  h1 { text-align: center; font-size: 15px; margin: 0 0 4px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
</style></head>
<body>
  <h1>REPARATEGO</h1>
  <h1>COMPROBANTE DE VENTA</h1>
  <hr/>
  <div class="row"><span>N°:</span><span><strong>${venta.codigo}</strong></span></div>
  <div class="row"><span>Fecha:</span><span>${new Date(venta.created_at).toLocaleDateString("es-PE")}</span></div>
  <div class="row"><span>Cliente:</span><span>${venta.cliente_nombre ?? "Sin cliente"}</span></div>
  <div class="row"><span>Tipo:</span><span>${venta.tipo_venta}</span></div>
  <hr/>
  <div class="row total"><span>TOTAL:</span><span>S/ ${Number(venta.total).toFixed(2)}</span></div>
  ${Number(venta.saldo_pendiente) > 0 ? `<div class="row" style="color:#b45309"><span>Saldo:</span><span>S/ ${Number(venta.saldo_pendiente).toFixed(2)}</span></div>` : ""}
  <div class="row"><span>Estado:</span><span>${venta.estado_pago}</span></div>
  <hr/>
  <p class="footer">Gracias por su preferencia<br/>ReparaTego — Lima Norte, Perú</p>
</body></html>`;

  const w = window.open("", "_blank", "width=500,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}
