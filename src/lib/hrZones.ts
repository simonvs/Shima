export interface HrZone {
  zone: string;
  name: string;
  range: string;
  minHr: number;
  maxHr: number;
  percentage: number;
  color: string;
  description: string;
}

export function calculateHrZones(
  avgHr?: number,
  maxRecordedHr?: number,
  userMaxHr = 190
): HrZone[] {
  const max = Math.max(maxRecordedHr || 0, userMaxHr);

  const zonesConfig = [
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

  // Si no hay datos de FC, devolvemos distribución neutral
  if (!avgHr || avgHr <= 0) {
    return zonesConfig.map((z) => ({
      zone: z.zone,
      name: z.name,
      range: `${Math.round(max * z.minPct)} - ${Math.round(max * z.maxPct)} ppm`,
      minHr: Math.round(max * z.minPct),
      maxHr: Math.round(max * z.maxPct),
      percentage: 0,
      color: z.color,
      description: z.description,
    }));
  }

  // Modelado ponderado normalizado en base a FC media y FC máx
  const hrRatio = avgHr / max;
  const weights = zonesConfig.map((z) => {
    const zoneMid = (z.minPct + z.maxPct) / 2;
    const diff = Math.abs(hrRatio - zoneMid);
    // Distribución Gaussiana centrada en el ratio medio
    return Math.exp(-Math.pow(diff / 0.12, 2));
  });

  const sumWeights = weights.reduce((a, b) => a + b, 0);

  return zonesConfig.map((z, idx) => {
    const pct = sumWeights > 0 ? Math.round((weights[idx] / sumWeights) * 100) : 0;
    return {
      zone: z.zone,
      name: z.name,
      range: `${Math.round(max * z.minPct)} - ${Math.round(max * z.maxPct)} ppm`,
      minHr: Math.round(max * z.minPct),
      maxHr: Math.round(max * z.maxPct),
      percentage: pct,
      color: z.color,
      description: z.description,
    };
  });
}
