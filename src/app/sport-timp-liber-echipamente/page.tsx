import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sport și timp liber - Echipamente sportive | Vindu.ro',
  description: 'Echipamente sportive și articole pentru timp liber pe Vindu.ro. Biciclete, fitness, camping, fotbal. Vinde sau cumpără articole sport second hand gratuit!',
  keywords: ['echipamente sportive', 'bicicleta second hand', 'fitness', 'camping', 'sport second hand'],
  openGraph: {
    title: 'Sport și timp liber | Vindu.ro',
    description: 'Echipamente sportive pe Vindu.ro. Articole sport second hand!',
    url: 'https://www.vindu.ro/sport-timp-liber-echipamente',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/sport-timp-liber-echipamente',
  },
};

export default function SportTimpLiber() {
  redirect('/search?category=sport');
}
