import { Target, TrendingUp, Flame, Heart, Activity } from "lucide-react";

interface StatCardsProps {
  totalGoles: number;
  totalAsistencias?: number;
  partidosCount: number;
  totalCalorias: number;
  avgHR: number | null;
  totalDistancia: number;
  totalActivitiesCount: number;
}

export default function StatCards({
  totalGoles,
  totalAsistencias = 0,
  partidosCount,
  totalCalorias,
  avgHR,
  totalDistancia,
  totalActivitiesCount,
}: StatCardsProps) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Goles y Asistencias</span>
          <div
            className="kpi-icon-wrap"
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}
          >
            <Target size={18} />
          </div>
        </div>
        <div className="kpi-val" style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", flexWrap: "wrap" }}>
          <span>{totalGoles} <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>goles</span></span>
          <span style={{ fontSize: "1.15rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
            • {totalAsistencias} <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>asist.</span>
          </span>
        </div>
        <div className="kpi-trend">
          <TrendingUp size={14} /> En {partidosCount} partidos {totalAsistencias > 0 ? `(${totalGoles + totalAsistencias} G+A)` : ""}
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Calorías Quemadas</span>
          <div
            className="kpi-icon-wrap"
            style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}
          >
            <Flame size={18} />
          </div>
        </div>
        <div className="kpi-val">{totalCalorias > 0 ? `${totalCalorias.toLocaleString()} kcal` : "--"}</div>
        <div className="kpi-trend" style={{ color: "var(--accent-rose)" }}>
          {totalCalorias > 0 ? "Extraído de sesiones GPS / .FIT" : "Sin datos de calorías aún"}
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Frecuencia Cardíaca Media</span>
          <div
            className="kpi-icon-wrap"
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}
          >
            <Heart size={18} />
          </div>
        </div>
        <div className="kpi-val">{avgHR ? `${avgHR} ppm` : "--"}</div>
        <div className="kpi-trend" style={{ color: "var(--accent-amber)" }}>
          {avgHR ? "Zona aeróbica / anaeróbica" : "Sensor FC no registrado"}
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Distancia Total (GPS)</span>
          <div
            className="kpi-icon-wrap"
            style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}
          >
            <Activity size={18} />
          </div>
        </div>
        <div className="kpi-val">
          {totalDistancia > 0 ? `${totalDistancia.toFixed(1)} km` : `${totalActivitiesCount} reg.`}
        </div>
        <div className="kpi-trend" style={{ color: "var(--accent-cyan)" }}>
          {totalActivitiesCount} actividades personales
        </div>
      </div>
    </div>
  );
}
