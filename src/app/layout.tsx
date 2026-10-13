import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const themeScript = `(function(){try{var t=localStorage.getItem("gastos-tema");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#100e0c":"#f6f1e8");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Gastos",
  description: "Ingresos, gastos, cuentas y presupuestos personales en pesos.",
  applicationName: "Gastos",
  appleWebApp: {
    capable: true,
    title: "Gastos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f6f1e8" />
      </head>
      <body className="font-sans antialiased">
        <Script id="gastos-tema" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
