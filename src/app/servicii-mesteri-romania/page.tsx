import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Servicii și meșteri România - Anunțuri gratuite | Vindel.ro',
  description: 'Servicii și meșteri în România pe Vindel.ro. Găsește profesioniști pentru orice lucrare: instalatori, electricieni, zugravi. Publică sau găsește servicii gratuit!',
  keywords: ['servicii romania', 'mesteri', 'instalator', 'electrician', 'zugrav', 'reparatii'],
  openGraph: {
    title: 'Servicii și meșteri România | Vindel.ro',
    description: 'Servicii și meșteri în România pe Vindel.ro. Găsește profesioniști!',
    url: 'https://www.vindel.ro/servicii-mesteri-romania',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/servicii-mesteri-romania',
  },
};

export default function ServiciiMesteri() {
  redirect('/search?category=servicii');
}
