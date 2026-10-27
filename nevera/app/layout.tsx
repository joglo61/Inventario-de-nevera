import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cormorant, Montserrat } from "next/font/google";
import "./globals.css";

const titulo = Cormorant({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-titulo" });
const texto = Montserrat({ subsets: ["latin"], variable: "--f-texto" });

export const metadata: Metadata = {
  title: "Nevera",
  description: "Lo que se acabó en casa",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Nevera", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0A09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get("tema")?.value;
  return (
    <html
      lang="es"
      data-theme={tema === "light" || tema === "dark" ? tema : undefined}
      className={`${titulo.variable} ${texto.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
