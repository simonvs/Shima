"use client";

import { useState } from "react";
import { X, User, Heart, Scale, Calendar, Zap, Loader2, Check } from "lucide-react";
import type { UserBiometrics, Gender } from "@/types/user";
import { calculateCaloriesKeytel, DEFAULT_BIOMETRICS } from "@/lib/calorieCalculator";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBiometrics: UserBiometrics;
  onSaveBiometrics: (newBio: UserBiometrics) => Promise<boolean>;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentBiometrics,
  onSaveBiometrics,
}: UserProfileModalProps) {
  const [weightKg, setWeightKg] = useState<string>(
    currentBiometrics.weight_kg ? currentBiometrics.weight_kg.toString() : ""
  );
  const [age, setAge] = useState<string>(
    currentBiometrics.age ? currentBiometrics.age.toString() : ""
  );
  const [gender, setGender] = useState<Gender>(currentBiometrics.gender || "male");
  const [maxHeartRate, setMaxHeartRate] = useState<string>(
    currentBiometrics.max_heart_rate ? currentBiometrics.max_heart_rate.toString() : ""
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Cálculo de FC máx teórica por fórmula Fox (220 - edad)
  const parsedAge = parseInt(age, 10);
  const estimatedMaxHr = !isNaN(parsedAge) && parsedAge > 0 ? 220 - parsedAge : 192;

  // Simulación de ejemplo para 60 min a 150 ppm
  const previewWeight = parseFloat(weightKg) || DEFAULT_BIOMETRICS.weight_kg;
  const previewAge = parseInt(age, 10) || DEFAULT_BIOMETRICS.age;
  const sampleCalc = calculateCaloriesKeytel({
    avgHeartRate: 150,
    durationMinutes: 60,
    biometrics: {
      weight_kg: previewWeight,
      age: previewAge,
      gender,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const updated: UserBiometrics = {
      weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      age: age ? parseInt(age, 10) : undefined,
      gender,
      max_heart_rate: maxHeartRate ? parseInt(maxHeartRate, 10) : estimatedMaxHr,
    };

    const ok = await onSaveBiometrics(updated);
    setSaving(false);

    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div
        className="modal-content"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-emerald)",
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Perfil Biométrico</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Parámetros para la predicción calórica y zonas cardíacas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} color="var(--text-dim)" />
          </button>
        </div>

        {/* Explicación científica */}
        <div
          style={{
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            lineHeight: "1.4",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-cyan)", fontWeight: 600, marginBottom: "0.25rem" }}>
            <Zap size={14} /> Modelo Fisiológico Keytel et al. (2005)
          </div>
          Tu peso, edad y sexo determinan la tasa metabólica exacta. Con estos datos, Shima predice con alta precisión las calorías quemadas usando únicamente la frecuencia cardíaca de tus partidos o entrenamientos.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sexo Biológico */}
          <div className="form-group">
            <label className="form-label">Sexo Biológico (para constantes metabólicas)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setGender("male")}
                style={{
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  border: gender === "male" ? "1px solid var(--accent-emerald)" : "1px solid var(--border-color)",
                  background: gender === "male" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: gender === "male" ? "var(--accent-emerald)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                style={{
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  border: gender === "female" ? "1px solid var(--accent-rose)" : "1px solid var(--border-color)",
                  background: gender === "female" ? "rgba(244, 63, 94, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: gender === "female" ? "var(--accent-rose)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Femenino
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Peso */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Scale size={14} /> Peso Corporal (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="35"
                max="200"
                required
                placeholder="Ej: 75.0"
                className="form-input"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>

            {/* Edad */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Calendar size={14} /> Edad (años)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                placeholder="Ej: 26"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          {/* FC Máxima (Opcional / Calculada) */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Heart size={14} color="var(--accent-rose)" /> FC Máxima (ppm)
              </label>
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                Teórica: ~{estimatedMaxHr} ppm (220 - edad)
              </span>
            </div>
            <input
              type="number"
              min="120"
              max="230"
              placeholder={`Por defecto: ${estimatedMaxHr}`}
              className="form-input"
              value={maxHeartRate}
              onChange={(e) => setMaxHeartRate(e.target.value)}
            />
          </div>

          {/* Vista previa en vivo del cálculo */}
          <div
            style={{
              padding: "0.75rem 0.9rem",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Ejemplo: 60 min a 150 ppm
              </p>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                Gasto estimado: <span style={{ color: "var(--accent-emerald)" }}>{sampleCalc.calories} kcal</span>
              </p>
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--accent-emerald)",
                fontWeight: 600,
              }}
            >
              ~{sampleCalc.caloriesPerMinute} kcal/min
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ minWidth: "140px" }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" /> Guardando...
                </>
              ) : savedSuccess ? (
                <>
                  <Check size={16} /> ¡Guardado!
                </>
              ) : (
                "Guardar Perfil"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
