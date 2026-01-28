// Script para generar sitemap estático con todos los productos
// Ejecutar con: npx ts-node --compiler-options '{"module":"commonjs"}' src/scripts/generate-sitemap.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Cargar credenciales
const serviceAccount = require('../../serviceAccountKey.json');

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

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

async function generateSitemap() {
  const baseUrl = 'https://www.vindu.ro';
  const now = new Date().toISOString();
  
  console.log('🔍 Obteniendo productos de Firebase...');
  
  // Obtener todos los productos aprobados (status: approved)
  const snapshot = await db
    .collection('products')
    .where('status', '==', 'approved')
    .get();
  
  console.log(`✅ Encontrados ${snapshot.docs.length} productos aprobados`);
  
  // Páginas estáticas
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
  ];

  // Páginas SEO landing (ocultas que redirigen a páginas principales)
  const seoLandingPages = [
    { url: `${baseUrl}/publica-anunturi-gratuite`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/anunturi-gratuite-romania`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/vand-cumpar-online`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/vand-telefoane-electronice`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/vand-masini-second-hand`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/apartamente-case-vanzare`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/haine-incaltaminte-second-hand`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/mobila-electrocasnice-second-hand`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/locuri-de-munca-romania`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/servicii-mesteri-romania`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/articole-copii-bebelusi`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/animale-companie-accesorii`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/sport-timp-liber-echipamente`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/olx-alternativa-romania`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/marketplace-romania`, priority: '0.8', changefreq: 'weekly' },
  ];

  // Categorías
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

  // Productos
  const productPages = snapshot.docs.map(doc => {
    const data = doc.data();
    const title = data.title || 'produs';
    const slug = slugify(title);
    const categorySlug = data.category ? slugify(data.category) : 'detalii';
    const shortId = doc.id.slice(0, 8);
    
    let lastmod = now;
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

  // Generar XML
  const allPages = [...staticPages, ...seoLandingPages, ...categoryPages, ...productPages];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${(page as any).lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Guardar archivo
  const outputPath = path.join(__dirname, '../../public/sitemap-products.xml');
  fs.writeFileSync(outputPath, xml);
  
  console.log(`\n📄 Sitemap generado con ${allPages.length} URLs`);
  console.log(`   - ${staticPages.length} páginas estáticas`);
  console.log(`   - ${seoLandingPages.length} páginas SEO landing`);
  console.log(`   - ${categoryPages.length} categorías`);
  console.log(`   - ${productPages.length} productos`);
  console.log(`\n✅ Archivo guardado en: ${outputPath}`);
  console.log(`\n🌐 Después del deploy, estará disponible en:`);
  console.log(`   https://www.vindu.ro/sitemap-products.xml`);
  
  process.exit(0);
}

generateSitemap().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
