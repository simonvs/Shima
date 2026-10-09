"use client";

import { useMemo, useState, useRef } from "react";
import { Heart, Activity } from "lucide-react";

interface HeartRateChartProps {
  avgHeartRate?: number;
  maxHeartRate?: number;
  durationMinutes?: number;
  hrSeries?: number[];
  color?: string;
}

export default function HeartRateChart({
  avgHeartRate,
  maxHeartRate,
  durationMinutes = 90,
  hrSeries,
  color = "#f43f5e",
}: HeartRateChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    hr: number;
    minute: number;
  } | null>(null);

  const duration = durationMinutes || 90;
  const effectiveMaxHr = maxHeartRate || avgHeartRate || 0;
  const effectiveAvgHr = avgHeartRate || 0;

  // Verificamos si existen datos 100% reales de telemetría continua
  const hasRealSeries = Array.isArray(hrSeries) && hrSeries.length >= 5;

  // Si no hay serie real de telemetría, no inventamos ondas sintéticas
  if (!hasRealSeries) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px dashed var(--border-color)",
          borderRadius: "var(--radius-md)",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(244, 63, 94, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-rose)",
              flexShrink: 0,
            }}
          >
            <Heart size={18} />
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Curva continua de FC no disponible
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", margin: "2px 0 0 0" }}>
              {effectiveAvgHr > 0
                ? `Esta sesión tiene FC Media (${effectiveAvgHr} ppm)${effectiveMaxHr > 0 ? ` y Máx (${effectiveMaxHr} ppm)` : ""}.`
                : "Sin telemetría registrada."}{" "}
              Para ver el gráfico continuo segundo a segundo, sube el archivo .FIT del sensor.
            </p>
          </div>
        </div>

        {effectiveAvgHr > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-rose)" }}>
              {effectiveAvgHr} <small style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>ppm</small>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Dimensiones del SVG con datos reales
  const dataPoints = hrSeries;
  const svgWidth = 500;
  const svgHeight = 90;
  const paddingLeft = 30;
  const paddingRight = 10;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const yMin = 0;
  const yMax = Math.max(effectiveMaxHr + 5, Math.max(...dataPoints) + 5);

  const getY = (hr: number) => {
    const normalized = (hr - yMin) / (yMax - yMin);
    return svgHeight - normalized * (svgHeight - 10) - 5;
  };

  const getX = (index: number, total: number = dataPoints.length) => {
    return paddingLeft + (index / Math.max(1, total - 1)) * chartWidth;
  };

  // Construir path suave con los datos reales
  const pathData = (() => {
    const total = dataPoints.length;
    const coords = dataPoints.map((hr, idx) => ({
      x: paddingLeft + (idx / (total - 1)) * chartWidth,
      y: svgHeight - ((hr - yMin) / (yMax - yMin)) * (svgHeight - 10) - 5,
    }));

    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : coords.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  })();

  const maxLineY = getY(effectiveMaxHr || Math.max(...dataPoints));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - (paddingLeft / svgWidth) * rect.width) / ((chartWidth / svgWidth) * rect.width)));
    const pointIdx = Math.round(ratio * (dataPoints.length - 1));

    if (pointIdx >= 0 && pointIdx < dataPoints.length) {
      const hr = dataPoints[pointIdx];
      const minute = Math.round((pointIdx / (dataPoints.length - 1)) * duration);
      setHoveredPoint({
        x: getX(pointIdx),
        y: getY(hr),
        hr,
        minute,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Columna Izquierda: Información de Frecuencia Cardíaca Real */}
      <div
        style={{
          width: "140px",
          minWidth: "130px",
          padding: "0.85rem 0.75rem",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.15)",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--text-main)",
            marginBottom: "0.35rem",
            lineHeight: 1.2,
          }}
        >
          Frecuencia cardiaca
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-dim)",
            lineHeight: 1.4,
          }}
        >
          Máx. <strong style={{ color: "var(--accent-rose)" }}>{effectiveMaxHr}</strong>
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-dim)",
            lineHeight: 1.4,
          }}
        >
          Promedio <strong style={{ color: "var(--text-main)" }}>{effectiveAvgHr}</strong>
        </span>
      </div>

      {/* Área Derecha: Gráfico de Telemetría SVG 100% Real */}
      <div style={{ flex: 1, position: "relative", minWidth: 0, padding: "0 0.25rem" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "var(--accent-cyan)",
            opacity: 0.7,
          }}
        />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100px", display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <text
            x={paddingLeft - 6}
            y={maxLineY + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="monospace"
          >
            {effectiveMaxHr}
          </text>

          <text
            x={paddingLeft - 6}
            y={svgHeight - 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="monospace"
          >
            0
          </text>

          {/* Línea horizontal en valor Máximo */}
          <line
            x1={paddingLeft}
            y1={maxLineY}
            x2={svgWidth - paddingRight}
            y2={maxLineY}
            stroke="#f43f5e"
            strokeDasharray="4 3"
            strokeWidth="1"
            strokeOpacity="0.6"
          />

          {/* Línea horizontal en promedio */}
          {effectiveAvgHr > 0 && (
            <line
              x1={paddingLeft}
              y1={getY(effectiveAvgHr)}
              x2={svgWidth - paddingRight}
              y2={getY(effectiveAvgHr)}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
          )}

          {/* Área sombreada */}
          <defs>
            <linearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path
            d={`${pathData} L ${getX(dataPoints.length - 1)} ${svgHeight} L ${getX(0)} ${svgHeight} Z`}
            fill="url(#hrAreaGradient)"
          />

          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={0}
                x2={hoveredPoint.x}
                y2={svgHeight}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4.5"
                fill="#ffffff"
                stroke={color}
                strokeWidth={2.5}
              />
            </>
          )}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              top: "6px",
              left: `${Math.min(85, Math.max(15, (hoveredPoint.x / svgWidth) * 100))}%`,
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.92)",
              border: `1px solid ${color}`,
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#ffffff",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
              Min {hoveredPoint.minute}&apos;
            </span>
            <span style={{ color }}>{hoveredPoint.hr} ppm</span>
          </div>
        )}
      </div>
    </div>
  );
}
