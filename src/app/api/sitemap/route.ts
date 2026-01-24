import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase for server-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig, 'sitemap');
  return getFirestore(app);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const baseUrl = 'https://vindel.ro';
  const now = new Date().toISOString();
  
  // Static pages
  const staticPages = [
    { url: baseUrl, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/search`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/cum-sa-vinzi`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/cum-sa-cumperi`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/siguranta`, priority: '0.6', changefreq: 'monthly' },
    { url: `${baseUrl}/ajutor`, priority: '0.6', changefreq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
    { url: `${baseUrl}/cookies`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/termeni`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/confidentialitate`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/aviz-legal`, priority: '0.3', changefreq: 'yearly' },
  ];

  // Categories
  const categories = [
    'electronice', 'auto-moto', 'imobiliare', 'moda', 
    'casa-gradina', 'sport', 'copii', 'animale', 
    'servicii', 'locuri-de-munca'
  ];
  
  const categoryPages = categories.map(category => ({
    url: `${baseUrl}/search?category=${category}`,
    priority: '0.8',
    changefreq: 'daily',
  }));

  // Products from Firebase
  let productPages: Array<{ url: string; priority: string; changefreq: string; lastmod: string }> = [];
  
  try {
    console.log('[Sitemap] Fetching products from Firebase...');
    console.log('[Sitemap] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    
    // Get Firebase instance
    const db = getDb();
    
    // Use Firebase client SDK - products have status 'approved'
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    
    console.log(`[Sitemap] Found ${snapshot.docs.length} approved products`);
    
    productPages = snapshot.docs.map(doc => {
      const data = doc.data();
      const title = data.title || 'produs';
      const slug = slugify(title);
      const categorySlug = data.category ? slugify(data.category) : 'detalii';
      const shortId = doc.id.slice(0, 8);
      
      let lastmod = now;
      // Firebase client SDK Timestamp
      if (data.updatedAt?.toDate) {
        lastmod = data.updatedAt.toDate().toISOString();
      } else if (data.publishedAt?.toDate) {
        lastmod = data.publishedAt.toDate().toISOString();
      }
      
      return {
        url: `${baseUrl}/anunturi/${categorySlug}/${slug}--${shortId}`,
        priority: data.promoted ? '0.8' : '0.6',
        changefreq: 'weekly',
        lastmod,
      };
    });
  } catch (error) {
    console.error('[Sitemap] Error fetching products:', error);
  }

  // Generate XML sitemap
  const allPages = [...staticPages, ...categoryPages, ...productPages];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${(page as any).lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  console.log(`[Sitemap] Generated sitemap with ${allPages.length} URLs`);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
