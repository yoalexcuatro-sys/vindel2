/**
 * Script de migración: Firebase Storage → Cloudflare R2
 * 
 * Ejecutar con: npx tsx src/scripts/migrate-firebase-to-r2.ts
 * 
 * Este script:
 * 1. Lee todos los productos de Firestore
 * 2. Descarga las imágenes de Firebase Storage
 * 3. Las sube a Cloudflare R2
 * 4. Actualiza las URLs en Firestore
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================
// CONFIGURACIÓN
// ============================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vindel-images';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

// Firebase Admin - usa credenciales del proyecto
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Inicializar Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Inicializar cliente S3 para R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function isFirebaseUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com');
}

function isR2Url(url: string): boolean {
  return url.includes('r2.dev') || url.includes(R2_PUBLIC_URL);
}

function generateR2Key(originalUrl: string, type: 'product' | 'avatar'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}s/${timestamp}-${random}.webp`;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ❌ Error descargando: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`  ❌ Error descargando imagen:`, error);
    return null;
  }
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string = 'image/webp'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await r2Client.send(command);
  return `${R2_PUBLIC_URL}/${key}`;
}

// ============================================
// MIGRACIÓN DE PRODUCTOS
// ============================================

async function migrateProducts() {
  console.log('\n📦 Migrando imágenes de productos...\n');
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();
  
  let total = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    total++;
    const data = doc.data();
    const productId = doc.id;
    
    console.log(`\n[${total}/${snapshot.size}] Producto: ${data.title || productId}`);

    // Verificar si la imagen principal necesita migración
    let newImageUrl = data.image;
    let newImages = data.images || [];
    let needsUpdate = false;

    // Migrar imagen principal
    if (data.image && isFirebaseUrl(data.image)) {
      console.log(`  📥 Descargando imagen principal...`);
      const buffer = await downloadImage(data.image);
      
      if (buffer) {
        const key = `products/${productId}/main.webp`;
        console.log(`  📤 Subiendo a R2...`);
        newImageUrl = await uploadToR2(buffer, key);
        needsUpdate = true;
        console.log(`  ✅ Migrada: ${newImageUrl}`);
      } else {
        errors++;
        console.log(`  ❌ Error al descargar imagen principal`);
      }
    } else if (data.image && isR2Url(data.image)) {
      console.log(`  ⏭️  Imagen principal ya está en R2`);
      skipped++;
    }

    // Migrar imágenes adicionales
    if (data.images && Array.isArray(data.images)) {
      const migratedImages: string[] = [];
      
      for (let i = 0; i < data.images.length; i++) {
        const imgUrl = data.images[i];
        
        if (isFirebaseUrl(imgUrl)) {
          console.log(`  📥 Descargando imagen ${i + 1}/${data.images.length}...`);
          const buffer = await downloadImage(imgUrl);
          
          if (buffer) {
            const key = `products/${productId}/img-${i}.webp`;
            console.log(`  📤 Subiendo a R2...`);
            const newUrl = await uploadToR2(buffer, key);
            migratedImages.push(newUrl);
            needsUpdate = true;
          } else {
            migratedImages.push(imgUrl); // Mantener URL original si falla
            errors++;
          }
        } else {
          migratedImages.push(imgUrl); // Ya migrada o externa
        }
      }
      
      newImages = migratedImages;
    }

    // Actualizar documento en Firestore
    if (needsUpdate) {
      await productsRef.doc(productId).update({
        image: newImageUrl,
        images: newImages,
        migratedToR2: true,
        migratedAt: new Date(),
      });
      migrated++;
      console.log(`  ✅ Documento actualizado en Firestore`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESUMEN DE PRODUCTOS:`);
  console.log(`   Total: ${total}`);
  console.log(`   Migrados: ${migrated}`);
  console.log(`   Ya en R2: ${skipped}`);
  console.log(`   Errores: ${errors}`);
  console.log('='.repeat(50));
}

// ============================================
// MIGRACIÓN DE AVATARES
// ============================================

async function migrateAvatars() {
  console.log('\n👤 Migrando avatares de usuarios...\n');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let total = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    total++;
    const data = doc.data();
    const userId = doc.id;
    
    // Solo procesar si tiene photoURL de Firebase
    if (!data.photoURL) {
      continue;
    }

    console.log(`\n[${total}/${snapshot.size}] Usuario: ${data.displayName || userId}`);

    if (isFirebaseUrl(data.photoURL)) {
      console.log(`  📥 Descargando avatar...`);
      const buffer = await downloadImage(data.photoURL);
      
      if (buffer) {
        const key = `avatars/${userId}.webp`;
        console.log(`  📤 Subiendo a R2...`);
        const newUrl = await uploadToR2(buffer, key);
        
        await usersRef.doc(userId).update({
          photoURL: newUrl,
          avatarMigratedToR2: true,
        });
        
        migrated++;
        console.log(`  ✅ Avatar migrado: ${newUrl}`);
      } else {
        errors++;
      }
    } else if (isR2Url(data.photoURL)) {
      console.log(`  ⏭️  Avatar ya está en R2`);
      skipped++;
    } else {
      console.log(`  ⏭️  Avatar externo (Google, etc)`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESUMEN DE AVATARES:`);
  console.log(`   Total usuarios: ${total}`);
  console.log(`   Migrados: ${migrated}`);
  console.log(`   Omitidos: ${skipped}`);
  console.log(`   Errores: ${errors}`);
  console.log('='.repeat(50));
}

// ============================================
// EJECUTAR MIGRACIÓN
// ============================================

async function main() {
  console.log('🚀 Iniciando migración Firebase Storage → Cloudflare R2');
  console.log('='.repeat(50));
  console.log(`📁 Bucket R2: ${R2_BUCKET_NAME}`);
  console.log(`🌐 URL pública: ${R2_PUBLIC_URL}`);
  console.log('='.repeat(50));

  // Verificar configuración
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    console.error('❌ Error: Faltan variables de entorno R2');
    console.error('   Asegúrate de tener configurado en .env.local:');
    console.error('   - R2_ACCESS_KEY_ID');
    console.error('   - R2_SECRET_ACCESS_KEY');
    console.error('   - NEXT_PUBLIC_R2_PUBLIC_URL');
    process.exit(1);
  }

  try {
    // Migrar productos
    await migrateProducts();
    
    // Migrar avatares
    await migrateAvatars();

    console.log('\n✅ Migración completada!');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

main();
