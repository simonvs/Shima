"use client";

import { useState, useMemo } from "react";
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
  Line,
} from "recharts";
import { Trophy, Flame, Heart, Activity, Sparkles } from "lucide-react";
import type { ActivityItem } from "@/types/activity";

interface AnalyticsChartsProps {
  events?: ActivityItem[];
}

export default function AnalyticsCharts({ events = [] }: AnalyticsChartsProps) {
  const [metricTab, setMetricTab] = useState<"calories" | "heartRate">("calories");

  // 1. Datos 100% reales de partidos para el gráfico de Goles y Asistencias
  const matchChartData = useMemo(() => {
    const matches = events.filter((e) => e.type === "match");
    // Ordenar cronológicamente (más antiguo a más reciente)
    const sorted = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // Tomar los últimos 10 partidos para óptima legibilidad
    const recent = sorted.slice(-10);

    return recent.map((m) => {
      let shortDate = m.date;
      try {
        const parts = m.date.split("-");
        if (parts.length === 3) {
          shortDate = `${parts[2]}/${parts[1]}`;
        }
      } catch {}

      return {
        id: m.id,
        label: shortDate,
        title: m.title,
        date: m.date,
        goles: m.goals || 0,
        asistencias: m.assists || 0,
        totalGA: (m.goals || 0) + (m.assists || 0),
        result: m.result || "Sin marcador",
      };
    });
  }, [events]);

  // 2. Datos 100% reales de telemetría/esfuerzo físico (Calorías o FC)
  const physicalChartData = useMemo(() => {
    const physical = events.filter(
      (e) =>
        (e.calories && e.calories > 0) ||
        (e.avg_heart_rate && e.avg_heart_rate > 0) ||
        (e.duration_minutes && e.duration_minutes > 0)
    );
    const sorted = [...physical].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recent = sorted.slice(-10);

    return recent.map((a) => {
      let shortDate = a.date;
      try {
        const parts = a.date.split("-");
        if (parts.length === 3) {
          shortDate = `${parts[2]}/${parts[1]}`;
        }
      } catch {}

      return {
        id: a.id,
        label: shortDate,
        title: a.title,
        date: a.date,
        type: a.type === "match" ? "Partido" : "Entrenamiento",
        calories: a.calories || 0,
        avgHr: a.avg_heart_rate || 0,
        maxHr: a.max_heart_rate || 0,
        duration: a.duration_minutes || 0,
        distance: a.distance_km || 0,
      };
    });
  }, [events]);

  return (
    <div className="grid-2col">
      {/* GRÁFICO 1: Producción Ofensiva Real (Goles y Asistencias) */}
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <Trophy size={18} color="var(--accent-emerald)" />
              <h2 className="panel-title" style={{ margin: 0 }}>Goles y Asistencias por Partido</h2>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "2px" }}>
              Rendimiento individual real en tus últimos partidos
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.72rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-emerald)", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "2px", background: "var(--accent-emerald)" }} />
              Goles
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-cyan)", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "2px", background: "var(--accent-cyan)" }} />
              Asistencias
            </span>
          </div>
        </div>

        {matchChartData.length === 0 ? (
          <div
            style={{
              height: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.01)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <Trophy size={32} color="var(--text-muted)" style={{ marginBottom: "0.5rem", opacity: 0.7 }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", margin: "0 0 0.25rem 0" }}>
              Sin partidos registrados aún
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", maxWidth: "320px", margin: 0 }}>
              Registra tus partidos y anota tus goles o asistencias para ver aquí la progresión de tu rendimiento.
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matchChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "8px",
                          padding: "0.6rem 0.8rem",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          fontSize: "0.78rem",
                        }}
                      >
                        <p style={{ fontWeight: 700, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                          {item.title}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0 0 6px 0" }}>
                          {item.date} • Marcador: <strong style={{ color: "var(--text-main)" }}>{item.result}</strong>
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                            ⚽ Goles: {item.goles}
                          </span>
                          <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                            👟 Asistencias: {item.asistencias}
                          </span>
                          <span style={{ color: "var(--accent-amber)", fontWeight: 700, marginTop: "2px" }}>
                            ⭐ Total G+A: {item.totalGA}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="goles" fill="#10b981" radius={[4, 4, 0, 0]} name="Goles" />
                <Bar dataKey="asistencias" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Asistencias" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* GRÁFICO 2: Carga Física Real (Calorías o Frecuencia Cardíaca) */}
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              {metricTab === "calories" ? (
                <Flame size={18} color="var(--accent-amber)" />
              ) : (
                <Heart size={18} color="var(--accent-rose)" />
              )}
              <h2 className="panel-title" style={{ margin: 0 }}>
                {metricTab === "calories" ? "Gasto Calórico por Sesión" : "Frecuencia Cardíaca por Sesión"}
              </h2>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "2px" }}>
              {metricTab === "calories"
                ? "Calorías quemadas según telemetría .FIT o estimación Keytel"
                : "Evolución cardiovascular media (ppm) en tus entrenamientos y partidos"}
            </p>
          </div>

          {/* Toggle de Métrica */}
          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={() => setMetricTab("calories")}
              style={{
                background: metricTab === "calories" ? "rgba(245, 158, 11, 0.2)" : "transparent",
                color: metricTab === "calories" ? "var(--accent-amber)" : "var(--text-dim)",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Flame size={12} /> Calorías
            </button>
            <button
              type="button"
              onClick={() => setMetricTab("heartRate")}
              style={{
                background: metricTab === "heartRate" ? "rgba(244, 63, 94, 0.2)" : "transparent",
                color: metricTab === "heartRate" ? "var(--accent-rose)" : "var(--text-dim)",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Heart size={12} /> FC Media
            </button>
          </div>
        </div>

        {physicalChartData.length === 0 ? (
          <div
            style={{
              height: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.01)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <Activity size={32} color="var(--text-muted)" style={{ marginBottom: "0.5rem", opacity: 0.7 }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", margin: "0 0 0.25rem 0" }}>
              Sin datos físicos registrados
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", maxWidth: "320px", margin: 0 }}>
              Sube un archivo .FIT o añade duración y frecuencia cardíaca para visualizar el impacto físico de cada actividad.
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {metricTab === "calories" ? (
                <AreaChart data={physicalChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" kcal" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            padding: "0.6rem 0.8rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            fontSize: "0.78rem",
                          }}
                        >
                          <p style={{ fontWeight: 700, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                            {item.title} ({item.type})
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0 0 6px 0" }}>
                            {item.date} {item.duration ? `• ${item.duration} min` : ""}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>
                              🔥 {item.calories} kcal
                            </span>
                            {item.avgHr > 0 && (
                              <span style={{ color: "var(--accent-rose)", fontWeight: 500 }}>
                                💓 FC: {item.avgHr} ppm {item.maxHr ? `(máx ${item.maxHr})` : ""}
                              </span>
                            )}
                            {item.distance > 0 && (
                              <span style={{ color: "var(--accent-emerald)", fontWeight: 500 }}>
                                📍 Distancia: {item.distance} km
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCalories)"
                    name="Calorías (kcal)"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={physicalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} unit=" ppm" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            padding: "0.6rem 0.8rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            fontSize: "0.78rem",
                          }}
                        >
                          <p style={{ fontWeight: 700, color: "var(--text-main)", margin: "0 0 2px 0" }}>
                            {item.title} ({item.type})
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0 0 6px 0" }}>
                            {item.date} {item.duration ? `• ${item.duration} min` : ""}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>
                              💓 FC Media: {item.avgHr} ppm
                            </span>
                            {item.maxHr > 0 && (
                              <span style={{ color: "var(--accent-rose)", fontWeight: 500 }}>
                                ⚡ FC Máxima: {item.maxHr} ppm
                              </span>
                            )}
                            {item.calories > 0 && (
                              <span style={{ color: "var(--accent-amber)", fontWeight: 500 }}>
                                🔥 {item.calories} kcal
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgHr"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHr)"
                    name="FC Media (ppm)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
