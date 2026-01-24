/**
 * Image Migration Script: Old Firebase Storage → Cloudflare R2
 * 
 * This script downloads images directly from Firebase Storage (using Admin SDK)
 * and uploads them to R2, then updates the product documents.
 * 
 * Run with: npx tsx --env-file=.env.local src/scripts/migrate-images-from-storage.ts
 */

import * as admin from 'firebase-admin';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ============ CONFIGURATION ============

// Old Firebase credentials
const oldCredentialsPath = path.join(__dirname, 'old-firebase-credentials.json');
const oldCredentials = JSON.parse(fs.readFileSync(oldCredentialsPath, 'utf8'));

// New Firebase credentials (from env)
const newCredentials = {
  projectId: 'vindel-a7069',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// R2 Configuration
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || 'vindel-images',
  publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '',
};

// ============ INITIALIZE APPS ============

// Initialize OLD Firebase with Storage
const oldApp = admin.initializeApp({
  credential: admin.credential.cert(oldCredentials as admin.ServiceAccount),
  storageBucket: `${oldCredentials.project_id}.firebasestorage.app`,
}, 'old-firebase');

const oldDb = oldApp.firestore();
const oldBucket = oldApp.storage().bucket();

// Initialize NEW Firebase
const newApp = admin.initializeApp({
  credential: admin.credential.cert(newCredentials as admin.ServiceAccount),
}, 'new-firebase');

const newDb = newApp.firestore();

// Initialize R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

// ============ UTILITY FUNCTIONS ============

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: '📋', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

function extractStoragePath(url: string): string | null {
  // Extract path from Firebase Storage URL
  // URL format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?...
  try {
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  } catch (error) {
    console.error('Failed to extract path from URL:', url);
  }
  return null;
}

async function downloadFromStorage(filePath: string): Promise<Buffer | null> {
  try {
    const file = oldBucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      log(`File not found in storage: ${filePath}`, 'warn');
      return null;
    }
    
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    log(`Failed to download from storage: ${filePath} - ${error}`, 'error');
    return null;
  }
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${R2_CONFIG.publicUrl}/${key}`;
}

// ============ MIGRATION FUNCTIONS ============

async function migrateProductImages(): Promise<void> {
  log('Starting image migration from Firebase Storage to R2...', 'info');
  
  // Get all products from new database
  const productsSnapshot = await newDb.collection('products').get();
  
  let totalProducts = 0;
  let productsWithImages = 0;
  let totalImages = 0;
  let migratedImages = 0;
  let failedImages = 0;
  
  for (const doc of productsSnapshot.docs) {
    totalProducts++;
    const product = doc.data();
    const productId = doc.id;
    
    // Check if already has R2 images
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage.includes('r2.dev') || firstImage.includes(R2_CONFIG.publicUrl)) {
        log(`Product ${productId} already has R2 images, skipping`, 'info');
        continue;
      }
    }
    
    // Find corresponding old product
    const oldProductsQuery = await oldDb.collection('anuncios')
      .where('titulo', '==', product.title)
      .limit(1)
      .get();
    
    if (oldProductsQuery.empty) {
      log(`No matching old product found for: ${product.title}`, 'warn');
      continue;
    }
    
    const oldProduct = oldProductsQuery.docs[0].data();
    const oldImages = oldProduct.imagenes || [];
    
    if (oldImages.length === 0) {
      continue;
    }
    
    productsWithImages++;
    const newImageUrls: string[] = [];
    
    for (let i = 0; i < oldImages.length; i++) {
      totalImages++;
      const oldUrl = oldImages[i];
      
      // Extract storage path from URL
      const storagePath = extractStoragePath(oldUrl);
      if (!storagePath) {
        log(`Could not extract path from URL: ${oldUrl}`, 'warn');
        failedImages++;
        continue;
      }
      
      try {
        // Download from Firebase Storage
        const imageBuffer = await downloadFromStorage(storagePath);
        if (!imageBuffer) {
          failedImages++;
          continue;
        }
        
        // Determine content type
        const extension = storagePath.split('.').pop()?.toLowerCase() || 'jpg';
        const contentType = extension === 'png' ? 'image/png' : 
                           extension === 'webp' ? 'image/webp' : 'image/jpeg';
        
        // Upload to R2
        const r2Key = `products/${productId}/${i + 1}.${extension}`;
        const newUrl = await uploadToR2(imageBuffer, r2Key, contentType);
        
        newImageUrls.push(newUrl);
        migratedImages++;
        log(`Migrated image ${i + 1}/${oldImages.length} for product "${product.title}"`, 'success');
        
      } catch (error) {
        log(`Failed to migrate image: ${error}`, 'error');
        failedImages++;
      }
    }
    
    // Update product with new image URLs
    if (newImageUrls.length > 0) {
      await newDb.collection('products').doc(productId).update({
        images: newImageUrls,
      });
      log(`Updated product "${product.title}" with ${newImageUrls.length} images`, 'success');
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n========================================');
  console.log('  IMAGE MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`Total products: ${totalProducts}`);
  console.log(`Products with images: ${productsWithImages}`);
  console.log(`Total images: ${totalImages}`);
  console.log(`Successfully migrated: ${migratedImages}`);
  console.log(`Failed: ${failedImages}`);
  console.log('========================================\n');
}

// ============ MAIN EXECUTION ============

async function main() {
  console.log('\n========================================');
  console.log('  Image Migration: Firebase Storage → R2');
  console.log('========================================\n');
  
  // Verify R2 config
  if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    console.error('❌ Missing R2 configuration in environment variables');
    process.exit(1);
  }
  
  try {
    await migrateProductImages();
    
    console.log('\n✅ Image migration complete!\n');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await oldApp.delete();
    await newApp.delete();
    process.exit(0);
  }
}

// Run
main();
