import type { Metadata, Viewport } from "next";
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
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#13C1AC',
};

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
      <head>
        {/* Preconnect a recursos externos para acelerar conexiones */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://pub-c6978520431643c8b004271c2904d927.r2.dev" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://pub-c6978520431643c8b004271c2904d927.r2.dev" />
      </head>
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
