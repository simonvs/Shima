import type { UserBiometrics, Gender } from "@/types/user";

export interface CalorieCalculationInput {
  avgHeartRate: number;
  durationMinutes: number;
  biometrics?: UserBiometrics;
}

export interface CalorieCalculationResult {
  calories: number;
  caloriesPerMinute: number;
  isCustomProfile: boolean;
  biometricsUsed: {
    weightKg: number;
    age: number;
    gender: Gender;
  };
  explanation: string;
}

// Valores por defecto representativos para atletas si aún no completaron su perfil
export const DEFAULT_BIOMETRICS = {
  weight_kg: 75,
  age: 28,
  gender: "male" as Gender,
};

/**
 * Calcula el gasto calórico utilizando la fórmula validada de Keytel et al. (2005)
 * [Journal of Sports Sciences, 23(3): 289-297]
 *
 * Fórmula Hombres:
 * EE (kJ/min) = -55.0969 + (0.6309 * HR) + (0.1988 * Peso) + (0.2017 * Edad)
 * kcal/min = EE / 4.184
 *
 * Fórmula Mujeres:
 * EE (kJ/min) = -20.4022 + (0.4472 * HR) - (0.1263 * Peso) + (0.074 * Edad)
 * kcal/min = EE / 4.184
 */
export function calculateCaloriesKeytel({
  avgHeartRate,
  durationMinutes,
  biometrics,
}: CalorieCalculationInput): CalorieCalculationResult {
  if (!avgHeartRate || avgHeartRate <= 0 || !durationMinutes || durationMinutes <= 0) {
    return {
      calories: 0,
      caloriesPerMinute: 0,
      isCustomProfile: false,
      biometricsUsed: {
        weightKg: DEFAULT_BIOMETRICS.weight_kg,
        age: DEFAULT_BIOMETRICS.age,
        gender: DEFAULT_BIOMETRICS.gender,
      },
      explanation: "Duración o frecuencia cardíaca no válida.",
    };
  }

  const isCustomProfile = Boolean(
    biometrics?.weight_kg && biometrics?.age && biometrics?.gender
  );

  const weight = biometrics?.weight_kg || DEFAULT_BIOMETRICS.weight_kg;
  const age = biometrics?.age || DEFAULT_BIOMETRICS.age;
  const gender = biometrics?.gender || DEFAULT_BIOMETRICS.gender;

  let kjPerMin = 0;

  if (gender === "female") {
    kjPerMin =
      -20.4022 +
      0.4472 * avgHeartRate -
      0.1263 * weight +
      0.074 * age;
  } else {
    kjPerMin =
      -55.0969 +
      0.6309 * avgHeartRate +
      0.1988 * weight +
      0.2017 * age;
  }

  // Conversión de kJ a kcal (1 kcal = 4.184 kJ)
  let kcalPerMin = kjPerMin / 4.184;

  // Límite de seguridad fisiológica: nunca menor al gasto basal de movimiento (~2 kcal/min)
  if (kcalPerMin < 2) {
    kcalPerMin = Math.max(1.5, (avgHeartRate / 180) * 5);
  }

  const totalCalories = Math.round(kcalPerMin * durationMinutes);

  const genderLabel = gender === "male" ? "Hombre" : "Mujer";
  const explanation = isCustomProfile
    ? `Calculado según Keytel et al. con tu perfil: ${genderLabel}, ${weight} kg, ${age} años.`
    : `Estimación con perfil estándar (${genderLabel}, ${weight} kg, ${age} años). Personaliza tu perfil para mayor exactitud.`;

  return {
    calories: totalCalories,
    caloriesPerMinute: parseFloat(kcalPerMin.toFixed(2)),
    isCustomProfile,
    biometricsUsed: {
      weightKg: weight,
      age,
      gender,
    },
    explanation,
  };
}
