import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "../../../shared/stores/auth-store";
import {
  useAccionesAgente,
  useAgentes,
  useEtapas,
  useMetricasDashboard,
  useMetricasLeads,
  useMetricasNico,
} from "../hooks/useCrm";

// ─── Period helpers ────────────────────────────────────────────────────────────

type Period = "today" | "7d" | "30d" | "custom";

function getRange(period: Period, customFrom: string, customTo: string) {
  const now = new Date();
  const from = new Date();
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    from.setDate(from.getDate() - 7);
  } else if (period === "30d") {
    from.setDate(from.getDate() - 30);
  } else {
    return { from: customFrom || from.toISOString(), to: customTo || now.toISOString() };
  }
  return { from: from.toISOString(), to: now.toISOString() };
}

// ─── Tiny components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

const UTM_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

// ─── DashboardCrmPage ─────────────────────────────────────────────────────────

export function DashboardCrmPage() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = getRange(period, customFrom, customTo);

  const { data: dashData, isLoading: dashLoading } = useMetricasDashboard({ from, to });
  const { data: nicoData, isLoading: nicoLoading } = useMetricasNico({ from, to });
  const { data: leadsData } = useMetricasLeads({ from, to });
  const { data: etapasData } = useEtapas();
  const { data: agentesData } = useAgentes();

  const dash = dashData?.data;
  const nico = nicoData?.data;
  const etapas = etapasData?.data ?? [];

  // Agente ID for acciones
  const agenteId = agentesData?.data?.[0]?.id ?? "";
  const { data: accionesData } = useAccionesAgente(agenteId, { exitoso: false, pageSize: 10 });

  // Leads por etapa — add color from etapas
  const leadsPorEtapaChart = (dash?.leads_por_etapa ?? []).map((item) => {
    const etapa = etapas.find((e) => e.id === item.etapa_id);
    return { ...item, fill: etapa?.color ?? "#6366f1" };
  });

  // Leads por canal UTM
  const utmChart = (dash?.leads_por_canal_utm ?? []).map((item, i) => ({
    ...item,
    fill: UTM_COLORS[i % UTM_COLORS.length],
  }));

  // Leads por período — group by date
  const leadsPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leadsData?.data ?? []) {
      const d = new Date(lead.fecha).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      });
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([fecha, total]) => ({ fecha, total }));
  }, [leadsData]);

  if (user?.rol !== "ADMIN") return <Navigate to="/crm/inbox" replace />;

  // Tasa de éxito color
  const tasaExito = nico?.tasa_exito ?? 0;
  const tasaColor =
    tasaExito >= 0.9 ? "text-green-600" : tasaExito >= 0.7 ? "text-yellow-600" : "text-red-600";

  const PERIOD_BUTTONS: { id: Period; label: string }[] = [
    { id: "today", label: "Hoy" },
    { id: "7d", label: "7 días" },
    { id: "30d", label: "30 días" },
    { id: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-neutral-900">Dashboard CRM</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_BUTTONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setPeriod(b.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                period === b.id
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {b.label}
            </button>
          ))}
          {period === "custom" && (
            <>
              <input
                type="date"
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5"
                value={customFrom.slice(0, 10)}
                onChange={(e) => setCustomFrom(new Date(e.target.value).toISOString())}
              />
              <span className="text-xs text-neutral-400">→</span>
              <input
                type="date"
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5"
                value={customTo.slice(0, 10)}
                onChange={(e) => setCustomTo(new Date(`${e.target.value}T23:59:59`).toISOString())}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {dashLoading ? (
        <div className="text-sm text-neutral-400">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Leads activos"
            value={dash?.leads_activos ?? 0}
            color="text-green-600"
            sub="total activos"
          />
          <KpiCard
            label="Tasa conversión"
            value={`${((dash?.tasa_conversion ?? 0) * 100).toFixed(1)}%`}
            color="text-blue-600"
            sub="período seleccionado"
          />
          <KpiCard
            label="T. promedio respuesta"
            value={`${(dash?.tiempo_promedio_respuesta_minutos ?? 0).toFixed(0)} min`}
            color="text-yellow-600"
            sub="tiempo de respuesta"
          />
          <KpiCard
            label="Leads período"
            value={dash?.total_leads_periodo ?? 0}
            color="text-purple-600"
            sub="nuevos en período"
          />
        </div>
      )}

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por etapa */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Leads por etapa</h2>
          {leadsPorEtapaChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadsPorEtapaChart} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="etapa_nombre" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {leadsPorEtapaChart.map((entry) => (
                    <Cell key={entry.etapa_id} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-400 py-8 text-center">Sin datos</p>
          )}
        </div>

        {/* Leads por canal UTM */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Leads por canal UTM</h2>
          {utmChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={utmChart}
                  dataKey="total"
                  nameKey="canal"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${String(name)} (${((Number(percent) ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {utmChart.map((entry) => (
                    <Cell key={entry.canal} fill={entry.fill ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-400 py-8 text-center">Sin datos UTM</p>
          )}
        </div>

        {/* Leads por período */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Leads por período</h2>
          {leadsPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={leadsPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-400 py-8 text-center">Sin datos de período</p>
          )}
        </div>

        {/* Embudo de conversión */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Embudo de conversión</h2>
          {leadsPorEtapaChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...leadsPorEtapaChart].sort((a, b) => b.total - a.total)}
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="etapa_nombre"
                  tick={{ fontSize: 9 }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {leadsPorEtapaChart.map((entry) => (
                    <Cell key={entry.etapa_id} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-400 py-8 text-center">Sin datos</p>
          )}
        </div>
      </div>

      {/* Rendimiento de Nico */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-6">
        <h2 className="text-sm font-semibold text-neutral-700">Rendimiento de Nico</h2>
        {nicoLoading ? (
          <p className="text-xs text-neutral-400">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mensajes procesados + tasa */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Mensajes procesados</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {nico?.mensajes_procesados ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Tasa de éxito de tools</p>
                <p className={`text-4xl font-bold ${tasaColor}`}>{(tasaExito * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">T. promedio respuesta</p>
                <p className="text-lg font-semibold text-neutral-800">
                  {(nico?.tiempo_promedio_respuesta_ms ?? 0).toFixed(0)} ms
                </p>
              </div>
            </div>

            {/* Tools usadas */}
            <div>
              <p className="text-xs text-neutral-500 mb-2">Tools usadas</p>
              {(nico?.tools_usadas ?? []).length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={nico?.tools_usadas ?? []} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="tool" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-neutral-400">Sin datos</p>
              )}
            </div>

            {/* Errores recientes */}
            <div>
              <p className="text-xs text-neutral-500 mb-2">Errores recientes</p>
              {(accionesData?.data ?? []).length === 0 ? (
                <p className="text-xs text-green-600">✓ Sin errores recientes</p>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {(accionesData?.data ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="text-xs border border-red-100 rounded-lg px-2 py-1.5 bg-red-50"
                    >
                      <span className="font-medium text-red-700">{a.tool_name}</span>
                      <span className="text-red-500 ml-1 truncate block">{a.error}</span>
                      <span className="text-neutral-400">
                        {new Date(a.created_at).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
