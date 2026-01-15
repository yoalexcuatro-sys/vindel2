import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import { AuthProvider } from "@/lib/auth-context";
import { SWRProvider } from "@/lib/swr-config";
import "./globals.css";

// Una sola fuente optimizada - Inter es más ligera y versátil
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'], // Solo pesos necesarios
  display: 'swap', // Muestra texto inmediatamente
  preload: true,
});

export const metadata: Metadata = {
  title: "Vindel - Compra y vende productos de segunda mano",
  description: "La mejor plataforma para comprar y vender cerca de ti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen bg-gray-50`}
      >
        <AuthProvider>
          <SWRProvider>
            <Navbar />
            {children}
            <FooterWrapper />
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
