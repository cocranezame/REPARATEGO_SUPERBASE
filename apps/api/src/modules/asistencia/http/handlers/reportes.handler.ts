import type { ReporteQueryInput } from "@kallpasoft/validators";
import ExcelJS from "exceljs";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw);
}

function pdfNotImplemented(periodo: string, tipo: string): string {
  return `PDF ${tipo} — período ${periodo}\nGeneración PDF requiere configurar pdfkit. Usa formato=xlsx.`;
}

export class ReportesHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  reporteAsistencia = async (c: HonoCtx): Promise<Response> => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ReporteQueryInput;
    const { periodo, formato } = query;

    const data = await this.repo.getReporteAsistenciaData(tenantId, periodo);

    if (formato === "pdf") {
      const body = pdfNotImplemented(periodo, "Asistencia");
      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="asistencia-${periodo}.txt"`,
        },
      });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Asistencia ${periodo}`);

    ws.columns = [
      { header: "Trabajador", key: "trabajador", width: 30 },
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Estado Día", key: "estado_dia", width: 16 },
      { header: "Hora Entrada", key: "entrada", width: 22 },
      { header: "Hora Salida", key: "salida", width: 22 },
      { header: "Min. Tardanza", key: "tardanza", width: 14 },
      { header: "Min. Extra", key: "extra", width: 12 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow(row);
    }

    const buffer = await toBuffer(wb);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="asistencia-${periodo}.xlsx"`,
      },
    });
  };

  reportePlanilla = async (c: HonoCtx): Promise<Response> => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ReporteQueryInput;
    const { periodo, formato } = query;

    const planillas = await this.repo.getReportePlanillaData(tenantId, periodo);

    if (formato === "pdf") {
      const body = pdfNotImplemented(periodo, "Planilla");
      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="planilla-${periodo}.txt"`,
        },
      });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Planilla ${periodo}`);

    ws.columns = [
      { header: "Trabajador", key: "trabajador", width: 30 },
      { header: "Período", key: "periodo", width: 10 },
      { header: "Días Lab.", key: "dias_laborables", width: 10 },
      { header: "Días Asist.", key: "dias_asistidos", width: 12 },
      { header: "Días Falta", key: "dias_falta", width: 11 },
      { header: "Min. Tardanza", key: "minutos_tardanza_total", width: 14 },
      { header: "Horas Extra", key: "horas_extra_total", width: 12 },
      { header: "Sueldo Base", key: "sueldo_base", width: 13 },
      { header: "Desc. Tardanza", key: "descuento_tardanzas", width: 15 },
      { header: "Desc. Faltas", key: "descuento_faltas", width: 13 },
      { header: "Monto Extra", key: "monto_horas_extra", width: 13 },
      { header: "Total Bruto", key: "total_bruto", width: 13 },
      { header: "Total Neto", key: "total_neto", width: 13 },
      { header: "Estado", key: "estado", width: 12 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const p of planillas) {
      ws.addRow({
        trabajador: `${p.usuario_apellidos ?? ""}, ${p.usuario_nombres ?? ""}`.trim(),
        periodo: p.periodo,
        dias_laborables: p.dias_laborables,
        dias_asistidos: p.dias_asistidos,
        dias_falta: p.dias_falta,
        minutos_tardanza_total: p.minutos_tardanza_total,
        horas_extra_total: p.horas_extra_total,
        sueldo_base: p.sueldo_base,
        descuento_tardanzas: p.descuento_tardanzas,
        descuento_faltas: p.descuento_faltas,
        monto_horas_extra: p.monto_horas_extra,
        total_bruto: p.total_bruto,
        total_neto: p.total_neto,
        estado: p.estado,
      });
    }

    const buffer = await toBuffer(wb);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="planilla-${periodo}.xlsx"`,
      },
    });
  };
}
