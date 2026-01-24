import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vând mașini second hand România - Auto Moto | Vindel.ro',
  description: 'Vând mașini second hand pe Vindel.ro. Autoturisme, motociclete, piese auto la cele mai bune prețuri în România. Anunțuri auto gratuite!',
  keywords: ['vand masina', 'masini second hand', 'auto second hand', 'vand auto', 'masini romania', 'anunturi auto'],
  openGraph: {
    title: 'Vând mașini second hand România | Vindel.ro',
    description: 'Vând mașini second hand pe Vindel.ro. Autoturisme la cele mai bune prețuri!',
    url: 'https://www.vindel.ro/vand-masini-second-hand',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/vand-masini-second-hand',
  },
};

export default function VandMasini() {
  redirect('/search?category=auto-moto');
}
