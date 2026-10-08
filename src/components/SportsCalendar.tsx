"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Dumbbell,
  Clock,
  Heart,
  Flame,
  Activity as ActivityIcon,
  X
} from "lucide-react";

export interface CalendarEvent {
  id: number;
  type: "match" | "training";
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  result?: string;
  goals?: number;
  intensity?: string;
  duration_minutes?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  distance_km?: number;
}

interface SportsCalendarProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onNewEventOnDate?: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function SportsCalendar({ events, onNewEventOnDate }: SportsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; items: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Construir matriz de días para el mes
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // En JavaScript: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado.
  // Queremos que la semana comience en Lunes (índice 0):
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; 
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Días del mes anterior para rellenar la primera semana
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells = [];

  // Días previos
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = prevDate.toISOString().split("T")[0];
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Días del mes actual
  const todayStr = new Date().toISOString().split("T")[0];
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const thisDate = new Date(year, month, i);
    // Formatear local YYYY-MM-DD
    const yStr = thisDate.getFullYear();
    const mStr = String(thisDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    calendarCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Rellenar hasta completar semanas completas (múltiplo de 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = nextDate.toISOString().split("T")[0];
    calendarCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Filtrar eventos por día
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  // Contadores del mes actual
  const currentMonthEvents = events.filter((e) => {
    if (!e.date) return false;
    const [eYear, eMonth] = e.date.split("-").map(Number);
    return eYear === year && eMonth === month + 1;
  });
  const matchesInMonth = currentMonthEvents.filter((e) => e.type === "match").length;
  const trainingsInMonth = currentMonthEvents.filter((e) => e.type === "training").length;

  return (
    <div className="calendar-wrapper">
      {/* Barra Superior del Calendario */}
      <div className="calendar-top-bar">
        <div>
          <h2 className="cal-month-title">
            {MONTH_NAMES[month]} {year}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "2px" }}>
            {matchesInMonth} {matchesInMonth === 1 ? "partido" : "partidos"} • {trainingsInMonth}{" "}
            {trainingsInMonth === 1 ? "entrenamiento" : "entrenamientos"} agendados
          </p>
        </div>

        <div className="calendar-nav-buttons">
          <button className="cal-nav-btn" onClick={handleToday}>
            Hoy
          </button>
          <button className="cal-nav-btn" onClick={handlePrevMonth} title="Mes Anterior">
            <ChevronLeft size={16} />
          </button>
          <button className="cal-nav-btn" onClick={handleNextMonth} title="Mes Siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Calendario */}
      <div className="calendar-grid-container">
        {/* Cabecera Días de la Semana */}
        <div className="calendar-weekdays-header">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="weekday-col">
              {day}
            </div>
          ))}
        </div>

        {/* Celdas de los días */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell, idx) => {
            const dayEvents = getEventsForDate(cell.dateStr);

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!cell.isCurrentMonth ? "other-month" : ""} ${
                  cell.isToday ? "is-today" : ""
                }`}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents({ dateStr: cell.dateStr, items: dayEvents });
                  } else if (cell.isCurrentMonth && onNewEventOnDate) {
                    onNewEventOnDate(cell.dateStr);
                  }
                }}
              >
                <div className="day-header">
                  <span className="day-number">{cell.dayNum}</span>
                  {dayEvents.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-dim)",
                        fontWeight: 600,
                      }}
                    >
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="cell-events-list">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`cal-pill-event ${
                        ev.type === "match" ? "cal-pill-match" : "cal-pill-training"
                      }`}
                      title={`${ev.title} (${ev.time || "18:00"})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayEvents({ dateStr: cell.dateStr, items: dayEvents });
                      }}
                    >
                      {ev.type === "match" ? (
                        <Trophy size={11} style={{ flexShrink: 0 }} />
                      ) : (
                        <Dumbbell size={11} style={{ flexShrink: 0 }} />
                      )}
                      <span>{ev.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal con Detalle de Actividades del Día Seleccionado */}
      {selectedDayEvents && (
        <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Actividades del Día
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--accent-emerald)" }}>
                  {selectedDayEvents.dateStr}
                </p>
              </div>
              <button onClick={() => setSelectedDayEvents(null)}>
                <X size={20} color="var(--text-dim)" />
              </button>
            </div>

            <div className="day-modal-events">
              {selectedDayEvents.items.map((ev) => (
                <div
                  key={ev.id}
                  className="event-item"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: "0.6rem" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`event-badge ${ev.type === "match" ? "badge-match" : "badge-training"}`}>
                        {ev.type === "match" ? "Partido" : "Entrenamiento"}
                      </span>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>{ev.title}</h4>
                    </div>
                    {ev.type === "match" && ev.result && (
                      <span className="event-score">{ev.result}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    <span>Hora: {ev.time || "18:00"}</span>
                    {ev.intensity && <span>Intensidad: {ev.intensity}</span>}
                    {ev.goals !== undefined && ev.goals > 0 && (
                      <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                        ⚽ {ev.goals} {ev.goals === 1 ? "gol" : "goles"}
                      </span>
                    )}
                  </div>

                  {/* Telemetría y métricas del .FIT */}
                  {(ev.duration_minutes || ev.avg_heart_rate || ev.calories || ev.distance_km) && (
                    <div className="biometric-badges" style={{ marginTop: "0.2rem" }}>
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
                          <ActivityIcon size={12} color="var(--accent-emerald)" /> {ev.distance_km} km
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button className="btn-secondary" onClick={() => setSelectedDayEvents(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
