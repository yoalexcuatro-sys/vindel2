import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vând cumpăr online România - Anunțuri gratuite | Vindu.ro',
  description: 'Vând și cumpăr online pe Vindu.ro. Cea mai rapidă modalitate de a vinde sau cumpăra produse second hand în România. Anunțuri gratuite, fără comisioane!',
  keywords: ['vand cumpar', 'vand online', 'cumpar online', 'second hand romania', 'produse second hand'],
  openGraph: {
    title: 'Vând cumpăr online România | Vindu.ro',
    description: 'Vând și cumpăr online pe Vindu.ro. Anunțuri gratuite, fără comisioane!',
    url: 'https://www.vindu.ro/vand-cumpar-online',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/vand-cumpar-online',
  },
};

export default function VandCumparOnline() {
  redirect('/');
}
