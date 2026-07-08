import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redactor IA | ChequeaBolivia",
  description: "MVP para redactar borradores de verificaciones con apoyo de IA."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
