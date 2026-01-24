import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { SWRProvider } from "@/lib/swr-config";
import LayoutContent from "@/components/LayoutContent";
import CookieConsent from "@/components/CookieConsent";
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#13C1AC',
  interactiveWidget: 'resizes-visual',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vindel.ro'),
  title: {
    default: 'Vindel - Anunțuri gratuite România | Vinde și cumpără online',
    template: '%s | Vindel.ro',
  },
  description: 'Dacă nu-l folosești, vinde-l. Cumpără și vinde tot ce vrei, aproape de tine. Caută. Publică anunț. Rapid & Simplu. Tranzacții Sigure. Cele mai bune prețuri.',
  keywords: ['anunțuri gratuite', 'second hand', 'vânzări online', 'cumpărături', 'România', 'olx alternativă', 'marketplace România', 'electronice', 'auto', 'imobiliare', 'vinde online', 'cumpără ieftin'],
  authors: [{ name: 'Vindel.ro' }],
  creator: 'Vindel.ro',
  publisher: 'Vindel.ro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://vindel.ro',
    siteName: 'Vindel.ro',
    title: 'Vindel - Anunțuri gratuite România | Vinde și cumpără online',
    description: 'Dacă nu-l folosești, vinde-l. Cumpără și vinde tot ce vrei, aproape de tine. Publică anunț gratuit. Rapid & Simplu.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vindel.ro - Anunțuri gratuite România',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vindel - Anunțuri gratuite România',
    description: 'Dacă nu-l folosești, vinde-l. Cumpără și vinde tot ce vrei, aproape de tine.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Añadir código real de Google Search Console
  },
  alternates: {
    canonical: 'https://vindel.ro',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vindel',
    url: 'https://vindel.ro',
    description: 'Cea mai mare platformă de anunțuri gratuite din România',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://vindel.ro/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vindel',
      url: 'https://vindel.ro',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vindel.ro/logo.png',
      },
    },
  };

  return (
    <html lang="ro">
      <head>
        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
            <LayoutContent>
              {children}
            </LayoutContent>
            <CookieConsent />
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
