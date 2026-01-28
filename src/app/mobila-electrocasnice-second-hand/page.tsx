import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mobilă și electrocasnice second hand | Vindu.ro',
  description: 'Mobilă și electrocasnice second hand pe Vindu.ro. Canapele, paturi, frigidere, mașini de spălat la prețuri accesibile. Anunțuri gratuite pentru casă și grădină!',
  keywords: ['mobila second hand', 'electrocasnice second hand', 'vand mobila', 'canapea second hand', 'frigider second hand'],
  openGraph: {
    title: 'Mobilă și electrocasnice second hand | Vindu.ro',
    description: 'Mobilă și electrocasnice second hand pe Vindu.ro. Prețuri accesibile!',
    url: 'https://www.vindu.ro/mobila-electrocasnice-second-hand',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/mobila-electrocasnice-second-hand',
  },
};

export default function MobilaElectrocasnice() {
  redirect('/search?category=casa-gradina');
}
