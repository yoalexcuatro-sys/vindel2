import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sport și timp liber - Echipamente sportive | Vindel.ro',
  description: 'Echipamente sportive și articole pentru timp liber pe Vindel.ro. Biciclete, fitness, camping, fotbal. Vinde sau cumpără articole sport second hand gratuit!',
  keywords: ['echipamente sportive', 'bicicleta second hand', 'fitness', 'camping', 'sport second hand'],
  openGraph: {
    title: 'Sport și timp liber | Vindel.ro',
    description: 'Echipamente sportive pe Vindel.ro. Articole sport second hand!',
    url: 'https://www.vindel.ro/sport-timp-liber-echipamente',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/sport-timp-liber-echipamente',
  },
};

export default function SportTimpLiber() {
  redirect('/search?category=sport');
}
