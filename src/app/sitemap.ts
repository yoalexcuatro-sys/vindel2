import { MetadataRoute } from 'next';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { slugify } from '@/lib/slugs';

// Force dynamic generation on each request
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vindu.ro';
  
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cum-sa-vinzi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cum-sa-cumperi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/siguranta`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ajutor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Páginas SEO landing (ocultas que redirigen a páginas principales)
  const seoLandingPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/publica-anunturi-gratuite`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/anunturi-gratuite-romania`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vand-cumpar-online`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vand-telefoane-electronice`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/vand-masini-second-hand`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/apartamente-case-vanzare`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/haine-incaltaminte-second-hand`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/mobila-electrocasnice-second-hand`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/locuri-de-munca-romania`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/servicii-mesteri-romania`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/articole-copii-bebelusi`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/animale-companie-accesorii`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/sport-timp-liber-echipamente`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/olx-alternativa-romania`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/marketplace-romania`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  // Categorías principales
  const categories = [
    'electronice', 'auto-moto', 'imobiliare', 'moda', 
    'casa-gradina', 'sport', 'copii', 'animale', 
    'servicii', 'locuri-de-munca'
  ];
  
  const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
    url: `${baseUrl}/search?category=${category}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Productos activos (últimos 5000 para cubrir todos)
  let productPages: MetadataRoute.Sitemap = [];
  
  try {
    console.log('[Sitemap] Fetching products from Firebase...');
    const productsRef = collection(db, 'products');
    // Obtener productos que estén aprobados O que no tengan status (productos antiguos)
    const q = query(
      productsRef,
      orderBy('publishedAt', 'desc'),
      limit(5000)
    );
    
    const snapshot = await getDocs(q);
    console.log(`[Sitemap] Found ${snapshot.docs.length} products`);
    
    // Filtrar solo productos activos (approved o sin status = activo por defecto)
    const activeProducts = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.status || data.status === 'approved' || data.status === 'active';
    });
    
    console.log(`[Sitemap] Active products: ${activeProducts.length}`);
    
    productPages = activeProducts.map(doc => {
      const data = doc.data();
      const slug = slugify(data.title || 'produs');
      const categorySlug = data.category ? slugify(data.category) : 'detalii';
      const shortId = doc.id.slice(0, 8);
      
      return {
        url: `${baseUrl}/anunturi/${categorySlug}/${slug}--${shortId}`,
        lastModified: data.updatedAt?.toDate() || data.publishedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: data.promoted ? 0.8 : 0.6,
      };
    });
  } catch (error) {
    console.error('Error generating sitemap products:', error);
  }

  return [...staticPages, ...seoLandingPages, ...categoryPages, ...productPages];
}
