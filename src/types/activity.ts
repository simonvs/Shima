export interface ActivityItem {
  id: number;
  user_id?: string;
  type: "match" | "training";
  title: string;
  date: string;
  time: string;
  result?: string;
  goals?: number;
  assists?: number;
  intensity?: string;
  duration_minutes?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  distance_km?: number;
  hr_series?: number[];
  time_in_hr_zone?: number[];
}

export type TabType = "dashboard" | "matches" | "trainings" | "calendar";
