import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Publică anunțuri gratuite în România | Vindu.ro',
  description: 'Publică anunțuri gratuite pe Vindu.ro - cea mai mare platformă de anunțuri din România. Vinde rapid și ușor: electronice, auto, imobiliare, modă și multe altele. Înregistrare gratuită!',
  keywords: ['publica anunturi gratuite', 'anunturi gratuite romania', 'vinde gratis', 'publica anunt', 'site anunturi'],
  openGraph: {
    title: 'Publică anunțuri gratuite în România | Vindu.ro',
    description: 'Publică anunțuri gratuite pe Vindu.ro - cea mai mare platformă de anunțuri din România.',
    url: 'https://www.vindu.ro/publica-anunturi-gratuite',
  },
  alternates: {
    canonical: 'https://www.vindu.ro/publica-anunturi-gratuite',
  },
};

export default function PublicaAnunturiGratuite() {
  redirect('/');
}
