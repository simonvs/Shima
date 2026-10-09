"use client";

import { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

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
        } else if (data.session?.user) {
          onAuthSuccess(data.session.user);
        } else if (data.user) {
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
          onAuthSuccess(data.user);
        }
      }
    } catch {
      setAuthError("Ocurrió un error inesperado al procesar la autenticación.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-icon">⚽</div>
          <h1 className="auth-title">SHIMA Football Analytics</h1>
          <p className="auth-subtitle">
            {isSignUp
              ? "Crea tu cuenta de entrenador o jugador"
              : "Ingresa para gestionar tus partidos y entrenamientos"}
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
              ¿Ya tienes una cuenta?{" "}
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
              ¿Aún no tienes cuenta?{" "}
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
