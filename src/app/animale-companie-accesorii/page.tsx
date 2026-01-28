import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Animale de companie și accesorii | Vindu.ro',
  description: 'Animale de companie și accesorii pe Vindu.ro. Câini, pisici, păsări, acvarii și accesorii pentru animale. Anunțuri gratuite pentru iubitorii de animale!',
  keywords: ['animale de companie', 'caini de vanzare', 'pisici de vanzare', 'accesorii animale', 'hrana animale'],
  openGraph: {
    title: 'Animale de companie și accesorii | Vindu.ro',
    description: 'Animale de companie și accesorii pe Vindu.ro. Anunțuri gratuite!',
    url: 'https://www.vindu.ro/animale-companie-accesorii',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/animale-companie-accesorii',
  },
};

export default function AnimaleCompanie() {
  redirect('/search?category=animale');
}
