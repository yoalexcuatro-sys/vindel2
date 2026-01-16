/**
 * Script de migración: Añade publishedAt a productos existentes
 * 
 * Ejecutar con: npx tsx src/scripts/migrate-publishedAt.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

// Configuración Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function migratePublishedAt() {
  console.log('🚀 Iniciando migración de publishedAt...\n');
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log(`📦 Total productos encontrados: ${snapshot.size}\n`);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const productId = docSnap.id;
    
    // Si ya tiene publishedAt, saltar
    if (data.publishedAt) {
      console.log(`⏭️  ${productId.slice(0, 8)}... ya tiene publishedAt`);
      skipped++;
      continue;
    }
    
    try {
      // Usar createdAt si existe, sino fecha actual
      let publishedAt: Timestamp;
      
      if (data.createdAt) {
        publishedAt = data.createdAt;
        console.log(`📝 ${productId.slice(0, 8)}... usando createdAt existente`);
      } else {
        // Fecha por defecto: hace 7 días (para que no todos aparezcan como "Acum")
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        publishedAt = Timestamp.fromDate(sevenDaysAgo);
        console.log(`📝 ${productId.slice(0, 8)}... asignando fecha por defecto (hace 7 días)`);
      }
      
      await updateDoc(doc(db, 'products', productId), {
        publishedAt: publishedAt
      });
      
      updated++;
    } catch (error) {
      console.error(`❌ Error actualizando ${productId}:`, error);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(50));
  console.log(`✅ Actualizados: ${updated}`);
  console.log(`⏭️  Omitidos (ya tenían): ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📦 Total procesados: ${snapshot.size}`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

migratePublishedAt().catch((error) => {
  console.error('Error fatal en migración:', error);
  process.exit(1);
});
