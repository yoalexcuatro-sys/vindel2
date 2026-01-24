import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Haine și încălțăminte second hand - Modă | Vindel.ro',
  description: 'Haine și încălțăminte second hand pe Vindel.ro. Branduri de top la prețuri mici: Nike, Adidas, Zara, H&M. Vinde sau cumpără modă second hand gratuit!',
  keywords: ['haine second hand', 'incaltaminte second hand', 'moda second hand', 'vand haine', 'haine ieftine'],
  openGraph: {
    title: 'Haine și încălțăminte second hand | Vindel.ro',
    description: 'Haine și încălțăminte second hand pe Vindel.ro. Branduri de top la prețuri mici!',
    url: 'https://www.vindel.ro/haine-incaltaminte-second-hand',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/haine-incaltaminte-second-hand',
  },
};

export default function HaineSecondHand() {
  redirect('/search?category=moda');
}
