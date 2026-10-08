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

        const summary: ParsedFitSummary = {};

        // Extraer desde las sesiones principales (session / activity)
        if (data.sessions && data.sessions.length > 0) {
          const s = data.sessions[0];
          if (s.total_elapsed_time || s.total_timer_time) {
            const secs = s.total_timer_time || s.total_elapsed_time;
            summary.durationMinutes = Math.round(secs / 60);
          }
          if (s.total_calories) {
            summary.calories = Math.round(s.total_calories);
          }
          if (s.avg_heart_rate) {
            summary.avgHeartRate = Math.round(s.avg_heart_rate);
          }
          if (s.max_heart_rate) {
            summary.maxHeartRate = Math.round(s.max_heart_rate);
          }
          if (s.total_distance) {
            // total_distance puede estar en metros o km
            const dist = s.total_distance > 100 ? s.total_distance / 1000 : s.total_distance;
            summary.distanceKm = parseFloat(dist.toFixed(2));
          }
        }

        // Si faltaron datos en session, calcular desde los records individuales
        if (data.records && data.records.length > 0) {
          const records = data.records;
          const hrList = records.map((r: any) => r.heart_rate).filter((hr: any) => typeof hr === "number" && hr > 0);

          if (!summary.avgHeartRate && hrList.length > 0) {
            const sum = hrList.reduce((acc: number, val: number) => acc + val, 0);
            summary.avgHeartRate = Math.round(sum / hrList.length);
          }

          if (!summary.maxHeartRate && hrList.length > 0) {
            summary.maxHeartRate = Math.max(...hrList);
          }

          if (!summary.durationMinutes && records.length > 1) {
            const firstTime = new Date(records[0].timestamp).getTime();
            const lastTime = new Date(records[records.length - 1].timestamp).getTime();
            if (!isNaN(firstTime) && !isNaN(lastTime)) {
              summary.durationMinutes = Math.round((lastTime - firstTime) / 60000);
            }
          }
        }

        resolve(summary);
      });
    };

    reader.onerror = () => {
      reject(new Error("Error leyendo el archivo"));
    };

    reader.readAsArrayBuffer(file);
  });
}
