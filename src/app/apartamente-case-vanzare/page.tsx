import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apartamente și case de vânzare România | Vindel.ro',
  description: 'Apartamente și case de vânzare pe Vindel.ro. Găsește proprietatea perfectă în România. Anunțuri imobiliare gratuite, fără comision de la proprietar!',
  keywords: ['apartamente de vanzare', 'case de vanzare', 'imobiliare romania', 'vand apartament', 'anunturi imobiliare'],
  openGraph: {
    title: 'Apartamente și case de vânzare România | Vindel.ro',
    description: 'Apartamente și case de vânzare pe Vindel.ro. Anunțuri imobiliare gratuite!',
    url: 'https://www.vindel.ro/apartamente-case-vanzare',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/apartamente-case-vanzare',
  },
};

export default function ApartamenteCaseVanzare() {
  redirect('/search?category=imobiliare');
}
