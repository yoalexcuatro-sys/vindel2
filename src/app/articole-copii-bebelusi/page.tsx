import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Articole pentru copii și bebeluși | Vindel.ro',
  description: 'Articole pentru copii și bebeluși pe Vindel.ro. Hăinuțe, jucării, cărucioare, scaune auto la prețuri mici. Vinde sau cumpără articole pentru copii gratuit!',
  keywords: ['articole copii', 'haine copii', 'jucarii', 'carucior bebe', 'scaun auto copii'],
  openGraph: {
    title: 'Articole pentru copii și bebeluși | Vindel.ro',
    description: 'Articole pentru copii și bebeluși pe Vindel.ro. Prețuri mici!',
    url: 'https://www.vindel.ro/articole-copii-bebelusi',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/articole-copii-bebelusi',
  },
};

export default function ArticoleCopii() {
  redirect('/search?category=copii');
}
