export type MatchOutcome = "victory" | "draw" | "defeat" | "pending";

export interface ParsedMatchResult {
  scoreText: string;
  outcome: MatchOutcome;
  label: string; // "Victoria", "Empate", "Derrota", "Programado"
  className: string;
  badgeStyle: {
    color: string;
    background: string;
    border: string;
  };
}

export function parseMatchResult(result?: string): ParsedMatchResult | null {
  if (!result || result.trim() === "" || result === "S/D") return null;

  const trimmed = result.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("programado") || lower.includes("pendiente")) {
    return {
      scoreText: "Programado",
      outcome: "pending",
      label: "Programado",
      className: "event-score-pending",
      badgeStyle: {
        color: "var(--text-dim)",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      },
    };
  }

  // Regex para buscar números tipo 3-1, 3 - 1, 3:1
  const scoreMatch = trimmed.match(/(\d+)\s*[-:]\s*(\d+)/);
  let outcome: MatchOutcome = "draw";

  if (scoreMatch) {
    const myG = parseInt(scoreMatch[1], 10);
    const rivG = parseInt(scoreMatch[2], 10);
    if (myG > rivG) outcome = "victory";
    else if (myG < rivG) outcome = "defeat";
    else outcome = "draw";
  } else if (lower.includes("victoria") || lower.includes("ganado")) {
    outcome = "victory";
  } else if (lower.includes("derrota") || lower.includes("perdido")) {
    outcome = "defeat";
  }

  // Si hay palabra explícita que sobreescriba
  if (lower.includes("victoria")) outcome = "victory";
  else if (lower.includes("derrota")) outcome = "defeat";
  else if (lower.includes("empate")) outcome = "draw";

  const labels: Record<MatchOutcome, string> = {
    victory: "Victoria",
    draw: "Empate",
    defeat: "Derrota",
    pending: "Programado",
  };

  const badgeStyles: Record<MatchOutcome, { color: string; background: string; border: string }> = {
    victory: {
      color: "var(--accent-emerald)",
      background: "rgba(16, 185, 129, 0.15)",
      border: "1px solid rgba(16, 185, 129, 0.35)",
    },
    draw: {
      color: "var(--accent-amber)",
      background: "rgba(245, 158, 11, 0.15)",
      border: "1px solid rgba(245, 158, 11, 0.35)",
    },
    defeat: {
      color: "var(--accent-rose)",
      background: "rgba(244, 63, 94, 0.15)",
      border: "1px solid rgba(244, 63, 94, 0.35)",
    },
    pending: {
      color: "var(--text-dim)",
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
    },
  };

  // Formatear texto limpio
  let scoreText = trimmed;
  if (scoreMatch) {
    scoreText = `${scoreMatch[1]} - ${scoreMatch[2]}`;
  }

  return {
    scoreText,
    outcome,
    label: labels[outcome],
    className: `event-score-${outcome}`,
    badgeStyle: badgeStyles[outcome],
  };
}
