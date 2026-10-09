import { Activity, Trophy, Dumbbell, Calendar as CalendarIcon, LogOut, UserCog } from "lucide-react";
import type { TabType } from "@/types/activity";
import type { UserBiometrics } from "@/types/user";
import type { User } from "@supabase/supabase-js";

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  matchesCount: number;
  trainingsCount: number;
  user: User;
  biometrics?: UserBiometrics;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  matchesCount,
  trainingsCount,
  user,
  biometrics,
  onOpenProfile,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">⚽</div>
        <span className="brand-name">SHIMA FC</span>
      </div>

      <ul className="nav-list">
        <li
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => onSelectTab("dashboard")}
        >
          <Activity size={18} /> Resumen General
        </li>
        <li
          className={`nav-item ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => onSelectTab("matches")}
        >
          <Trophy size={18} /> Mis Partidos ({matchesCount})
        </li>
        <li
          className={`nav-item ${activeTab === "trainings" ? "active" : ""}`}
          onClick={() => onSelectTab("trainings")}
        >
          <Dumbbell size={18} /> Mis Entrenamientos ({trainingsCount})
        </li>
        <li
          className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => onSelectTab("calendar")}
        >
          <CalendarIcon size={18} /> Calendario
        </li>
      </ul>

      {/* Perfil del usuario */}
      <div className="user-profile-badge">
        <div
          className="user-info"
          style={{ overflow: "hidden", cursor: "pointer" }}
          onClick={onOpenProfile}
          title="Configurar Perfil Biométrico"
        >
          <div className="user-avatar">
            {user.email ? user.email.slice(0, 2).toUpperCase() : "DT"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </p>
            <p
              style={{
                fontSize: "0.72rem",
                color: biometrics?.weight_kg ? "var(--accent-emerald)" : "var(--accent-amber)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {biometrics?.weight_kg && biometrics?.age
                ? `● ${biometrics.weight_kg}kg · ${biometrics.age}a`
                : "● Configurar perfil"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <button
            onClick={onOpenProfile}
            className="btn-logout"
            title="Configurar Perfil Biométrico"
            style={{ color: "var(--accent-cyan)" }}
          >
            <UserCog size={16} />
          </button>
          <button
            onClick={onSignOut}
            className="btn-logout"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
