import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Articole pentru copii și bebeluși | Vindu.ro',
  description: 'Articole pentru copii și bebeluși pe Vindu.ro. Hăinuțe, jucării, cărucioare, scaune auto la prețuri mici. Vinde sau cumpără articole pentru copii gratuit!',
  keywords: ['articole copii', 'haine copii', 'jucarii', 'carucior bebe', 'scaun auto copii'],
  openGraph: {
    title: 'Articole pentru copii și bebeluși | Vindu.ro',
    description: 'Articole pentru copii și bebeluși pe Vindu.ro. Prețuri mici!',
    url: 'https://www.vindu.ro/articole-copii-bebelusi',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/articole-copii-bebelusi',
  },
};

export default function ArticoleCopii() {
  redirect('/search?category=copii');
}
