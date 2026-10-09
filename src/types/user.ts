export type Gender = "male" | "female";

export interface UserBiometrics {
  weight_kg?: number;
  age?: number;
  gender?: Gender;
  max_heart_rate?: number;
}
