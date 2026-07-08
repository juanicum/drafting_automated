import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente editorial IA | ChequeaBolivia",
  description: "MVP para redactar verificaciones con apoyo de IA, chat guiado y base de datos."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
