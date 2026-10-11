import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Control de Gastos",
  description: "Registrá ingresos y gastos, mirá el saldo y seguí el historial.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
