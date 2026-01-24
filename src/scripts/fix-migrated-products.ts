/**
 * Fix Migrated Products: Add missing fields to normalize with existing products
 * 
 * Run with: npx tsx --env-file=.env.local src/scripts/fix-migrated-products.ts
 */

import * as admin from 'firebase-admin';

const creds = {
  projectId: 'vindel-a7069',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({ credential: admin.credential.cert(creds as admin.ServiceAccount) });
const db = admin.firestore();

async function fixMigratedProducts() {
  console.log('🔧 Fixing migrated products...\n');
  
  // Get all products with 'active' field (migrated products)
  const allProducts = await db.collection('products').get();
  
  let fixed = 0;
  let skipped = 0;
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of allProducts.docs) {
    const data = doc.data();
    
    // Skip if already has 'sold' field (original products)
    if ('sold' in data) {
      skipped++;
      continue;
    }
    
    // This is a migrated product, add missing fields
    const updates: Record<string, any> = {};
    
    // Convert 'active' to 'sold' (active=true means sold=false)
    if ('active' in data) {
      updates.sold = data.active === false; // If active=false, then sold=true
      updates.reserved = false;
    } else {
      updates.sold = false;
      updates.reserved = false;
    }
    
    // Add status field for moderation
    updates.status = 'approved'; // Auto-approve migrated products
    
    // Add updatedAt if missing
    if (!data.updatedAt) {
      updates.updatedAt = data.publishedAt || admin.firestore.Timestamp.now();
    }
    
    // Add image field (first image URL) if missing
    if (!data.image && data.images && data.images.length > 0) {
      updates.image = data.images[0];
    }
    
    // Add seller object if missing
    if (!data.seller && data.sellerId) {
      updates.seller = {
        id: data.sellerId,
        name: data.sellerName || 'Utilizator',
        rating: 0,
        reviews: 0,
        avatar: '',
        joined: '2025',
      };
    }
    
    // Clean up old fields
    updates.active = admin.firestore.FieldValue.delete();
    
    batch.update(doc.ref, updates);
    batchCount++;
    fixed++;
    
    console.log(`✅ Fixed: ${data.title}`);
    
    // Commit batch every 400 operations (limit is 500)
    if (batchCount >= 400) {
      await batch.commit();
      console.log(`\n📦 Committed batch of ${batchCount} updates\n`);
      batchCount = 0;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`\n📦 Committed final batch of ${batchCount} updates\n`);
  }
  
  console.log('\n========================================');
  console.log('  FIX COMPLETE');
  console.log('========================================');
  console.log(`Fixed: ${fixed} products`);
  console.log(`Skipped: ${skipped} (already correct)`);
  console.log('========================================\n');
  
  process.exit(0);
}

fixMigratedProducts().catch(console.error);
