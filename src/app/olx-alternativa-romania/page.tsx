import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'OLX alternativă România - Site anunțuri gratuite | Vindu.ro',
  description: 'Vindu.ro - cea mai bună alternativă la OLX în România. Publică anunțuri gratuite, fără comisioane. Vinde și cumpără rapid: electronice, auto, imobiliare și multe altele!',
  keywords: ['olx alternativa', 'site anunturi', 'olx romania', 'anunturi online', 'marketplace romania'],
  openGraph: {
    title: 'OLX alternativă România | Vindu.ro',
    description: 'Vindu.ro - cea mai bună alternativă la OLX în România. Anunțuri gratuite!',
    url: 'https://www.vindu.ro/olx-alternativa-romania',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/olx-alternativa-romania',
  },
};

export default function OlxAlternativa() {
  redirect('/');
}
