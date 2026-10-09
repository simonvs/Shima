import { Loader2, Trash2, Clock, Heart, Flame, Activity, Pencil } from "lucide-react";
import type { ActivityItem, TabType } from "@/types/activity";
import { parseMatchResult } from "@/lib/matchUtils";

interface ActivityListProps {
  events: ActivityItem[];
  activeTab: TabType;
  loading: boolean;
  onDeleteEvent: (id: number) => void;
  onOpenModal: () => void;
  onEditActivity?: (activity: ActivityItem) => void;
  onSelectActivityForHr?: (activity: ActivityItem) => void;
}

export default function ActivityList({
  events,
  activeTab,
  loading,
  onDeleteEvent,
  onOpenModal,
  onEditActivity,
  onSelectActivityForHr,
}: ActivityListProps) {
  const filteredEvents = events.filter((ev) => {
    if (activeTab === "matches") return ev.type === "match";
    if (activeTab === "trainings") return ev.type === "training";
    return true;
  });

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2 className="panel-title">Mis Registros con Telemetría & Biometría</h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          {loading ? "Cargando..." : `${events.length} actividades de tu cuenta`}
        </span>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            gap: "0.5rem",
            color: "var(--text-muted)",
          }}
        >
          <Loader2 className="spin" size={20} /> Obteniendo tus datos...
        </div>
      ) : filteredEvents.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
          No tienes actividades registradas aún. Haz clic en{" "}
          <strong style={{ cursor: "pointer", color: "var(--accent-emerald)" }} onClick={onOpenModal}>
            + Nueva Sesión / Subir .FIT
          </strong>{" "}
          para añadir tu primer partido o entrenamiento.
        </p>
      ) : (
        <div className="events-list">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="event-item" style={{ alignItems: "flex-start", padding: "1rem" }}>
              <div className="event-left" style={{ flex: 1 }}>
                <span className={`event-badge ${ev.type === "match" ? "badge-match" : "badge-training"}`}>
                  {ev.type === "match" ? "Partido" : "Entrenamiento"}
                </span>
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 className="event-title">{ev.title}</h3>
                    {ev.type === "match" && (() => {
                      const parsed = parseMatchResult(ev.result);
                      if (!parsed) return <span className="event-score">S/D</span>;
                      return (
                        <span className={`event-score ${parsed.className}`} title={parsed.label}>
                          {parsed.scoreText}
                          <small
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                              opacity: 0.9,
                            }}
                          >
                            {parsed.label}
                          </small>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="event-sub">
                    {ev.date} • {ev.time || "18:00"}
                  </p>

                  {/* Badges de métricas biométricas / .FIT */}
                  <div className="biometric-badges">
                    {ev.duration_minutes && (
                      <span className="bio-badge">
                        <Clock size={12} color="var(--accent-cyan)" /> {ev.duration_minutes} min
                      </span>
                    )}
                    {ev.avg_heart_rate && (
                      <span
                        className="bio-badge"
                        style={{ cursor: onSelectActivityForHr ? "pointer" : "default" }}
                        onClick={() => onSelectActivityForHr?.(ev)}
                        title="Haz clic para ver el análisis de zonas cardíacas"
                      >
                        <Heart size={12} color="var(--accent-rose)" /> {ev.avg_heart_rate} ppm med.{" "}
                        {ev.max_heart_rate ? `(máx ${ev.max_heart_rate})` : ""}
                      </span>
                    )}
                    {ev.calories && (
                      <span className="bio-badge">
                        <Flame size={12} color="var(--accent-amber)" /> {ev.calories} kcal
                      </span>
                    )}
                    {ev.distance_km && (
                      <span className="bio-badge">
                        <Activity size={12} color="var(--accent-emerald)" /> {ev.distance_km} km
                      </span>
                    )}
                    {ev.goals !== undefined && ev.goals > 0 && (
                      <span className="bio-badge" style={{ color: "var(--accent-emerald)" }}>
                        ⚽ {ev.goals} {ev.goals === 1 ? "gol" : "goles"}
                      </span>
                    )}
                    {ev.assists !== undefined && ev.assists > 0 && (
                      <span className="bio-badge" style={{ color: "var(--accent-cyan)" }}>
                        👟 {ev.assists} {ev.assists === 1 ? "asistencia" : "asistencias"}
                      </span>
                    )}
                    {ev.intensity && (
                      <span className="bio-badge">Intensidad: {ev.intensity}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "1rem" }}>
                {ev.avg_heart_rate && onSelectActivityForHr && (
                  <button
                    onClick={() => onSelectActivityForHr(ev)}
                    title="Analizar Zonas FC"
                    style={{
                      background: "rgba(244, 63, 94, 0.12)",
                      border: "1px solid rgba(244, 63, 94, 0.3)",
                      color: "var(--accent-rose)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Heart size={13} /> Zonas
                  </button>
                )}
                {onEditActivity && (
                  <button
                    onClick={() => onEditActivity(ev)}
                    title="Editar actividad"
                    style={{
                      background: "rgba(6, 182, 212, 0.12)",
                      border: "1px solid rgba(6, 182, 212, 0.3)",
                      color: "var(--accent-cyan)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                )}
                <button
                  onClick={() => onDeleteEvent(ev.id)}
                  title="Eliminar de mi cuenta"
                  style={{ color: "var(--text-dim)", padding: "4px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
