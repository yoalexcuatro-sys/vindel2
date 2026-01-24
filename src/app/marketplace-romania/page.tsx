import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Marketplace România - Cumpără și vinde local | Vindel.ro',
  description: 'Marketplace România pe Vindel.ro. Cumpără și vinde local, fără comisioane. Conectează-te cu vânzători și cumpărători din zona ta. Anunțuri gratuite!',
  keywords: ['marketplace romania', 'cumpar local', 'vand local', 'anunturi locale', 'produse locale'],
  openGraph: {
    title: 'Marketplace România | Vindel.ro',
    description: 'Marketplace România pe Vindel.ro. Cumpără și vinde local!',
    url: 'https://www.vindel.ro/marketplace-romania',
  },
  alternates: {
    canonical: 'https://www.vindel.ro/marketplace-romania',
  },
};

export default function MarketplaceRomania() {
  redirect('/');
}
