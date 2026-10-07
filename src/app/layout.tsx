import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHIMA • Football Analytics & Tracker",
  description: "Plataforma de registro y análisis de entrenamientos y partidos de fútbol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
