"use client";

import { useMemo, useState } from "react";
import { X, Heart, Flame, Clock, Zap } from "lucide-react";
import { calculateHrZones } from "@/lib/hrZones";
import { parseMatchResult } from "@/lib/matchUtils";
import HeartRateChart from "@/components/HeartRateChart";
import type { ActivityItem } from "@/types/activity";

interface ActivityZonesModalProps {
  activity: ActivityItem | null;
  isOpen: boolean;
  onClose: () => void;
  userMaxHr?: number;
}

export default function ActivityZonesModal({
  activity,
  isOpen,
  onClose,
  userMaxHr = 192,
}: ActivityZonesModalProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const effectiveMaxHr = useMemo(() => {
    if (!activity) return userMaxHr;
    return Math.max(activity.max_heart_rate || 0, userMaxHr);
  }, [activity, userMaxHr]);

  const zones = useMemo(() => {
    if (!activity?.avg_heart_rate) return [];
    return calculateHrZones(
      activity.avg_heart_rate,
      activity.max_heart_rate,
      effectiveMaxHr
    );
  }, [activity, effectiveMaxHr]);

  // Zona predominante
  const dominantZone = useMemo(() => {
    if (zones.length === 0) return null;
    return [...zones].sort((a, b) => b.percentage - a.percentage)[0];
  }, [zones]);

  if (!isOpen || !activity) return null;

  const durationMin = activity.duration_minutes || 0;
  const matchResult = activity.type === "match" ? parseMatchResult(activity.result) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "rgba(244, 63, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-rose)",
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                  Zonas de Frecuencia Cardíaca
                </h3>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "2px 7px",
                    borderRadius: "9999px",
                    background: activity.type === "match" ? "rgba(6, 182, 212, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: activity.type === "match" ? "var(--accent-cyan)" : "var(--accent-amber)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {activity.type === "match" ? "Partido" : "Entrenamiento"}
                </span>
                {matchResult && (
                  <span className={`event-score ${matchResult.className}`} style={{ fontSize: "0.75rem", padding: "1px 6px" }}>
                    {matchResult.scoreText} ({matchResult.label})
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", margin: "2px 0 0 0" }}>
                {activity.title} • {activity.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            title="Cerrar"
          >
            <X size={20} color="var(--text-dim)" />
          </button>
        </div>

        {/* Resumen Métrico de la Sesión */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.5rem",
            padding: "0.85rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
              <Heart size={11} color="var(--accent-rose)" /> FC Media
            </span>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "2px 0 0 0" }}>
              {activity.avg_heart_rate ? `${activity.avg_heart_rate} ppm` : "--"}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
              <Zap size={11} color="var(--accent-rose)" /> FC Máx
            </span>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent-rose)", margin: "2px 0 0 0" }}>
              {activity.max_heart_rate ? `${activity.max_heart_rate} ppm` : `${effectiveMaxHr} ppm`}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
              <Clock size={11} color="var(--accent-cyan)" /> Duración
            </span>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "2px 0 0 0" }}>
              {activity.duration_minutes ? `${activity.duration_minutes} min` : "--"}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
              <Flame size={11} color="var(--accent-amber)" /> Calorías
            </span>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent-amber)", margin: "2px 0 0 0" }}>
              {activity.calories ? `${activity.calories} kcal` : "--"}
            </p>
          </div>
        </div>

        {/* Gráfico de Telemetría Continua de Frecuencia Cardíaca */}
        <div style={{ marginBottom: "1.25rem" }}>
          <HeartRateChart
            avgHeartRate={activity.avg_heart_rate}
            maxHeartRate={activity.max_heart_rate || effectiveMaxHr}
            durationMinutes={activity.duration_minutes}
            hrSeries={activity.hr_series}
          />
        </div>

        {/* Zona Dominante Card */}
        {dominantZone && (
          <div
            style={{
              padding: "0.85rem 1rem",
              background: `linear-gradient(90deg, ${dominantZone.color}15, rgba(255,255,255,0.02))`,
              border: `1px solid ${dominantZone.color}40`,
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <span
                  style={{
                    background: dominantZone.color,
                    color: "#000",
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {dominantZone.zone}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                  {dominantZone.name} — Zona Predominante
                </span>
              </div>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>
                {dominantZone.description}
              </p>
            </div>
            <div style={{ textAlign: "right", marginLeft: "1rem" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: dominantZone.color }}>
                {dominantZone.percentage}%
              </span>
              {durationMin > 0 && (
                <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: 0 }}>
                  ~{Math.round((dominantZone.percentage / 100) * durationMin)} min
                </p>
              )}
            </div>
          </div>
        )}

        {/* Barra de progreso combinada */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              height: "14px",
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

        {/* Desglose de las 5 Zonas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
          {zones.map((z) => {
            const isSelected = selectedZone === z.zone;
            const approxMinutes =
              durationMin > 0 ? Math.round((z.percentage / 100) * durationMin) : null;

            return (
              <div
                key={z.zone}
                onClick={() => setSelectedZone(isSelected ? null : z.zone)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${isSelected ? z.color : "rgba(255, 255, 255, 0.04)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      background: `${z.color}20`,
                      color: z.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      border: `1px solid ${z.color}40`,
                    }}
                  >
                    {z.zone}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{z.name}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>({z.range})</span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                      {z.description}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: z.color }}>
                    {z.percentage}%
                  </span>
                  {approxMinutes !== null && (
                    <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: 0 }}>
                      ~{approxMinutes} min
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ padding: "0.5rem 1.25rem" }}>
            Cerrar Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
