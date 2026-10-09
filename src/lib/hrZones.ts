export interface HrZone {
  zone: string;
  name: string;
  range: string;
  minHr: number;
  maxHr: number;
  percentage?: number;
  minutes?: number;
  color: string;
  description: string;
}

export const ZONES_CONFIG = [
  {
    zone: "Z1",
    name: "Recuperación",
    minPct: 0.5,
    maxPct: 0.6,
    color: "#06b6d4",
    description: "Ritmo muy suave, activación o regeneración activa.",
  },
  {
    zone: "Z2",
    name: "Aeróbico Ligero",
    minPct: 0.6,
    maxPct: 0.7,
    color: "#10b981",
    description: "Quema de grasas y base de resistencia aeróbica.",
  },
  {
    zone: "Z3",
    name: "Ritmo / Tempo",
    minPct: 0.7,
    maxPct: 0.8,
    color: "#f59e0b",
    description: "Esfuerzo moderado y control cardiovascular constante.",
  },
  {
    zone: "Z4",
    name: "Umbral Anaeróbico",
    minPct: 0.8,
    maxPct: 0.9,
    color: "#f97316",
    description: "Alta intensidad de partido, aceleraciones continuas.",
  },
  {
    zone: "Z5",
    name: "Máximo Esfuerzo",
    minPct: 0.9,
    maxPct: 1.0,
    color: "#f43f5e",
    description: "Sprints a tope, potencia explosiva al límite.",
  },
];

/**
 * Calcula las zonas de frecuencia cardíaca usando EXCLUSIVAMENTE datos reales.
 * - Si existen datos de tiempo por zona del sensor o serie temporal (.FIT), calcula la distribución real.
 * - Si solo se ingresó FC media/máx manual, entrega los rangos cardíacos fisiológicos SIN inventar porcentajes falsos.
 */
export function calculateHrZones(
  avgHr?: number,
  maxRecordedHr?: number,
  userMaxHr = 192,
  hrSeries?: number[],
  durationMinutes?: number,
  timeInHrZone?: number[]
): HrZone[] {
  const max = Math.max(maxRecordedHr || 0, userMaxHr);

  // 1. Caso Real: Zonas directas registradas por el dispositivo (Garmin/Polar/Suunto)
  if (Array.isArray(timeInHrZone) && timeInHrZone.length >= 5) {
    const totalSecs = timeInHrZone.reduce((a, b) => a + b, 0);
    if (totalSecs > 0) {
      return ZONES_CONFIG.map((z, idx) => {
        const secs = timeInHrZone[idx] || 0;
        const pct = Math.round((secs / totalSecs) * 100);
        const mins = Math.round(secs / 60);
        return {
          zone: z.zone,
          name: z.name,
          range: `${Math.round(max * z.minPct)} - ${Math.round(max * z.maxPct)} ppm`,
          minHr: Math.round(max * z.minPct),
          maxHr: Math.round(max * z.maxPct),
          percentage: pct,
          minutes: mins,
          color: z.color,
          description: z.description,
        };
      });
    }
  }

  // 2. Caso Real: Serie temporal de FC continua (trackpoints del archivo .FIT)
  if (Array.isArray(hrSeries) && hrSeries.length >= 5) {
    const totalPoints = hrSeries.length;
    return ZONES_CONFIG.map((z) => {
      const minHr = Math.round(max * z.minPct);
      const maxHr = Math.round(max * z.maxPct);
      // Contar puntos reales que caen en este rango cardíaco
      const inZoneCount = hrSeries.filter(
        (hr) => hr >= minHr && (z.zone === "Z5" ? hr <= maxHr + 15 : hr < maxHr)
      ).length;

      const pct = Math.round((inZoneCount / totalPoints) * 100);
      const mins =
        durationMinutes && durationMinutes > 0
          ? Math.round((inZoneCount / totalPoints) * durationMinutes)
          : undefined;

      return {
        zone: z.zone,
        name: z.name,
        range: `${minHr} - ${maxHr} ppm`,
        minHr,
        maxHr,
        percentage: pct,
        minutes: mins,
        color: z.color,
        description: z.description,
      };
    });
  }

  // 3. Caso Sin Telemetría Continua: Solo rangos fisiológicos, NUNCA datos falsos
  return ZONES_CONFIG.map((z) => ({
    zone: z.zone,
    name: z.name,
    range: `${Math.round(max * z.minPct)} - ${Math.round(max * z.maxPct)} ppm`,
    minHr: Math.round(max * z.minPct),
    maxHr: Math.round(max * z.maxPct),
    percentage: undefined,
    minutes: undefined,
    color: z.color,
    description: z.description,
  }));
}
