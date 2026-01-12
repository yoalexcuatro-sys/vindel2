import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
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
        className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} antialiased flex flex-col min-h-screen bg-gray-50`}
      >
        <AuthProvider>
          <Navbar />
          {children}
          <FooterWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
