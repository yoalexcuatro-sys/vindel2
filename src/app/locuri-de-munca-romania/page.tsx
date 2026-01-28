import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Locuri de muncă România - Joburi și angajări | Vindu.ro',
  description: 'Locuri de muncă în România pe Vindu.ro. Găsește jobul perfect sau publică anunțuri de angajare gratuite. Mii de oportunități de carieră te așteaptă!',
  keywords: ['locuri de munca', 'joburi romania', 'angajari', 'caut job', 'oferte de munca'],
  openGraph: {
    title: 'Locuri de muncă România | Vindu.ro',
    description: 'Locuri de muncă în România pe Vindu.ro. Găsește jobul perfect!',
    url: 'https://www.vindu.ro/locuri-de-munca-romania',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/locuri-de-munca-romania',
  },
};

export default function LocuriDeMunca() {
  redirect('/search?category=locuri-de-munca');
}
