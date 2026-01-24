import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Anunțuri gratuite România - Cumpără și vinde online | Vindel.ro',
  description: 'Anunțuri gratuite în România pe Vindel.ro. Găsește cele mai bune oferte la electronice, mașini, apartamente, haine și multe altele. Peste 10.000 de anunțuri noi zilnic!',
  keywords: ['anunturi gratuite', 'anunturi romania', 'cumpar vand', 'olx alternativa', 'marketplace romania'],
  openGraph: {
    title: 'Anunțuri gratuite România | Vindel.ro',
    description: 'Anunțuri gratuite în România pe Vindel.ro. Găsește cele mai bune oferte!',
    url: 'https://www.vindel.ro/anunturi-gratuite-romania',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/anunturi-gratuite-romania',
  },
};

export default function AnunturiGratuiteRomania() {
  redirect('/');
}
