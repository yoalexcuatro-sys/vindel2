import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { slugify } from '@/lib/slugs';

type Props = {
  params: Promise<{ category: string; id: string }>;
};

// Extraer ID del slug (formato: titulo-del-producto--shortId)
function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  const doubleDashIndex = slug.lastIndexOf('--');
  if (doubleDashIndex !== -1) {
    return slug.substring(doubleDashIndex + 2);
  }
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

// Buscar producto por ID corto
async function getProductByShortId(shortId: string): Promise<Record<string, unknown> | null> {
  try {
    // Buscar documentos que empiecen con el shortId
    const { collection, query, where, getDocs, limit, documentId } = await import('firebase/firestore');
    const q = query(
      collection(db, 'products'),
      where(documentId(), '>=', shortId),
      where(documentId(), '<=', shortId + '\uf8ff'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Record<string, unknown>;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const shortId = extractIdFromSlug(resolvedParams.id);
  
  if (!shortId) {
    return {
      title: 'Anunț negăsit',
    };
  }

  const product = await getProductByShortId(shortId);

  if (!product) {
    return {
      title: 'Anunț negăsit',
    };
  }

  const title = product.title as string;
  const description = product.description as string;
  const price = product.price as number;
  const location = product.location as string;
  const images = product.images as string[] || [];
  const category = product.category as string;
  
  const priceText = price ? `${price.toLocaleString('ro-RO')} €` : 'Preț negociabil';
  const metaDescription = description 
    ? `${description.slice(0, 150)}... ${priceText} - ${location || 'România'}`
    : `${title} - ${priceText} în ${location || 'România'}. Cumpără acum pe Vindel.ro!`;

  const categorySlug = category ? slugify(category) : 'detalii';
  const titleSlug = slugify(title);
  const canonicalUrl = `https://vindel.ro/anunturi/${categorySlug}/${titleSlug}--${shortId}`;

  return {
    title: `${title} - ${priceText}`,
    description: metaDescription,
    keywords: [title, category, location, 'anunț', 'second hand', 'vindel'].filter(Boolean),
    openGraph: {
      title: `${title} - ${priceText}`,
      description: metaDescription,
      url: canonicalUrl,
      siteName: 'Vindel',
      locale: 'ro_RO',
      type: 'website',
      images: images.length > 0 ? images.map((img, index) => ({
        url: img,
        width: 800,
        height: 600,
        alt: index === 0 ? title : `${title} - imagine ${index + 1}`,
      })) : [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${priceText}`,
      description: metaDescription,
      images: images.length > 0 ? [images[0]] : ['/og-image.png'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Generar JSON-LD structured data para el producto
async function generateJsonLd(shortId: string) {
  const product = await getProductByShortId(shortId);
  if (!product) return null;
  
  const title = product.title as string;
  const description = product.description as string;
  const price = product.price as number;
  const location = product.location as string;
  const images = product.images as string[] || [];
  const category = product.category as string;
  const condition = product.condition as string;
  
  const conditionMap: Record<string, string> = {
    'nou': 'https://schema.org/NewCondition',
    'nou-sigilat': 'https://schema.org/NewCondition',
    'nou-desigilat': 'https://schema.org/NewCondition',
    'nou-eticheta': 'https://schema.org/NewCondition',
    'ca-nou': 'https://schema.org/UsedCondition',
    'folosit': 'https://schema.org/UsedCondition',
    'folosit-functional': 'https://schema.org/UsedCondition',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description || title,
    image: images.length > 0 ? images : undefined,
    offers: {
      '@type': 'Offer',
      price: price || 0,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      itemCondition: conditionMap[condition] || 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Person',
        name: 'Vindel User',
      },
      areaServed: {
        '@type': 'Place',
        name: location || 'România',
      },
    },
    category: category,
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; id: string }>;
}) {
  const resolvedParams = await params;
  const shortId = extractIdFromSlug(resolvedParams.id);
  const jsonLd = await generateJsonLd(shortId);
  
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
