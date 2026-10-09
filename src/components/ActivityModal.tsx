"use client";

import { useState, useRef, useMemo } from "react";
import { X, UploadCloud, Loader2, FileCheck2, Zap, Settings } from "lucide-react";
import { parseFitFile } from "@/lib/fitParser";
import { calculateCaloriesKeytel } from "@/lib/calorieCalculator";
import type { ActivityItem } from "@/types/activity";
import type { UserBiometrics } from "@/types/user";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: Omit<ActivityItem, "id">) => Promise<boolean>;
  initialDate?: string;
  userId: string;
  biometrics?: UserBiometrics;
  onOpenProfile?: () => void;
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  initialDate = "",
  userId,
  biometrics,
  onOpenProfile,
}: ActivityModalProps) {
  const [eventType, setEventType] = useState<"match" | "training">("match");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    if (initialDate) return initialDate;
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  });
  const [time, setTime] = useState("18:00");
  
  // Marcador interactivo error-proof (deducido estrictamente según los goles)
  const [myGoals, setMyGoals] = useState("0");
  const [rivalGoals, setRivalGoals] = useState("0");
  const [matchStatus, setMatchStatus] = useState<"played" | "pending">("played");
  const [personalGoals, setPersonalGoals] = useState("0");
  const [personalAssists, setPersonalAssists] = useState("0");
  const [trainingIntensity, setTrainingIntensity] = useState("Media");

  // Métricas avanzadas / .FIT
  const [durationMinutes, setDurationMinutes] = useState("");
  const [calories, setCalories] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [fitHrSeries, setFitHrSeries] = useState<number[] | undefined>(undefined);

  const [parsingFit, setParsingFit] = useState(false);
  const [fitFileName, setFitFileName] = useState<string | null>(null);
  const [fitAutofilled, setFitAutofilled] = useState<{
    date?: string;
    time?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cálculo reactivo del resultado del partido (deducido exclusivamente según los goles ingresados)
  const currentOutcome = useMemo(() => {
    if (matchStatus === "pending") return "pending";
    const my = parseInt(myGoals, 10);
    const riv = parseInt(rivalGoals, 10);
    if (isNaN(my) || isNaN(riv)) return "draw";
    if (my > riv) return "victory";
    if (my < riv) return "defeat";
    return "draw";
  }, [matchStatus, myGoals, rivalGoals]);

  // Predicción reactiva de gasto calórico por FC (Keytel et al.)
  const livePrediction = useMemo(() => {
    const dur = parseInt(durationMinutes, 10);
    const hr = parseInt(avgHeartRate, 10);
    if (!dur || dur <= 0 || !hr || hr <= 0) return null;
    return calculateCaloriesKeytel({
      avgHeartRate: hr,
      durationMinutes: dur,
      biometrics,
    });
  }, [durationMinutes, avgHeartRate, biometrics]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    setDate(initialDate || todayStr);
    setTime("18:00");
    setMyGoals("0");
    setRivalGoals("0");
    setMatchStatus("played");
    setPersonalGoals("0");
    setPersonalAssists("0");
    setTrainingIntensity("Media");
    setDurationMinutes("");
    setCalories("");
    setAvgHeartRate("");
    setMaxHeartRate("");
    setDistanceKm("");
    setFitHrSeries(undefined);
    setFitFileName(null);
    setFitAutofilled(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsingFit(true);
      setFitFileName(file.name);
      const summary = await parseFitFile(file, biometrics);

      // Autocompletar fecha y hora extraídas del archivo .FIT
      if (summary.date) {
        setDate(summary.date);
      }
      if (summary.time) {
        setTime(summary.time);
      }

      // Marcar qué campos se autocompletaron desde el archivo
      setFitAutofilled({
        date: summary.date,
        time: summary.time,
      });

      if (summary.durationMinutes) setDurationMinutes(summary.durationMinutes.toString());
      if (summary.calories) setCalories(summary.calories.toString());
      if (summary.avgHeartRate) setAvgHeartRate(summary.avgHeartRate.toString());
      if (summary.maxHeartRate) setMaxHeartRate(summary.maxHeartRate.toString());
      if (summary.distanceKm !== undefined) setDistanceKm(summary.distanceKm.toString());
      if (summary.hrSeries && summary.hrSeries.length > 0) setFitHrSeries(summary.hrSeries);

      if (summary.sport) {
        const s = summary.sport.toLowerCase();
        if (s.includes("soccer") || s.includes("football")) {
          setEventType("match");
        } else if (s.includes("training") || s.includes("running") || s.includes("fitness")) {
          setEventType("training");
        }
      }

      if (!title) {
        const cleanName = file.name.replace(/\.fit$/i, "");
        setTitle(`Sesión deportiva (${cleanName})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert("Error leyendo archivo .FIT: " + msg);
      setFitFileName(null);
      setFitAutofilled(null);
    } finally {
      setParsingFit(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !userId) return;

    setSaving(true);

    let matchResult: string | undefined = undefined;
    if (eventType === "match") {
      if (matchStatus === "pending") {
        matchResult = "Programado";
      } else {
        const labels: Record<string, string> = {
          victory: "Victoria",
          draw: "Empate",
          defeat: "Derrota",
        };
        const label = labels[currentOutcome] || "Empate";
        matchResult = `${parseInt(myGoals, 10) || 0} - ${parseInt(rivalGoals, 10) || 0} (${label})`;
      }
    }

    const newEntry: Omit<ActivityItem, "id"> = {
      user_id: userId,
      type: eventType,
      title,
      date,
      time: time || "18:00",
      result: eventType === "match" ? matchResult : undefined,
      goals: eventType === "match" ? (parseInt(personalGoals, 10) || 0) : 0,
      assists: eventType === "match" ? (parseInt(personalAssists, 10) || 0) : 0,
      intensity: eventType === "training" ? trainingIntensity : undefined,
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      calories: calories ? parseInt(calories, 10) : undefined,
      avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
      max_heart_rate: maxHeartRate ? parseInt(maxHeartRate, 10) : undefined,
      distance_km: distanceKm ? parseFloat(distanceKm) : undefined,
      hr_series: fitHrSeries,
    };

    const success = await onSave(newEntry);
    setSaving(false);

    if (success) {
      resetForm();
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && handleClose()}>
      <div
        className="modal-content"
        style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Registrar Actividad Deportiva</h3>
          <button onClick={handleClose} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} color="var(--text-dim)" />
          </button>
        </div>

        {/* Input oculto para archivo .FIT */}
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
                {fitAutofilled?.date && fitAutofilled?.time
                  ? `📅 Fecha (${fitAutofilled.date}) y ⏰ Hora (${fitAutofilled.time}) autocompletadas del .FIT`
                  : fitAutofilled?.date
                  ? `📅 Fecha (${fitAutofilled.date}) y métricas autocompletadas del .FIT`
                  : "Métricas de FC, duración y calorías autocompletadas del .FIT"}
              </p>
            </>
          ) : (
            <>
              <UploadCloud size={24} color="var(--accent-emerald)" />
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                Adjuntar archivo .FIT (Garmin, Polar, Suunto)
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Fecha, hora y biometría se completarán automáticamente
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Fecha</label>
                {fitAutofilled?.date && (
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    ✓ Del archivo .FIT
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFitAutofilled((prev) => (prev ? { ...prev, date: undefined } : null));
                }}
              />
            </div>
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Hora</label>
                {fitAutofilled?.time && (
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    ✓ Del archivo .FIT
                  </span>
                )}
              </div>
              <input
                type="time"
                className="form-input"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setFitAutofilled((prev) => (prev ? { ...prev, time: undefined } : null));
                }}
              />
            </div>
          </div>

          {eventType === "match" ? (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              {/* Encabezado del marcador y estado de resultado */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Marcador del Partido
                </span>

                {/* Badge con color según el resultado */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {matchStatus === "played" ? (
                    <span
                      className={`event-score event-score-${currentOutcome}`}
                      style={{ fontSize: "0.75rem", padding: "2px 8px", fontWeight: 700 }}
                    >
                      {currentOutcome === "victory" && "🟢 Victoria"}
                      {currentOutcome === "draw" && "🟡 Empate"}
                      {currentOutcome === "defeat" && "🔴 Derrota"}
                    </span>
                  ) : (
                    <span
                      className="event-score event-score-pending"
                      style={{ fontSize: "0.75rem", padding: "2px 8px", fontWeight: 700 }}
                    >
                      ⚪ Programado
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setMatchStatus(matchStatus === "played" ? "pending" : "played")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {matchStatus === "played" ? "Marcar por jugar" : "Ya jugado"}
                  </button>
                </div>
              </div>

              {matchStatus === "played" && (
                <>
                  {/* Cajas de Goles: Mi Equipo VS Rival */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    {/* Mi Equipo */}
                    <div
                      style={{
                        background:
                          currentOutcome === "victory"
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${
                          currentOutcome === "victory"
                            ? "rgba(16, 185, 129, 0.3)"
                            : "var(--border-color)"
                        }`,
                        borderRadius: "var(--radius-sm)",
                        padding: "0.6rem 0.75rem",
                        textAlign: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "var(--text-dim)",
                          marginBottom: "0.3rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Mi Equipo
                      </label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMyGoals(String(Math.max(0, (parseInt(myGoals, 10) || 0) - 1)));
                          }}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={myGoals}
                          onChange={(e) => {
                            setMyGoals(e.target.value);
                          }}
                          style={{
                            width: "50px",
                            textAlign: "center",
                            fontSize: "1.3rem",
                            fontWeight: 800,
                            background: "transparent",
                            border: "none",
                            color: "var(--text-main)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMyGoals(String((parseInt(myGoals, 10) || 0) + 1));
                          }}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        padding: "0 0.2rem",
                      }}
                    >
                      VS
                    </span>

                    {/* Rival */}
                    <div
                      style={{
                        background:
                          currentOutcome === "defeat"
                            ? "rgba(244, 63, 94, 0.08)"
                            : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${
                          currentOutcome === "defeat"
                            ? "rgba(244, 63, 94, 0.3)"
                            : "var(--border-color)"
                        }`,
                        borderRadius: "var(--radius-sm)",
                        padding: "0.6rem 0.75rem",
                        textAlign: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "var(--text-dim)",
                          marginBottom: "0.3rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Rival
                      </label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setRivalGoals(String(Math.max(0, (parseInt(rivalGoals, 10) || 0) - 1)));
                          }}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={rivalGoals}
                          onChange={(e) => {
                            setRivalGoals(e.target.value);
                          }}
                          style={{
                            width: "50px",
                            textAlign: "center",
                            fontSize: "1.3rem",
                            fontWeight: 800,
                            background: "transparent",
                            border: "none",
                            color: "var(--text-main)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRivalGoals(String((parseInt(rivalGoals, 10) || 0) + 1));
                          }}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Indicador automático de resultado deducido según los goles */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.55rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      background:
                        currentOutcome === "victory"
                          ? "rgba(16, 185, 129, 0.08)"
                          : currentOutcome === "defeat"
                          ? "rgba(244, 63, 94, 0.08)"
                          : "rgba(245, 158, 11, 0.08)",
                      border: `1px solid ${
                        currentOutcome === "victory"
                          ? "rgba(16, 185, 129, 0.3)"
                          : currentOutcome === "defeat"
                          ? "rgba(244, 63, 94, 0.3)"
                          : "rgba(245, 158, 11, 0.3)"
                      }`,
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      Resultado deducido:
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          currentOutcome === "victory"
                            ? "var(--accent-emerald)"
                            : currentOutcome === "defeat"
                            ? "var(--accent-rose)"
                            : "var(--accent-amber)",
                      }}
                    >
                      {currentOutcome === "victory" && "Victoria (Ganó tu equipo)"}
                      {currentOutcome === "draw" && "Empate (Mismos goles)"}
                      {currentOutcome === "defeat" && "Derrota (Ganó el rival)"}
                    </span>
                  </div>
                </>
              )}

              {/* Rendimiento Individual: Goles y Asistencias */}
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "0.75rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.6rem",
                }}
              >
                {/* Goles Personales */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.6rem 0.65rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      marginBottom: "0.15rem",
                    }}
                  >
                    ⚽ Tus Goles
                  </label>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-dim)", margin: "0 0 0.45rem 0" }}>
                    Anotados por ti
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <button
                      type="button"
                      onClick={() => setPersonalGoals(String(Math.max(0, (parseInt(personalGoals, 10) || 0) - 1)))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: "46px", textAlign: "center", padding: "0.2rem", fontSize: "1.05rem", fontWeight: 700 }}
                      value={personalGoals}
                      onChange={(e) => setPersonalGoals(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setPersonalGoals(String((parseInt(personalGoals, 10) || 0) + 1))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Asistencias Personales */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.6rem 0.65rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      marginBottom: "0.15rem",
                    }}
                  >
                    👟 Asistencias
                  </label>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-dim)", margin: "0 0 0.45rem 0" }}>
                    Pases de gol entregados
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <button
                      type="button"
                      onClick={() => setPersonalAssists(String(Math.max(0, (parseInt(personalAssists, 10) || 0) - 1)))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: "46px", textAlign: "center", padding: "0.2rem", fontSize: "1.05rem", fontWeight: 700 }}
                      value={personalAssists}
                      onChange={(e) => setPersonalAssists(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setPersonalAssists(String((parseInt(personalAssists, 10) || 0) + 1))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Intensidad</label>
              <select
                className="form-select"
                value={trainingIntensity}
                onChange={(e) => setTrainingIntensity(e.target.value)}
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja / Recuperación">Baja / Recuperación</option>
              </select>
            </div>
          )}

          {/* Sección Biometría y Rendimiento Físico */}
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)", margin: 0 }}>
                Datos Físicos y Biometría (Manuales o de .FIT)
              </p>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  style={{
                    background: "none",
                    border: "none",
                    color: biometrics?.weight_kg ? "var(--text-muted)" : "var(--accent-amber)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  title="Configurar peso, edad y sexo"
                >
                  <Settings size={12} />
                  {biometrics?.weight_kg && biometrics?.age
                    ? `${biometrics.weight_kg}kg · ${biometrics.age}a (${biometrics.gender === "female" ? "F" : "M"})`
                    : "Configurar perfil para predicción"}
                </button>
              )}
            </div>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label className="form-label" style={{ margin: 0 }}>Calorías (kcal)</label>
                  {livePrediction && (
                    <button
                      type="button"
                      onClick={() => setCalories(livePrediction.calories.toString())}
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "var(--accent-emerald)",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 7px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                      title="Haz clic para autocompletar con la predicción de FC"
                    >
                      <Zap size={11} /> Usar {livePrediction.calories} kcal
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  placeholder={livePrediction ? `Predicción: ${livePrediction.calories}` : "Ej: 750"}
                  className="form-input"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>

            {/* Banner de Predicción si FC y Duración están presentes */}
            {livePrediction && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.6rem 0.8rem",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                    ⚡ Predicción Fisiológica: {livePrediction.calories} kcal
                  </span>
                  <p style={{ margin: "2px 0 0 0", color: "var(--text-dim)", fontSize: "0.7rem" }}>
                    {livePrediction.explanation}
                  </p>
                </div>
                {calories !== livePrediction.calories.toString() && (
                  <button
                    type="button"
                    onClick={() => setCalories(livePrediction.calories.toString())}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "var(--accent-emerald)",
                      color: "#051c14",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rellenar
                  </button>
                )}
              </div>
            )}

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
              onClick={handleClose}
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
  );
}
