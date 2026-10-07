"use client";

import { useEffect, useState } from "react";
import "./dashboard.css";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Calendar as CalendarIcon,
  Activity,
  Flame,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Target,
  BarChart3,
  Dumbbell,
  Loader2,
  Trash2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

interface ActivityItem {
  id: number;
  type: "match" | "training";
  title: string;
  date: string;
  time: string;
  result?: string;
  goals?: number;
  intensity?: string;
}

const initialPerformanceData = [
  { match: "Jor. 1", goles: 2, minutos: 90, kmRecorridos: 9.8, xG: 1.4 },
  { match: "Jor. 2", goles: 1, minutos: 85, kmRecorridos: 10.2, xG: 0.9 },
  { match: "Jor. 3", goles: 3, minutos: 90, kmRecorridos: 11.1, xG: 2.1 },
  { match: "Jor. 4", goles: 0, minutos: 70, kmRecorridos: 8.4, xG: 0.4 },
  { match: "Jor. 5", goles: 2, minutos: 90, kmRecorridos: 10.5, xG: 1.8 },
  { match: "Jor. 6", goles: 1, minutos: 90, kmRecorridos: 10.1, xG: 1.2 },
];

export default function FootballDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "matches" | "trainings" | "calendar">("dashboard");
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos del formulario
  const [eventType, setEventType] = useState<"match" | "training">("match");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [goals, setGoals] = useState("0");
  const [extraInfo, setExtraInfo] = useState("");

  // Cargar datos desde Supabase
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Error al cargar actividades:", error.message);
      } else if (data) {
        setEvents(data);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Guardar nueva actividad en Supabase
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    try {
      setSaving(true);
      const newEntry = {
        type: eventType,
        title,
        date,
        time: time || "18:00",
        result: eventType === "match" ? (extraInfo || "Programado") : null,
        goals: eventType === "match" ? parseInt(goals, 10) || 0 : 0,
        intensity: eventType === "training" ? (extraInfo || "Media") : null,
      };

      const { data, error } = await supabase
        .from("activities")
        .insert([newEntry])
        .select();

      if (error) {
        alert("Error al guardar en Supabase: " + error.message);
      } else if (data && data.length > 0) {
        setEvents([data[0], ...events]);
        setTitle("");
        setDate("");
        setExtraInfo("");
        setGoals("0");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar actividad
  const handleDeleteEvent = async (id: number) => {
    if (!confirm("¿Deseas eliminar este registro de la base de datos?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (!error) {
      setEvents(events.filter((ev) => ev.id !== id));
    } else {
      alert("Error al eliminar: " + error.message);
    }
  };

  // Métricas calculadas en vivo
  const totalGoles = events.reduce((acc, curr) => acc + (curr.goals || 0), 0);
  const partidosCount = events.filter((e) => e.type === "match").length;
  const entrenamientosCount = events.filter((e) => e.type === "training").length;

  return (
    <div className="dashboard-container">
      {/* Barra Lateral / Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚽</div>
          <span className="brand-name">SHIMA FC</span>
        </div>

        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Activity size={18} /> Resumen General
          </li>
          <li
            className={`nav-item ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            <Trophy size={18} /> Partidos ({partidosCount})
          </li>
          <li
            className={`nav-item ${activeTab === "trainings" ? "active" : ""}`}
            onClick={() => setActiveTab("trainings")}
          >
            <Dumbbell size={18} /> Entrenamientos ({entrenamientosCount})
          </li>
          <li
            className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            <CalendarIcon size={18} /> Calendario
          </li>
        </ul>

        <div className="user-profile-badge">
          <div className="user-info">
            <div className="user-avatar">DT</div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Entrenador Principal</p>
              <p style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>● Supabase Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        {/* Cabecera Superior */}
        <header className="top-header">
          <div>
            <h1 className="page-title">
              {activeTab === "dashboard" && "Rendimiento y Estadísticas"}
              {activeTab === "matches" && "Historial de Partidos"}
              {activeTab === "trainings" && "Carga y Entrenamientos"}
              {activeTab === "calendar" && "Calendario de Actividades"}
            </h1>
            <p className="page-subtitle">
              Sincronizado en tiempo real con PostgreSQL • Supabase
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Nuevo Registro
            </button>
          </div>
        </header>

        {/* Tarjetas KPI con datos reales */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span>Goles Registrados</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
                <Target size={18} />
              </div>
            </div>
            <div className="kpi-val">{totalGoles}</div>
            <div className="kpi-trend">
              <TrendingUp size={14} /> En {partidosCount} partidos registrados
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Sesiones de Entrenamiento</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-val">{entrenamientosCount}</div>
            <div className="kpi-trend" style={{ color: "var(--accent-cyan)" }}>
              <CheckCircle2 size={14} /> Preparación activa
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Distancia Promedio</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}>
                <Flame size={18} />
              </div>
            </div>
            <div className="kpi-val">10.02 km</div>
            <div className="kpi-trend" style={{ color: "var(--accent-amber)" }}>
              <TrendingUp size={14} /> GPS / Track
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Total Actividades</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}>
                <Trophy size={18} />
              </div>
            </div>
            <div className="kpi-val">{events.length}</div>
            <div className="kpi-trend" style={{ color: "var(--text-muted)" }}>
              Base de Datos Supabase
            </div>
          </div>
        </div>

        {/* Sección de Gráficos y Lista */}
        <div className="grid-2col">
          {/* Gráfico de Evolución Física */}
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Métricas de Distancia e Intensidad (km)</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  Recorrido físico por fecha disputada
                </p>
              </div>
              <BarChart3 size={18} color="var(--accent-cyan)" />
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={initialPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      color: "#fff"
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

          {/* Gráfico de Goles y xG */}
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Goles vs Goles Esperados (xG)</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Eficiencia ofensiva</p>
              </div>
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="match" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 26, 46, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="goles" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Goles" />
                  <Bar dataKey="xG" fill="#f59e0b" radius={[4, 4, 0, 0]} name="xG Esperado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Lista en tiempo real de Supabase */}
        <section className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Registro en Vivo (Supabase)</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              {loading ? "Cargando..." : `${events.length} registros sincronizados`}
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "0.5rem", color: "var(--text-muted)" }}>
              <Loader2 className="spin" size={20} /> Conectando con la base de datos...
            </div>
          ) : events.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              No hay actividades registradas aún. ¡Agrega una con el botón "+ Nuevo Registro"!
            </p>
          ) : (
            <div className="events-list">
              {events
                .filter((ev) => {
                  if (activeTab === "matches") return ev.type === "match";
                  if (activeTab === "trainings") return ev.type === "training";
                  return true;
                })
                .map((ev) => (
                  <div key={ev.id} className="event-item">
                    <div className="event-left">
                      <span className={`event-badge ${ev.type === "match" ? "badge-match" : "badge-training"}`}>
                        {ev.type === "match" ? "Partido" : "Entrenamiento"}
                      </span>
                      <div>
                        <h3 className="event-title">{ev.title}</h3>
                        <p className="event-sub">{ev.date} • {ev.time || "18:00"}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      {ev.type === "match" ? (
                        <div style={{ textAlign: "right" }}>
                          <span className="event-score">{ev.result || "S/D"}</span>
                          {ev.goals !== undefined && ev.goals > 0 && (
                            <p style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "2px" }}>
                              ⚽ {ev.goals} {ev.goals === 1 ? "gol" : "goles"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--accent-amber)", fontWeight: 500 }}>
                          Intensidad: {ev.intensity || "Media"}
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        title="Eliminar de Supabase"
                        style={{ color: "var(--text-dim)", padding: "4px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal para Agregar Partido o Entrenamiento */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Nuevo Registro Deportivo</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={saving}>
                <X size={20} color="var(--text-dim)" />
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label className="form-label">Tipo de Sesión</label>
                <select
                  className="form-select"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as "match" | "training")}
                >
                  <option value="match">Partido Oficial / Amistoso</option>
                  <option value="training">Entrenamiento</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {eventType === "match" ? "Rival / Partido" : "Nombre de la Sesión"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={eventType === "match" ? "Ej: vs. Deportivo Sur" : "Ej: Trabajo de velocidad y posesión"}
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {eventType === "match" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Resultado (Ej: 3 - 1)</label>
                    <input
                      type="text"
                      placeholder="3 - 1 (V)"
                      className="form-input"
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Goles Anotados</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Intensidad</label>
                  <select
                    className="form-select"
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja / Recuperación">Baja / Recuperación</option>
                  </select>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="spin" /> Guardando en Supabase...
                    </>
                  ) : (
                    "Guardar en Base de Datos"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
