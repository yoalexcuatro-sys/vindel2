import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Marketplace România - Cumpără și vinde local | Vindu.ro',
  description: 'Marketplace România pe Vindu.ro. Cumpără și vinde local, fără comisioane. Conectează-te cu vânzători și cumpărători din zona ta. Anunțuri gratuite!',
  keywords: ['marketplace romania', 'cumpar local', 'vand local', 'anunturi locale', 'produse locale'],
  openGraph: {
    title: 'Marketplace România | Vindu.ro',
    description: 'Marketplace România pe Vindu.ro. Cumpără și vinde local!',
    url: 'https://www.vindu.ro/marketplace-romania',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/marketplace-romania',
  },
};

export default function MarketplaceRomania() {
  redirect('/');
}
