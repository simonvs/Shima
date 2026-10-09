"use client";

import { useEffect, useState } from "react";
import "./dashboard.css";
import "./auth.css";
import { supabase } from "@/lib/supabase";
import SportsCalendar from "@/components/SportsCalendar";
import Sidebar from "@/components/Sidebar";
import StatCards from "@/components/StatCards";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import ActivityList from "@/components/ActivityList";
import ActivityModal from "@/components/ActivityModal";
import UserProfileModal from "@/components/UserProfileModal";
import ActivityZonesModal from "@/components/ActivityZonesModal";
import AuthView from "@/components/AuthView";
import HrZonesCard from "@/components/HrZonesCard";
import type { ActivityItem, TabType } from "@/types/activity";
import type { UserBiometrics } from "@/types/user";
import type { User } from "@supabase/supabase-js";
import { Plus, Loader2 } from "lucide-react";

export default function FootballDashboard() {
  // Estado de sesión y biometría
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [biometrics, setBiometrics] = useState<UserBiometrics>({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Estados del Dashboard
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityItem | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");
  const [selectedHrActivity, setSelectedHrActivity] = useState<ActivityItem | null>(null);
  const [zonesModalActivity, setZonesModalActivity] = useState<ActivityItem | null>(null);

  const handleOpenNewModal = (dateStr?: string) => {
    setActivityToEdit(null);
    setSelectedCalendarDate(dateStr || "");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: ActivityItem) => {
    setActivityToEdit(activity);
    setSelectedCalendarDate(activity.date || "");
    setIsModalOpen(true);
  };

  // Cargar actividades filtrando estrictamente por el usuario conectado
  const loadActivities = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId)
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

  const extractBiometrics = (u: User | null): UserBiometrics => {
    if (!u?.user_metadata) return {};
    return {
      weight_kg: u.user_metadata.weight_kg ? parseFloat(u.user_metadata.weight_kg) : undefined,
      age: u.user_metadata.age ? parseInt(u.user_metadata.age, 10) : undefined,
      gender: u.user_metadata.gender || undefined,
      max_heart_rate: u.user_metadata.max_heart_rate
        ? parseInt(u.user_metadata.max_heart_rate, 10)
        : undefined,
    };
  };

  // 1. Escuchar sesión y cargar actividades de forma reactiva
  useEffect(() => {
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setBiometrics(extractBiometrics(currentUser));
        if (currentUser) {
          await loadActivities(currentUser.id);
        }
      } catch (err) {
        console.error("Error al obtener sesión:", err);
      } finally {
        setAuthChecking(false);
      }
    };

    void initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setBiometrics(extractBiometrics(currentUser));
      setAuthChecking(false);
      if (currentUser) {
        void loadActivities(currentUser.id);
      } else {
        setEvents([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBiometrics({});
  };

  const handleSaveBiometrics = async (newBio: UserBiometrics): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          weight_kg: newBio.weight_kg,
          age: newBio.age,
          gender: newBio.gender,
          max_heart_rate: newBio.max_heart_rate,
        },
      });

      if (error) {
        alert("Error al actualizar perfil biométrico: " + error.message);
        return false;
      }

      if (data.user) {
        setUser(data.user);
        setBiometrics(newBio);
      }
      return true;
    } catch (err) {
      console.error("Error al actualizar biometría:", err);
      return false;
    }
  };

  // Guardar o actualizar actividad asociándola al user_id
  const handleSaveActivity = async (
    activityData: Omit<ActivityItem, "id">,
    editId?: number
  ): Promise<boolean> => {
    try {
      // Separar hr_series para proteger la inserción si la tabla remota no tiene esa columna
      const { hr_series, ...supabasePayload } = activityData;

      if (editId) {
        // Modo Edición / Actualización
        let { data, error } = await supabase
          .from("activities")
          .update(supabasePayload)
          .eq("id", editId)
          .select();

        // Si la columna assists no existe en Supabase (error 42703), reintentar sin ella
        if (error && (error.code === "42703" || error.message?.includes("assists"))) {
          const { assists, ...payloadWithoutAssists } = supabasePayload;
          const retry = await supabase
            .from("activities")
            .update(payloadWithoutAssists)
            .eq("id", editId)
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          alert("Error al actualizar en Supabase: " + error.message);
          return false;
        }

        if (data && data.length > 0) {
          const updatedItem: ActivityItem = {
            ...data[0],
            hr_series: hr_series ?? events.find((e) => e.id === editId)?.hr_series,
            assists: activityData.assists,
          };
          setEvents((prev) =>
            prev.map((ev) => (ev.id === editId ? updatedItem : ev))
          );
          if (zonesModalActivity?.id === editId) {
            setZonesModalActivity(updatedItem);
          }
          if (selectedHrActivity?.id === editId) {
            setSelectedHrActivity(updatedItem);
          }
          return true;
        }
        return false;
      } else {
        // Modo Creación
        let { data, error } = await supabase
          .from("activities")
          .insert([supabasePayload])
          .select();

        // Si la columna assists aún no existe en Supabase (error 42703), reintentar sin ella para no bloquear el guardado
        if (error && (error.code === "42703" || error.message?.includes("assists"))) {
          const { assists, ...payloadWithoutAssists } = supabasePayload;
          const retry = await supabase
            .from("activities")
            .insert([payloadWithoutAssists])
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          alert("Error al guardar en Supabase: " + error.message);
          return false;
        }

        if (data && data.length > 0) {
          setEvents((prev) => [{ ...data[0], hr_series, assists: activityData.assists }, ...prev]);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error("Error al procesar actividad:", err);
      return false;
    }
  };

  // Eliminar actividad
  const handleDeleteEvent = async (id: number) => {
    if (!confirm("¿Deseas eliminar este registro de la base de datos?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (!error) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } else {
      alert("Error al eliminar: " + error.message);
    }
  };

  // Pantalla de carga inicial
  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <Loader2 className="spin" size={24} color="var(--accent-emerald)" />
        <span>Iniciando sesión segura...</span>
      </div>
    );
  }

  // Vista Login / Registro
  if (!user) {
    return <AuthView onAuthSuccess={(newUser) => setUser(newUser)} />;
  }

  // Métricas calculadas en vivo del usuario actual
  const totalGoles = events.reduce((acc, curr) => acc + (curr.goals || 0), 0);
  const totalAsistencias = events.reduce((acc, curr) => acc + (curr.assists || 0), 0);
  const totalCalorias = events.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalDistancia = events.reduce((acc, curr) => acc + (curr.distance_km || 0), 0);
  const hrEvents = events.filter((e) => e.avg_heart_rate);
  const avgHR =
    hrEvents.length > 0
      ? Math.round(hrEvents.reduce((acc, c) => acc + (c.avg_heart_rate || 0), 0) / hrEvents.length)
      : null;
  const partidosCount = events.filter((e) => e.type === "match").length;
  const entrenamientosCount = events.filter((e) => e.type === "training").length;

  return (
    <div className="dashboard-container">
      {/* Sidebar modular */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        matchesCount={partidosCount}
        trainingsCount={entrenamientosCount}
        user={user}
        biometrics={biometrics}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
      />

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
              Datos biométricos y técnicos de <strong>{user.email}</strong>{" "}
              {biometrics.weight_kg && (
                <span style={{ color: "var(--accent-emerald)" }}>
                  • {biometrics.weight_kg}kg | {biometrics.age} años ({biometrics.gender === "female" ? "F" : "M"})
                </span>
              )}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => handleOpenNewModal()}
            >
              <Plus size={18} /> Nueva Sesión / Subir .FIT
            </button>
          </div>
        </header>

        {activeTab === "calendar" ? (
          <SportsCalendar
            events={events}
            onNewEventOnDate={(date) => handleOpenNewModal(date)}
            onEditEvent={(event) => handleOpenEditModal(event)}
          />
        ) : (
          <>
            {/* Tarjetas KPI y Gráficos solo en la pestaña de Resumen General */}
            {activeTab === "dashboard" && (
              <>
                <StatCards
                  totalGoles={totalGoles}
                  totalAsistencias={totalAsistencias}
                  partidosCount={partidosCount}
                  totalCalorias={totalCalorias}
                  avgHR={avgHR}
                  totalDistancia={totalDistancia}
                  totalActivitiesCount={events.length}
                />

                <div style={{ marginBottom: "1.5rem" }}>
                  <AnalyticsCharts events={events} />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <HrZonesCard
                    avgHeartRate={selectedHrActivity ? selectedHrActivity.avg_heart_rate : avgHR}
                    maxHeartRate={selectedHrActivity ? selectedHrActivity.max_heart_rate : undefined}
                    activityTitle={selectedHrActivity ? selectedHrActivity.title : undefined}
                    userMaxHr={biometrics.max_heart_rate}
                    activities={events}
                    selectedActivityId={selectedHrActivity?.id}
                    onSelectActivity={(act) => setSelectedHrActivity(act)}
                  />
                </div>
              </>
            )}

            {/* Lista de Registros */}
            <ActivityList
              events={events}
              activeTab={activeTab}
              loading={loading}
              onDeleteEvent={handleDeleteEvent}
              onOpenModal={() => handleOpenNewModal()}
              onEditActivity={(activity) => handleOpenEditModal(activity)}
              onSelectActivityForHr={(activity) => {
                setSelectedHrActivity(activity);
                setZonesModalActivity(activity);
              }}
            />
          </>
        )}
      </main>

      {/* Modal para Crear, Editar y Cargar .FIT */}
      {isModalOpen && (
        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActivityToEdit(null);
          }}
          onSave={handleSaveActivity}
          initialDate={selectedCalendarDate}
          activityToEdit={activityToEdit}
          userId={user.id}
          biometrics={biometrics}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Modal de Configuración de Perfil Biométrico */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentBiometrics={biometrics}
          onSaveBiometrics={handleSaveBiometrics}
        />
      )}

      {/* Modal de Detalle de Zonas Cardíacas para una Sesión Específica */}
      {zonesModalActivity && (
        <ActivityZonesModal
          isOpen={Boolean(zonesModalActivity)}
          activity={zonesModalActivity}
          onClose={() => setZonesModalActivity(null)}
          onEditActivity={(activity) => handleOpenEditModal(activity)}
          userMaxHr={biometrics.max_heart_rate}
        />
      )}
    </div>
  );
}
