"use client";

import { useState } from "react";
import "./dashboard.css";
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
  Dumbbell
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

interface EventItem {
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

const initialEvents: EventItem[] = [
  { id: 1, type: "match", title: "vs. Atlético FC", date: "Sáb, 12 Oct", time: "16:00", result: "3 - 1 (V)", goals: 2 },
  { id: 2, type: "training", title: "Entrenamiento Táctico y Balón Parado", date: "Jue, 10 Oct", time: "09:30", intensity: "Alta" },
  { id: 3, type: "match", title: "vs. Deportivo Norte", date: "Dom, 05 Oct", time: "18:00", result: "2 - 2 (E)", goals: 1 },
  { id: 4, type: "training", title: "Físico y Recuperación Activa", date: "Mar, 03 Oct", time: "10:00", intensity: "Media" },
];

export default function FootballDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "matches" | "trainings" | "calendar">("dashboard");
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState<"match" | "training">("match");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const newEvent = {
      id: Date.now(),
      type: eventType,
      title,
      date,
      time: "18:00",
      ...(eventType === "match" ? { result: extraInfo || "Programado" } : { intensity: extraInfo || "Media" })
    };

    setEvents([newEvent, ...events]);
    setTitle("");
    setDate("");
    setExtraInfo("");
    setIsModalOpen(false);
  };

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
            <Trophy size={18} /> Partidos
          </li>
          <li
            className={`nav-item ${activeTab === "trainings" ? "active" : ""}`}
            onClick={() => setActiveTab("trainings")}
          >
            <Dumbbell size={18} /> Entrenamientos
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
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Entrenador / Jugador</p>
              <p style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>Supabase Conectado</p>
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
              {activeTab === "matches" && "Historial y Registro de Partidos"}
              {activeTab === "trainings" && "Carga y Entrenamientos"}
              {activeTab === "calendar" && "Calendario de Actividades"}
            </h1>
            <p className="page-subtitle">
              Temporada 2026/2027 • Análisis cuantitativo de fútbol
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Nuevo Registro
            </button>
          </div>
        </header>

        {/* Tarjetas KPI */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span>Goles Totales</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
                <Target size={18} />
              </div>
            </div>
            <div className="kpi-val">9</div>
            <div className="kpi-trend">
              <TrendingUp size={14} /> +1.5 goles p/partido
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Minutos Disputados</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-val">515′</div>
            <div className="kpi-trend" style={{ color: "var(--accent-cyan)" }}>
              <CheckCircle2 size={14} /> 85.8 min promedio
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
              <TrendingUp size={14} /> Alta intensidad
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Efectividad / Victorias</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}>
                <Trophy size={18} />
              </div>
            </div>
            <div className="kpi-val">66.7%</div>
            <div className="kpi-trend" style={{ color: "var(--text-muted)" }}>
              4V - 1E - 1D
            </div>
          </div>
        </div>

        {/* Sección de Gráficos y Lista */}
        <div className="grid-2col">
          {/* Gráfico de Evolución */}
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

        {/* Últimos Partidos y Entrenamientos */}
        <section className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Registro Reciente de Partidos y Entrenamientos</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              {events.length} sesiones registradas
            </span>
          </div>

          <div className="events-list">
            {events.map((ev) => (
              <div key={ev.id} className="event-item">
                <div className="event-left">
                  <span className={`event-badge ${ev.type === "match" ? "badge-match" : "badge-training"}`}>
                    {ev.type === "match" ? "Partido" : "Entrenamiento"}
                  </span>
                  <div>
                    <h3 className="event-title">{ev.title}</h3>
                    <p className="event-sub">{ev.date} • {ev.time}</p>
                  </div>
                </div>

                <div>
                  {ev.type === "match" ? (
                    <span className="event-score">{ev.result}</span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "var(--accent-amber)", fontWeight: 500 }}>
                      Intensidad: {ev.intensity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal para Agregar Partido o Entrenamiento */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Nuevo Registro Deportivo</h3>
              <button onClick={() => setIsModalOpen(false)}>
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
                <label className="form-label">
                  {eventType === "match" ? "Resultado (Ej: 2 - 1)" : "Intensidad (Alta, Media, Baja)"}
                </label>
                <input
                  type="text"
                  placeholder={eventType === "match" ? "3 - 1" : "Alta"}
                  className="form-input"
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
