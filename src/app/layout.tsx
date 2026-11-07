import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b2430",
};

export const metadata: Metadata = {
  title: {
    default: "Taltum Gestión | Consultoría Integral SST & Gestión Humana",
    template: "%s | Taltum Gestión",
  },
  description:
    "Plataforma operativa interna de Taltum para gestión de empresas cliente, servicios, formatos establecidos, cotizaciones, reportes técnicos y entrega segura de documentos.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taltum Gestión",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bone-white text-petrol">
        {children}
      </body>
    </html>
  );
}
