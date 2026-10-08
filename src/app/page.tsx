"use client";

import { useEffect, useState, useRef } from "react";
import "./dashboard.css";
import "./auth.css";
import { supabase } from "@/lib/supabase";
import { parseFitFile } from "@/lib/fitParser";
import type { User } from "@supabase/supabase-js";
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
  Trash2,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Heart,
  UploadCloud,
  FileCheck2
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
  user_id?: string;
  type: "match" | "training";
  title: string;
  date: string;
  time: string;
  result?: string;
  goals?: number;
  intensity?: string;
  duration_minutes?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  distance_km?: number;
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
  // Estado de sesión
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Estados de Auth
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Estados del Dashboard
  const [activeTab, setActiveTab] = useState<"dashboard" | "matches" | "trainings" | "calendar">("dashboard");
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos de nueva actividad (básicos + biométricos)
  const [eventType, setEventType] = useState<"match" | "training">("match");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [goals, setGoals] = useState("0");
  const [extraInfo, setExtraInfo] = useState("");

  // Métricas avanzadas / .FIT
  const [durationMinutes, setDurationMinutes] = useState("");
  const [calories, setCalories] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  // Estado del parser .FIT
  const [parsingFit, setParsingFit] = useState(false);
  const [fitFileName, setFitFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Escuchar sesión
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error al obtener sesión:", err);
      } finally {
        setAuthChecking(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Cargar actividades filtrando estrictamente por el usuario conectado
  const fetchActivities = async (currentUser: User) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", currentUser.id)
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
    if (user) {
      fetchActivities(user);
    } else {
      setEvents([]);
    }
  }, [user]);

  // Manejar Login / Registro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          setAuthError(error.message);
        } else if (data.session) {
          setUser(data.session.user);
        } else {
          setAuthSuccessMsg("¡Registro exitoso! Revisa tu email para confirmar o inicia sesión.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          setAuthError(error.message);
        } else if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      setAuthError("Ocurrió un error inesperado al procesar la autenticación.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Procesamiento del archivo .FIT
  const handleFitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsingFit(true);
      setFitFileName(file.name);
      const summary = await parseFitFile(file);

      if (summary.durationMinutes) setDurationMinutes(summary.durationMinutes.toString());
      if (summary.calories) setCalories(summary.calories.toString());
      if (summary.avgHeartRate) setAvgHeartRate(summary.avgHeartRate.toString());
      if (summary.maxHeartRate) setMaxHeartRate(summary.maxHeartRate.toString());
      if (summary.distanceKm) setDistanceKm(summary.distanceKm.toString());

      // Auto rellenar título si está vacío
      if (!title) {
        setTitle(`Sesión Garmin/GPS (${file.name.replace(".fit", "")})`);
      }
    } catch (err: any) {
      alert("Error leyendo archivo .FIT: " + err.message);
      setFitFileName(null);
    } finally {
      setParsingFit(false);
    }
  };

  // Guardar actividad asociándola al user_id
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !user) return;

    try {
      setSaving(true);
      const newEntry = {
        user_id: user.id,
        type: eventType,
        title,
        date,
        time: time || "18:00",
        result: eventType === "match" ? (extraInfo || "Programado") : null,
        goals: eventType === "match" ? parseInt(goals, 10) || 0 : 0,
        intensity: eventType === "training" ? (extraInfo || "Media") : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        calories: calories ? parseInt(calories, 10) : null,
        avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate, 10) : null,
        max_heart_rate: maxHeartRate ? parseInt(maxHeartRate, 10) : null,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
      };

      const { data, error } = await supabase
        .from("activities")
        .insert([newEntry])
        .select();

      if (error) {
        alert("Error al guardar en Supabase: " + error.message);
      } else if (data && data.length > 0) {
        setEvents([data[0], ...events]);
        // Reset campos
        setTitle("");
        setDate("");
        setExtraInfo("");
        setGoals("0");
        setDurationMinutes("");
        setCalories("");
        setAvgHeartRate("");
        setMaxHeartRate("");
        setDistanceKm("");
        setFitFileName(null);
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

  // Pantalla de carga inicial
  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
        <Loader2 className="spin" size={24} color="var(--accent-emerald)" />
        <span>Iniciando sesión segura...</span>
      </div>
    );
  }

  // Vista Login / Registro
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand-icon">⚽</div>
            <h1 className="auth-title">SHIMA Football Analytics</h1>
            <p className="auth-subtitle">
              {isSignUp ? "Crea tu cuenta de entrenador o jugador" : "Ingresa para gestionar tus partidos y entrenamientos"}
            </p>
          </div>

          {authError && <div className="auth-alert-error">{authError}</div>}
          {authSuccessMsg && <div className="auth-alert-success">{authSuccessMsg}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form" style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Mail size={14} /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@futbol.com"
                className="form-input"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Lock size={14} /> Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="form-input"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={authLoading}
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", padding: "0.75rem" }}
            >
              {authLoading ? (
                <>
                  <Loader2 size={18} className="spin" /> Procesando...
                </>
              ) : (
                <>
                  {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {isSignUp ? (
              <span>
                ¿Ya tienes una cuenta?
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => {
                    setIsSignUp(false);
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                >
                  Inicia sesión aquí
                </button>
              </span>
            ) : (
              <span>
                ¿Aún no tienes cuenta?
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => {
                    setIsSignUp(true);
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                >
                  Regístrate gratis
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Métricas calculadas en vivo del usuario actual
  const totalGoles = events.reduce((acc, curr) => acc + (curr.goals || 0), 0);
  const totalCalorias = events.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalDistancia = events.reduce((acc, curr) => acc + (curr.distance_km || 0), 0);
  const hrEvents = events.filter((e) => e.avg_heart_rate);
  const avgHR = hrEvents.length > 0 ? Math.round(hrEvents.reduce((acc, c) => acc + (c.avg_heart_rate || 0), 0) / hrEvents.length) : null;
  const partidosCount = events.filter((e) => e.type === "match").length;
  const entrenamientosCount = events.filter((e) => e.type === "training").length;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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
            <Trophy size={18} /> Mis Partidos ({partidosCount})
          </li>
          <li
            className={`nav-item ${activeTab === "trainings" ? "active" : ""}`}
            onClick={() => setActiveTab("trainings")}
          >
            <Dumbbell size={18} /> Mis Entrenamientos ({entrenamientosCount})
          </li>
          <li
            className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            <CalendarIcon size={18} /> Calendario
          </li>
        </ul>

        {/* Perfil del usuario */}
        <div className="user-profile-badge">
          <div className="user-info" style={{ overflow: "hidden" }}>
            <div className="user-avatar">
              {user.email ? user.email.slice(0, 2).toUpperCase() : "DT"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--accent-emerald)" }}>● Cuenta Personal</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-logout"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 className="page-title">
              {activeTab === "dashboard" && "Mi Rendimiento Deportivo"}
              {activeTab === "matches" && "Mis Partidos Registrados"}
              {activeTab === "trainings" && "Mis Sesiones de Entrenamiento"}
              {activeTab === "calendar" && "Calendario Personal"}
            </h1>
            <p className="page-subtitle">
              Datos biométricos y técnicos de <strong>{user.email}</strong>
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Nueva Sesión / Subir .FIT
            </button>
          </div>
        </header>

        {/* Tarjetas KPI Biométricas y Técnicas */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span>Goles Totales</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
                <Target size={18} />
              </div>
            </div>
            <div className="kpi-val">{totalGoles}</div>
            <div className="kpi-trend">
              <TrendingUp size={14} /> En {partidosCount} partidos jugados
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Calorías Quemadas</span>
              <div className="kpi-icon-wrap" style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}>
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
              <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}>
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
              <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
                <Activity size={18} />
              </div>
            </div>
            <div className="kpi-val">{totalDistancia > 0 ? `${totalDistancia.toFixed(1)} km` : `${events.length} reg.`}</div>
            <div className="kpi-trend" style={{ color: "var(--accent-cyan)" }}>
              {events.length} actividades personales
            </div>
          </div>
        </div>

        {/* Sección de Gráficos */}
        <div className="grid-2col">
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Evolución de Intensidad y Distancia (km)</h2>
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

          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Goles vs Goles Esperados (xG)</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Efectividad de ataque</p>
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

        {/* Lista de Registros Personales */}
        <section className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Mis Registros con Telemetría & Biometría</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              {loading ? "Cargando..." : `${events.length} actividades de tu cuenta`}
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "0.5rem", color: "var(--text-muted)" }}>
              <Loader2 className="spin" size={20} /> Obteniendo tus datos...
            </div>
          ) : events.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
              No tienes actividades registradas aún. Haz clic en <strong>"+ Nueva Sesión / Subir .FIT"</strong> para añadir tu primer partido o entrenamiento.
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
                  <div key={ev.id} className="event-item" style={{ alignItems: "flex-start", padding: "1rem" }}>
                    <div className="event-left" style={{ flex: 1 }}>
                      <span className={`event-badge ${ev.type === "match" ? "badge-match" : "badge-training"}`}>
                        {ev.type === "match" ? "Partido" : "Entrenamiento"}
                      </span>
                      <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <h3 className="event-title">{ev.title}</h3>
                          {ev.type === "match" && (
                            <span className="event-score">{ev.result || "S/D"}</span>
                          )}
                        </div>
                        <p className="event-sub">{ev.date} • {ev.time || "18:00"}</p>

                        {/* Badges de métricas biométricas / .FIT */}
                        <div className="biometric-badges">
                          {ev.duration_minutes && (
                            <span className="bio-badge">
                              <Clock size={12} color="var(--accent-cyan)" /> {ev.duration_minutes} min
                            </span>
                          )}
                          {ev.avg_heart_rate && (
                            <span className="bio-badge">
                              <Heart size={12} color="var(--accent-rose)" /> {ev.avg_heart_rate} ppm med. {ev.max_heart_rate ? `(máx ${ev.max_heart_rate})` : ""}
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
                          {ev.intensity && (
                            <span className="bio-badge">
                              Intensidad: {ev.intensity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      title="Eliminar de mi cuenta"
                      style={{ color: "var(--text-dim)", padding: "4px", marginLeft: "1rem" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal para Agregar Actividad con Carga .FIT y Entrada Manual */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Registrar Actividad Deportiva</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={saving}>
                <X size={20} color="var(--text-dim)" />
              </button>
            </div>

            {/* Caja para subir archivo .FIT */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".fit"
              style={{ display: "none" }}
              onChange={handleFitFileUpload}
            />

            <div
              className={`fit-dropzone ${fitFileName ? "fit-dropzone-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {parsingFit ? (
                <>
                  <Loader2 className="spin" size={24} color="var(--accent-emerald)" />
                  <p style={{ fontSize: "0.85rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    Extrayendo métricas del archivo .FIT...
                  </p>
                </>
              ) : fitFileName ? (
                <>
                  <FileCheck2 size={24} color="var(--accent-emerald)" />
                  <p style={{ fontSize: "0.85rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    {fitFileName} cargado con éxito
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    Campos de FC, duración y calorías autocompletados
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud size={24} color="var(--accent-emerald)" />
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                    Adjuntar archivo .FIT (Garmin, Polar, Suunto)
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    O completa los datos manualmente abajo
                  </p>
                </>
              )}
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
                  {eventType === "match" ? "Rival / Nombre del Partido" : "Nombre de la Sesión"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={eventType === "match" ? "Ej: vs. Atlético FC" : "Ej: Trabajo de posesión y resistencia"}
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
                    <label className="form-label">Resultado (Ej: 2 - 1)</label>
                    <input
                      type="text"
                      placeholder="2 - 1 (Victoria)"
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

              {/* Sección Biometría y Rendimiento Físico */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "0.75rem" }}>
                  Datos Físicos y Biometría (Manuales o de .FIT)
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Duración (minutos)</label>
                    <input
                      type="number"
                      placeholder="Ej: 90"
                      className="form-input"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Calorías (kcal)</label>
                    <input
                      type="number"
                      placeholder="Ej: 750"
                      className="form-input"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">FC Media (ppm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 154"
                      className="form-input"
                      value={avgHeartRate}
                      onChange={(e) => setAvgHeartRate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FC Máxima (ppm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 188"
                      className="form-input"
                      value={maxHeartRate}
                      onChange={(e) => setMaxHeartRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Distancia Recorrida (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 9.85"
                    className="form-input"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>
              </div>

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
                      <Loader2 size={16} className="spin" /> Guardando en tu cuenta...
                    </>
                  ) : (
                    "Guardar Actividad"
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
