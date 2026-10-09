/* eslint-disable @typescript-eslint/no-explicit-any */
import FitParser from "fit-file-parser";
import { calculateCaloriesKeytel } from "@/lib/calorieCalculator";
import type { UserBiometrics } from "@/types/user";

export interface ParsedFitSummary {
  durationMinutes?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  sport?: string;
  hrSeries?: number[];
}

function toArray(val: any): any[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function toValidDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "number" && !isNaN(val)) {
    // Si ya viene en milisegundos Unix (ej. > 100,000,000,000)
    if (val > 1e11) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    // Si viene en segundos FIT (Epoch de Garmin: 31 de diciembre de 1989 00:00:00 UTC)
    // 631065600000 ms = offset entre epoch Unix (1970) y epoch Garmin (1990)
    const fitDate = new Date(val * 1000 + 631065600000);
    const fitYear = fitDate.getFullYear();
    if (fitYear >= 2000 && fitYear <= 2040) {
      return fitDate;
    }
    // Si viene en segundos Unix convencionales
    const unixDate = new Date(val * 1000);
    const unixYear = unixDate.getFullYear();
    if (unixYear >= 2000 && unixYear <= 2040) {
      return unixDate;
    }
  }
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      if (y >= 2000 && y <= 2040) return d;
    }
    const num = Number(val);
    if (!isNaN(num)) return toValidDate(num);
  }
  return null;
}

function formatDate(d: Date): { date: string; time: string } {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export function parseFitFile(
  file: File,
  userBiometrics?: UserBiometrics
): Promise<ParsedFitSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const buffer = reader.result as ArrayBuffer;
      const fitParser = new FitParser({
        force: true,
        speedUnit: "km/h",
        lengthUnit: "km",
        temperatureUnit: "celsius",
        elapsedRecordField: true,
        mode: "list",
      });

      fitParser.parse(buffer, (error: Error | string | null, rawData: Record<string, unknown>) => {
        if (error) {
          const errMsg = typeof error === "string" ? error : error.message;
          reject(new Error("No se pudo procesar el archivo .FIT: " + errMsg));
          return;
        }

        const data = rawData as Record<string, any>;
        console.log("=== DATOS EXTRAÍDOS DEL ARCHIVO .FIT ===", data);

        const summary: ParsedFitSummary = {};

        const sessions = toArray(data.sessions || data.session);
        const laps = toArray(data.laps || data.lap);
        const activities = toArray(data.activity || data.activities);
        const records = toArray(data.records);

        // 1. Extraer Fecha y Hora de inicio (búsqueda exhaustiva con fallbacks)
        let sessionStartTime: Date | null = null;

        // A. Desde sessions (start_time o start_date)
        for (const s of sessions) {
          const d = toValidDate(s.start_time ?? s.start_date);
          if (d) {
            sessionStartTime = d;
            break;
          }
        }

        // B. Desde laps (start_time de la primera vuelta)
        if (!sessionStartTime) {
          for (const l of laps) {
            const d = toValidDate(l.start_time);
            if (d) {
              sessionStartTime = d;
              break;
            }
          }
        }

        // C. Desde records (el primer trackpoint con timestamp válido)
        if (!sessionStartTime && records.length > 0) {
          for (const r of records) {
            const d = toValidDate(r.timestamp);
            if (d) {
              sessionStartTime = d;
              break;
            }
          }
        }

        // D. Desde eventos de inicio de cronómetro (event: timer, event_type: start)
        if (!sessionStartTime) {
          const events = toArray(data.events || data.event);
          const startEvent = events.find(
            (e: any) => e.event === "timer" && (e.event_type === "start" || e.event_type === 0)
          );
          if (startEvent) {
            sessionStartTime = toValidDate(startEvent.timestamp);
          }
          if (!sessionStartTime) {
            for (const e of events) {
              const d = toValidDate(e.timestamp);
              if (d) {
                sessionStartTime = d;
                break;
              }
            }
          }
        }

        // E. Si sessions tiene timestamp (hora fin), restar la duración para obtener la hora de inicio
        if (!sessionStartTime) {
          for (const s of sessions) {
            const endD = toValidDate(s.timestamp);
            if (endD) {
              const durSec =
                s.total_elapsed_time ??
                s.total_timer_time ??
                s.moving_time ??
                s.elapsed_time ??
                0;
              if (typeof durSec === "number" && durSec > 0) {
                sessionStartTime = new Date(endD.getTime() - durSec * 1000);
              } else {
                sessionStartTime = endD;
              }
              break;
            }
          }
        }

        // F. Si laps tiene timestamp (hora fin de vuelta)
        if (!sessionStartTime) {
          for (const l of laps) {
            const endD = toValidDate(l.timestamp);
            if (endD) {
              const durSec = l.total_elapsed_time ?? l.total_timer_time ?? 0;
              if (typeof durSec === "number" && durSec > 0) {
                sessionStartTime = new Date(endD.getTime() - durSec * 1000);
              } else {
                sessionStartTime = endD;
              }
              break;
            }
          }
        }

        // G. Desde activities (timestamp o local_timestamp)
        if (!sessionStartTime) {
          for (const a of activities) {
            const d = toValidDate(a.timestamp ?? a.local_timestamp);
            if (d) {
              sessionStartTime = d;
              break;
            }
          }
        }

        // H. Desde file_id (time_created: estándar obligatorio presente en todos los archivos FIT)
        if (!sessionStartTime) {
          const fileIds = toArray(data.file_ids || data.file_id);
          for (const f of fileIds) {
            const d = toValidDate(f.time_created ?? f.timestamp);
            if (d) {
              sessionStartTime = d;
              break;
            }
          }
        }

        // I. Desde device_infos
        if (!sessionStartTime) {
          const devInfos = toArray(data.device_infos || data.device_info);
          for (const dev of devInfos) {
            const d = toValidDate(dev.timestamp);
            if (d) {
              sessionStartTime = d;
              break;
            }
          }
        }

        if (sessionStartTime && !isNaN(sessionStartTime.getTime())) {
          const formatted = formatDate(sessionStartTime);
          summary.date = formatted.date;
          summary.time = formatted.time;
        }

        // Extraer deporte si está disponible
        for (const s of sessions) {
          if (s.sport) {
            summary.sport = String(s.sport);
            break;
          }
        }

        // 2. Extraer Duración
        // A. Desde sessions (Garmin / Strava / Wahoo)
        for (const s of sessions) {
          const totalSecs =
            s.total_timer_time ??
            s.total_elapsed_time ??
            s.total_moving_time ??
            s.moving_time ??
            s.elapsed_time ??
            s.timer_time ??
            s.duration;

          if (typeof totalSecs === "number" && totalSecs > 0) {
            summary.durationMinutes = Math.round(totalSecs / 60);
            break;
          }
        }

        // B. Desde laps si sessions no tenía duración
        if (!summary.durationMinutes && laps.length > 0) {
          let sumLapSecs = 0;
          for (const l of laps) {
            const secs =
              l.total_timer_time ??
              l.total_elapsed_time ??
              l.total_moving_time ??
              l.timer_time;
            if (typeof secs === "number" && secs > 0) {
              sumLapSecs += secs;
            }
          }
          if (sumLapSecs > 0) {
            summary.durationMinutes = Math.round(sumLapSecs / 60);
          }
        }

        // C. Desde activities
        if (!summary.durationMinutes && activities.length > 0) {
          for (const a of activities) {
            const secs = a.total_timer_time ?? a.total_elapsed_time;
            if (typeof secs === "number" && secs > 0) {
              summary.durationMinutes = Math.round(secs / 60);
              break;
            }
          }
        }

        // 3. Extraer Calorías
        // A. Desde sessions
        for (const s of sessions) {
          const cal =
            s.total_calories ??
            s.calories ??
            s.total_kcal ??
            s.kcal ??
            s.total_energy;
          if (typeof cal === "number" && cal > 0) {
            summary.calories = Math.round(cal);
            break;
          }
        }

        // B. Desde laps
        if (!summary.calories && laps.length > 0) {
          let sumLapCals = 0;
          for (const l of laps) {
            const cal = l.total_calories ?? l.calories;
            if (typeof cal === "number" && cal > 0) {
              sumLapCals += cal;
            }
          }
          if (sumLapCals > 0) {
            summary.calories = Math.round(sumLapCals);
          }
        }

        // 4. Extraer Frecuencia Cardíaca
        for (const s of sessions) {
          const avgHr = s.avg_heart_rate ?? s.avg_hr;
          if (typeof avgHr === "number" && avgHr > 0 && !summary.avgHeartRate) {
            summary.avgHeartRate = Math.round(avgHr);
          }
          const maxHr = s.max_heart_rate ?? s.max_hr;
          if (typeof maxHr === "number" && maxHr > 0 && !summary.maxHeartRate) {
            summary.maxHeartRate = Math.round(maxHr);
          }
        }

        for (const l of laps) {
          const avgHr = l.avg_heart_rate ?? l.avg_hr;
          if (typeof avgHr === "number" && avgHr > 0 && !summary.avgHeartRate) {
            summary.avgHeartRate = Math.round(avgHr);
          }
          const maxHr = l.max_heart_rate ?? l.max_hr;
          if (typeof maxHr === "number" && maxHr > 0 && !summary.maxHeartRate) {
            summary.maxHeartRate = Math.round(maxHr);
          }
        }

        // 5. Extraer Distancia
        for (const s of sessions) {
          const dist = s.total_distance ?? s.distance;
          if (typeof dist === "number" && dist >= 0) {
            summary.distanceKm =
              dist > 50 ? parseFloat((dist / 1000).toFixed(2)) : parseFloat(dist.toFixed(2));
            break;
          }
        }

        // 6. Procesar Records (trackpoints) para fallbacks completos y seguros
        if (records.length > 0) {
          let minTimestampMs: number | null = null;
          let maxTimestampMs: number | null = null;
          let maxTimerSecs = 0;
          let hrSum = 0;
          let hrCount = 0;
          let recordMaxHr = 0;
          let recordMaxDist = 0;
          let recordMaxCal = 0;
          const rawHrPoints: number[] = [];

          for (let i = 0; i < records.length; i++) {
            const r = records[i];

            // Timestamps
            if (r.timestamp) {
              const t = r.timestamp instanceof Date ? r.timestamp.getTime() : new Date(r.timestamp).getTime();
              if (!isNaN(t) && t > 0) {
                if (minTimestampMs === null || t < minTimestampMs) minTimestampMs = t;
                if (maxTimestampMs === null || t > maxTimestampMs) maxTimestampMs = t;
              }
            }

            // Timer / Elapsed time
            const tSec = r.timer_time ?? r.elapsed_time;
            if (typeof tSec === "number" && tSec > maxTimerSecs) {
              maxTimerSecs = tSec;
            }

            // Frecuencia Cardíaca
            const hr = r.heart_rate ?? r.heartRate ?? r.hr;
            if (typeof hr === "number" && hr > 0) {
              hrSum += hr;
              hrCount++;
              if (hr > recordMaxHr) recordMaxHr = hr;
              if (hr >= 40 && hr <= 240) {
                rawHrPoints.push(Math.round(hr));
              }
            }

            // Distancia acumulada
            const dist = r.distance;
            if (typeof dist === "number" && dist > recordMaxDist) {
              recordMaxDist = dist;
            }

            // Calorías acumuladas
            const cal = r.calories ?? r.total_calories;
            if (typeof cal === "number" && cal > recordMaxCal) {
              recordMaxCal = cal;
            }
          }

          // Fallback FC
          if (!summary.avgHeartRate && hrCount > 0) {
            summary.avgHeartRate = Math.round(hrSum / hrCount);
          }
          if (!summary.maxHeartRate && recordMaxHr > 0) {
            summary.maxHeartRate = recordMaxHr;
          }

          // Muestrear serie temporal de FC continua para telemetría
          if (rawHrPoints.length >= 10) {
            const targetPoints = Math.min(rawHrPoints.length, 120);
            const step = rawHrPoints.length / targetPoints;
            const sampled: number[] = [];
            for (let i = 0; i < targetPoints; i++) {
              const idx = Math.min(Math.floor(i * step), rawHrPoints.length - 1);
              sampled.push(rawHrPoints[idx]);
            }
            summary.hrSeries = sampled;
          }

          // Fallback Duración
          if (!summary.durationMinutes) {
            if (minTimestampMs !== null && maxTimestampMs !== null && maxTimestampMs > minTimestampMs) {
              const diffSec = Math.round((maxTimestampMs - minTimestampMs) / 1000);
              if (diffSec > 0) {
                summary.durationMinutes = Math.round(diffSec / 60);
              }
            } else if (maxTimerSecs > 0) {
              summary.durationMinutes = Math.round(maxTimerSecs / 60);
            } else if (records.length >= 30) {
              // Estimación 1 Hz
              summary.durationMinutes = Math.round(records.length / 60);
            }
          }

          // Fallback Distancia
          if (summary.distanceKm === undefined && recordMaxDist > 0) {
            summary.distanceKm =
              recordMaxDist > 50
                ? parseFloat((recordMaxDist / 1000).toFixed(2))
                : parseFloat(recordMaxDist.toFixed(2));
          }

          // Fallback Calorías desde records
          if (!summary.calories && recordMaxCal > 0) {
            summary.calories = Math.round(recordMaxCal);
          }
        }

        // 7. Estimación fisiológica de calorías (Keytel et al.) si el archivo no trajo calorías
        // pero sí duración y frecuencia cardíaca
        if (!summary.calories && summary.durationMinutes && summary.durationMinutes > 0) {
          const hr = summary.avgHeartRate || 140;
          const calc = calculateCaloriesKeytel({
            avgHeartRate: hr,
            durationMinutes: summary.durationMinutes,
            biometrics: userBiometrics,
          });
          summary.calories = calc.calories;
        }

        console.log("Resumen final extraído para el formulario:", summary);
        resolve(summary);
      });
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo en memoria"));
    };

    reader.readAsArrayBuffer(file);
  });
}
