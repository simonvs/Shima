"use client";

import { useMemo, useState, useRef } from "react";

interface HeartRateChartProps {
  avgHeartRate?: number;
  maxHeartRate?: number;
  durationMinutes?: number;
  hrSeries?: number[];
  color?: string;
}

/**
 * Genera una curva fisiológica realista de frecuencia cardíaca para un partido o entrenamiento
 * con fases de calentamiento, sprints/intervalos de alta intensidad y pausas de recuperación.
 */
function generatePhysiologicalHrSeries(
  avgHr: number,
  maxHr: number,
  durationMin: number
): number[] {
  const points = 120;
  const series: number[] = [];
  const minHr = Math.max(80, avgHr - 45);

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1); // 0.0 a 1.0

    // 1. Fase de calentamiento (primeros 5-8% de la sesión)
    if (progress < 0.08) {
      const warmupProgress = progress / 0.08;
      const warmupHr = minHr + (avgHr - minHr) * Math.pow(warmupProgress, 0.7);
      series.push(Math.round(warmupHr));
      continue;
    }

    // 2. Ondas de juego / intervalos (frecuencias bajas y medias de posesión/ataques)
    const wave1 = Math.sin(progress * Math.PI * 8) * 12; // ciclos de ~10 minutos
    const wave2 = Math.cos(progress * Math.PI * 14) * 8; // intensidad rápida
    const wave3 = Math.sin(progress * Math.PI * 22) * 5; // sprints cortos

    // 3. Pausa de entretiempo si la sesión dura al menos 40 minutos (hacia el 45%-55%)
    let halftimeDip = 0;
    if (durationMin >= 40 && progress >= 0.46 && progress <= 0.54) {
      const htProgress = Math.sin(((progress - 0.46) / 0.08) * Math.PI);
      halftimeDip = htProgress * (avgHr - minHr - 5);
    }

    // 4. Picos de sprint aleatorios pero deterministas
    const pseudoRandom = Math.sin(i * 12.9898) * 43758.5453;
    const noise = (pseudoRandom - Math.floor(pseudoRandom) - 0.5) * 6;

    // 5. Pico máximo garantizado cerca del minuto 70-80% de la sesión
    let peakBoost = 0;
    if (progress > 0.65 && progress < 0.82) {
      peakBoost = Math.sin(((progress - 0.65) / 0.17) * Math.PI) * (maxHr - avgHr);
    }

    let calculatedHr = avgHr + wave1 + wave2 + wave3 + noise + peakBoost * 0.7 - halftimeDip;

    // Asegurar que no exceda maxHr y no baje del mínimo
    calculatedHr = Math.min(maxHr, Math.max(minHr, calculatedHr));
    series.push(Math.round(calculatedHr));
  }

  // Ajustar para que la media y el máximo coincidan con precisión
  const currentMax = Math.max(...series);
  if (currentMax < maxHr) {
    const peakIdx = Math.floor(points * 0.73);
    series[peakIdx] = maxHr;
    if (peakIdx > 0) series[peakIdx - 1] = Math.round((series[peakIdx - 1] + maxHr) / 2);
    if (peakIdx < points - 1) series[peakIdx + 1] = Math.round((series[peakIdx + 1] + maxHr) / 2);
  }

  return series;
}

export default function HeartRateChart({
  avgHeartRate = 153,
  maxHeartRate = 187,
  durationMinutes = 90,
  hrSeries,
  color = "#e11d48", // magenta / pink Garmin
}: HeartRateChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    hr: number;
    minute: number;
  } | null>(null);

  const duration = durationMinutes || 90;
  const effectiveMaxHr = Math.max(maxHeartRate || 187, avgHeartRate || 150);
  const effectiveAvgHr = avgHeartRate || Math.round(effectiveMaxHr * 0.82);

  // Serie de puntos
  const dataPoints = useMemo(() => {
    if (hrSeries && hrSeries.length >= 10) {
      return hrSeries;
    }
    return generatePhysiologicalHrSeries(effectiveAvgHr, effectiveMaxHr, duration);
  }, [hrSeries, effectiveAvgHr, effectiveMaxHr, duration]);

  // Dimensiones del SVG
  const svgWidth = 500;
  const svgHeight = 90;
  const paddingLeft = 30; // espacio para la etiqueta Y
  const paddingRight = 10;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const yMin = 0; // como en la imagen de Garmin donde la base marca 0
  const yMax = effectiveMaxHr + 5;

  const getY = (hr: number) => {
    const normalized = (hr - yMin) / (yMax - yMin);
    return svgHeight - normalized * (svgHeight - 10) - 5;
  };

  const getX = (index: number, total: number = dataPoints.length) => {
    return paddingLeft + (index / Math.max(1, total - 1)) * chartWidth;
  };

  // Construir path suave (Catmull-Rom o Bézier cúbica)
  const pathData = useMemo(() => {
    if (dataPoints.length === 0) return "";
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

      // Puntos de control para suavizado
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [dataPoints, chartWidth, yMax, yMin]);

  // Posición Y de la línea punteada de frecuencia cardíaca máxima
  const maxLineY = getY(effectiveMaxHr);

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
      {/* Columna Izquierda: Información de Frecuencia Cardíaca */}
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

      {/* Área Derecha: Gráfico de Telemetría SVG */}
      <div style={{ flex: 1, position: "relative", minWidth: 0, padding: "0 0.25rem" }}>
        {/* Barra superior de acento (cian / celeste como en Garmin) */}
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
          {/* Etiquetas del eje Y a la izquierda */}
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

          {/* Línea horizontal discontinua en el valor Máximo (rosa) */}
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

          {/* Línea horizontal tenue en la media */}
          <line
            x1={paddingLeft}
            y1={getY(effectiveAvgHr)}
            x2={svgWidth - paddingRight}
            y2={getY(effectiveAvgHr)}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeDasharray="2 3"
            strokeWidth="1"
          />

          {/* Área sombreada bajo la curva */}
          <defs>
            <linearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Relleno con gradiente */}
          <path
            d={`${pathData} L ${getX(dataPoints.length - 1)} ${svgHeight} L ${getX(0)} ${svgHeight} Z`}
            fill="url(#hrAreaGradient)"
          />

          {/* Trazo continuo de Frecuencia Cardíaca (Magenta/Rosa) */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Indicador interactivo hover */}
          {hoveredPoint && (
            <>
              {/* Línea vertical guía */}
              <line
                x1={hoveredPoint.x}
                y1={0}
                x2={hoveredPoint.x}
                y2={svgHeight}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Punto luminoso */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4.5"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2.5"
              />
            </>
          )}
        </svg>

        {/* Tooltip flotante interactivo */}
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
