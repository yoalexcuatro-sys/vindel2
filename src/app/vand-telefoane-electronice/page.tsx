import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vând telefoane și electronice - Anunțuri gratuite | Vindu.ro',
  description: 'Vând telefoane, laptopuri, tablete și electronice pe Vindu.ro. iPhone, Samsung, Huawei la cele mai bune prețuri. Anunțuri gratuite de electronice second hand!',
  keywords: ['vand telefon', 'vand iphone', 'vand samsung', 'telefoane second hand', 'electronice second hand', 'vand laptop'],
  openGraph: {
    title: 'Vând telefoane și electronice | Vindu.ro',
    description: 'Vând telefoane, laptopuri și electronice pe Vindu.ro. Cele mai bune prețuri!',
    url: 'https://www.vindu.ro/vand-telefoane-electronice',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/vand-telefoane-electronice',
  },
};

export default function VandTelefoane() {
  redirect('/search?category=electronice');
}
