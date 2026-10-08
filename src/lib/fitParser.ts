import FitParser from "fit-file-parser";

export interface ParsedFitSummary {
  durationMinutes?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
}

export function parseFitFile(file: File): Promise<ParsedFitSummary> {
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

      fitParser.parse(buffer, (error: any, data: any) => {
        if (error) {
          reject(new Error("No se pudo procesar el archivo .FIT: " + (error.message || error)));
          return;
        }

        console.log("=== DATOS EXTRAÍDOS DEL ARCHIVO .FIT ===", data);

        const summary: ParsedFitSummary = {};

        // 1. Revisar sesiones principales (data.sessions o data.session)
        const sessions = data.sessions || (data.session ? [data.session] : []);
        if (sessions.length > 0) {
          const s = sessions[0];
          console.log("Sesión encontrada en .FIT:", s);

          // Duración / Tiempo
          const totalSecs =
            s.total_timer_time ??
            s.total_elapsed_time ??
            s.total_moving_time ??
            s.timer_time;

          if (typeof totalSecs === "number" && totalSecs > 0) {
            summary.durationMinutes = Math.round(totalSecs / 60);
          }

          // Calorías
          const cal = s.total_calories ?? s.calories;
          if (typeof cal === "number" && cal > 0) {
            summary.calories = Math.round(cal);
          }

          // Frecuencia Cardíaca
          const avgHr = s.avg_heart_rate ?? s.avg_hr;
          if (typeof avgHr === "number" && avgHr > 0) {
            summary.avgHeartRate = Math.round(avgHr);
          }
          const maxHr = s.max_heart_rate ?? s.max_hr;
          if (typeof maxHr === "number" && maxHr > 0) {
            summary.maxHeartRate = Math.round(maxHr);
          }

          // Distancia
          const dist = s.total_distance ?? s.distance;
          if (typeof dist === "number" && dist > 0) {
            // Si viene en metros (por ejemplo > 100 metros), convertir a km
            summary.distanceKm = dist > 50 ? parseFloat((dist / 1000).toFixed(2)) : parseFloat(dist.toFixed(2));
          }
        }

        // 2. Revisar si hay un resumen a nivel 'activity' (data.activity o data.activities)
        const activity = data.activity || (data.activities && data.activities[0]);
        if (activity) {
          console.log("Activity encontrada en .FIT:", activity);
          if (!summary.durationMinutes && (activity.total_timer_time || activity.total_elapsed_time)) {
            const secs = activity.total_timer_time || activity.total_elapsed_time;
            summary.durationMinutes = Math.round(secs / 60);
          }
        }

        // 3. Fallback: extraer desde los puntos de muestra individuales (records)
        const records = data.records || [];
        if (records.length > 0) {
          // Fallback Frecuencia Cardíaca
          if (!summary.avgHeartRate || !summary.maxHeartRate) {
            const hrList = records
              .map((r: any) => r.heart_rate ?? r.heartRate)
              .filter((hr: any) => typeof hr === "number" && hr > 0);

            if (hrList.length > 0) {
              if (!summary.avgHeartRate) {
                const sum = hrList.reduce((acc: number, val: number) => acc + val, 0);
                summary.avgHeartRate = Math.round(sum / hrList.length);
              }
              if (!summary.maxHeartRate) {
                summary.maxHeartRate = Math.max(...hrList);
              }
            }
          }

          // Fallback Duración por marcas de tiempo (timestamps)
          if (!summary.durationMinutes && records.length > 1) {
            const firstTime = new Date(records[0].timestamp).getTime();
            const lastTime = new Date(records[records.length - 1].timestamp).getTime();
            if (!isNaN(firstTime) && !isNaN(lastTime) && lastTime > firstTime) {
              summary.durationMinutes = Math.round((lastTime - firstTime) / 60000);
            }
          }

          // Fallback Distancia desde el último record acumulado
          if (!summary.distanceKm) {
            const distances = records
              .map((r: any) => r.distance)
              .filter((d: any) => typeof d === "number" && d > 0);

            if (distances.length > 0) {
              const maxDist = Math.max(...distances);
              summary.distanceKm = maxDist > 50 ? parseFloat((maxDist / 1000).toFixed(2)) : parseFloat(maxDist.toFixed(2));
            }
          }

          // Fallback Calorías desde records (si el dispositivo guarda calorías acumuladas)
          if (!summary.calories) {
            const cals = records
              .map((r: any) => r.calories)
              .filter((c: any) => typeof c === "number" && c > 0);
            if (cals.length > 0) {
              summary.calories = Math.round(Math.max(...cals));
            }
          }
        }

        // 4. Estimación inteligente de calorías si el archivo solo registró FC y tiempo pero no el campo total_calories
        if (!summary.calories && summary.durationMinutes && summary.durationMinutes > 0) {
          // Fórmula estándar de gasto calórico deportivo por FC (media ~130-160 ppm para fútbol suele quemar ~8-11 kcal/min)
          const hr = summary.avgHeartRate || 140;
          const factor = hr > 150 ? 10.5 : hr > 130 ? 8.5 : 6.5;
          summary.calories = Math.round(summary.durationMinutes * factor);
        }

        console.log("Resumen final extraído para el formulario:", summary);
        resolve(summary);
      });
    };

    reader.onerror = () => {
      reject(new Error("Error leyendo el archivo"));
    };

    reader.readAsArrayBuffer(file);
  });
}
