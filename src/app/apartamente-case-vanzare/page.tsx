import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apartamente și case de vânzare România | Vindu.ro',
  description: 'Apartamente și case de vânzare pe Vindu.ro. Găsește proprietatea perfectă în România. Anunțuri imobiliare gratuite, fără comision de la proprietar!',
  keywords: ['apartamente de vanzare', 'case de vanzare', 'imobiliare romania', 'vand apartament', 'anunturi imobiliare'],
  openGraph: {
    title: 'Apartamente și case de vânzare România | Vindu.ro',
    description: 'Apartamente și case de vânzare pe Vindu.ro. Anunțuri imobiliare gratuite!',
    url: 'https://www.vindu.ro/apartamente-case-vanzare',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/apartamente-case-vanzare',
  },
};

export default function ApartamenteCaseVanzare() {
  redirect('/search?category=imobiliare');
}
