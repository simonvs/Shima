"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface PerformanceChartItem {
  match: string;
  goles: number;
  minutos: number;
  kmRecorridos: number;
  xG: number;
}

interface AnalyticsChartsProps {
  data?: PerformanceChartItem[];
}

const defaultPerformanceData: PerformanceChartItem[] = [
  { match: "Jor. 1", goles: 2, minutos: 90, kmRecorridos: 9.8, xG: 1.4 },
  { match: "Jor. 2", goles: 1, minutos: 85, kmRecorridos: 10.2, xG: 0.9 },
  { match: "Jor. 3", goles: 3, minutos: 90, kmRecorridos: 11.1, xG: 2.1 },
  { match: "Jor. 4", goles: 0, minutos: 70, kmRecorridos: 8.4, xG: 0.4 },
  { match: "Jor. 5", goles: 2, minutos: 90, kmRecorridos: 10.5, xG: 1.8 },
  { match: "Jor. 6", goles: 1, minutos: 90, kmRecorridos: 10.1, xG: 1.2 },
];

export default function AnalyticsCharts({ data = defaultPerformanceData }: AnalyticsChartsProps) {
  return (
    <div className="grid-2col">
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Evolución de Intensidad y Distancia (km)</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              Recorrido físico por fecha disputada
            </p>
          </div>
          <BarChart3 size={18} color="var(--accent-cyan)" />
        </div>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="match" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} domain={[6, 14]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 26, 46, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="kmRecorridos"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKm)"
                name="Km Recorridos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Goles vs Goles Esperados (xG)</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Efectividad de ataque</p>
          </div>
        </div>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="match" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 26, 46, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="goles" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Goles" />
              <Bar dataKey="xG" fill="#f59e0b" radius={[4, 4, 0, 0]} name="xG Esperado" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
