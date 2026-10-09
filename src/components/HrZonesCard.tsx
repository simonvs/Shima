"use client";

import { useMemo, useState } from "react";
import { Heart, Activity, Info } from "lucide-react";
import { calculateHrZones } from "@/lib/hrZones";
import type { ActivityItem } from "@/types/activity";

interface HrZonesCardProps {
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  activityTitle?: string;
  userMaxHr?: number;
  activities?: ActivityItem[];
  selectedActivityId?: number | null;
  onSelectActivity?: (activity: ActivityItem | null) => void;
}

export default function HrZonesCard({
  avgHeartRate,
  maxHeartRate,
  activityTitle,
  userMaxHr,
  activities,
  selectedActivityId,
  onSelectActivity,
}: HrZonesCardProps) {
  const [userOverrideMaxHr, setUserOverrideMaxHr] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const effectiveMaxHr = userOverrideMaxHr ?? userMaxHr ?? 192;

  const zones = useMemo(() => {
    return calculateHrZones(
      avgHeartRate || undefined,
      maxHeartRate || undefined,
      effectiveMaxHr
    );
  }, [avgHeartRate, maxHeartRate, effectiveMaxHr]);

  const hasData = Boolean(avgHeartRate && avgHeartRate > 0);

  // Zona predominante
  const dominantZone = useMemo(() => {
    if (!hasData) return null;
    return [...zones].sort((a, b) => b.percentage - a.percentage)[0];
  }, [zones, hasData]);

  const hrActivities = useMemo(() => {
    return (activities || []).filter((a) => a.avg_heart_rate && a.avg_heart_rate > 0);
  }, [activities]);

  return (
    <section className="panel-card" style={{ position: "relative", overflow: "hidden" }}>
      <div className="panel-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 className="panel-title">Zonas de Frecuencia Cardíaca</h2>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(244, 63, 94, 0.15)",
                color: "var(--accent-rose)",
                fontWeight: 600,
              }}
            >
              Telemetry Biometrics
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "2px" }}>
            {activityTitle
              ? `Sesión individual: ${activityTitle}`
              : "Desglose cardiovascular promedio de todas tus sesiones"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Selector de Sesión Específica */}
          {hrActivities.length > 0 && onSelectActivity && (
            <select
              className="form-select"
              style={{
                padding: "0.3rem 0.6rem",
                fontSize: "0.78rem",
                width: "auto",
                maxWidth: "230px",
                borderRadius: "var(--radius-sm)",
                background: selectedActivityId ? "rgba(244, 63, 94, 0.1)" : "rgba(255, 255, 255, 0.04)",
                borderColor: selectedActivityId ? "var(--accent-rose)" : "var(--border-color)",
                color: selectedActivityId ? "var(--accent-rose)" : "var(--text-main)",
                fontWeight: 600,
              }}
              value={selectedActivityId ? selectedActivityId.toString() : "all"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  onSelectActivity(null);
                } else {
                  const found = hrActivities.find((a) => a.id.toString() === val);
                  if (found) onSelectActivity(found);
                }
              }}
            >
              <option value="all">📊 Promedio de todas las sesiones</option>
              {hrActivities.map((act) => (
                <option key={act.id} value={act.id.toString()}>
                  {act.type === "match" ? "⚽" : "🏃"} {act.title} ({act.avg_heart_rate} ppm)
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>FC Máx:</span>
              <input
                type="number"
                min="140"
                max="230"
                value={effectiveMaxHr}
                onChange={(e) => setUserOverrideMaxHr(parseInt(e.target.value, 10) || 190)}
                style={{
                  width: "55px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
                title="Tu frecuencia cardíaca máxima estimada (220 - edad)"
              />
            </div>
            <Heart size={20} color="var(--accent-rose)" />
          </div>
        </div>
      </div>

      {/* Resumen Superior */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          padding: "0.85rem 1rem",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>FC Media</span>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            {avgHeartRate ? `${avgHeartRate} ppm` : "--"}
          </p>
        </div>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>FC Máxima</span>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-rose)", margin: 0 }}>
            {maxHeartRate ? `${maxHeartRate} ppm` : `${effectiveMaxHr} ppm (est.)`}
          </p>
        </div>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Zona Dominante</span>
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: dominantZone ? dominantZone.color : "var(--text-muted)",
              margin: 0,
            }}
          >
            {dominantZone ? `${dominantZone.zone} (${dominantZone.percentage}%)` : "--"}
          </p>
        </div>
      </div>

      {/* Barra segmentada combinada de zonas */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            height: "12px",
            borderRadius: "9999px",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {zones.map((z) => (
            <div
              key={z.zone}
              style={{
                width: `${z.percentage}%`,
                background: z.color,
                transition: "width 0.4s ease",
                cursor: "pointer",
                opacity: selectedZone && selectedZone !== z.zone ? 0.4 : 1,
              }}
              title={`${z.zone}: ${z.percentage}% (${z.range})`}
              onClick={() => setSelectedZone(selectedZone === z.zone ? null : z.zone)}
            />
          ))}
        </div>
      </div>

      {/* Lista detallada de las 5 Zonas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {zones.map((z) => {
          const isSelected = selectedZone === z.zone;
          return (
            <div
              key={z.zone}
              onClick={() => setSelectedZone(isSelected ? null : z.zone)}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                background: isSelected ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${isSelected ? z.color : "rgba(255, 255, 255, 0.04)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "22px",
                      borderRadius: "4px",
                      background: `${z.color}25`,
                      color: z.color,
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    {z.zone}
                  </span>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {z.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginLeft: "0.5rem" }}>
                      {z.range}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "6px",
                      borderRadius: "9999px",
                      background: "rgba(255, 255, 255, 0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${z.percentage}%`,
                        height: "100%",
                        background: z.color,
                        borderRadius: "9999px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: z.color,
                      minWidth: "35px",
                      textAlign: "right",
                    }}
                  >
                    {z.percentage}%
                  </span>
                </div>
              </div>

              {isSelected && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                    paddingLeft: "2.3rem",
                  }}
                >
                  <Info size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                  {z.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!hasData && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.6rem 0.8rem",
            borderRadius: "var(--radius-sm)",
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.76rem",
            color: "var(--accent-cyan)",
          }}
        >
          <Activity size={14} />
          <span>
            Sube un archivo <strong>.FIT</strong> o registra tu FC media en una actividad para ver el cálculo real de tus zonas.
          </span>
        </div>
      )}
    </section>
  );
}
