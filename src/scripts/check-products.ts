import * as admin from 'firebase-admin';

const creds = {
  projectId: 'vindel-a7069',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({ credential: admin.credential.cert(creds as admin.ServiceAccount) });
const db = admin.firestore();

async function check() {
  // Get one migrated product (has 'active' field)
  const q1 = await db.collection('products').where('active', '==', true).limit(1).get();
  if (q1.docs.length > 0) {
    console.log('=== MIGRATED PRODUCT STRUCTURE ===');
    console.log(JSON.stringify(q1.docs[0].data(), null, 2));
  }
  
  // Get one original product (has 'sold' field) 
  const q2 = await db.collection('products').where('sold', '==', false).limit(1).get();
  if (q2.docs.length > 0) {
    console.log('\n=== ORIGINAL PRODUCT STRUCTURE ===');
    console.log(JSON.stringify(q2.docs[0].data(), null, 2));
  }
  
  // Count products by structure
  const allProducts = await db.collection('products').get();
  let withSold = 0;
  let withActive = 0;
  let withBoth = 0;
  let withNeither = 0;
  
  allProducts.docs.forEach(doc => {
    const data = doc.data();
    const hasSold = 'sold' in data;
    const hasActive = 'active' in data;
    
    if (hasSold && hasActive) withBoth++;
    else if (hasSold) withSold++;
    else if (hasActive) withActive++;
    else withNeither++;
  });
  
  console.log('\n=== PRODUCT COUNTS ===');
  console.log('Total products:', allProducts.size);
  console.log('With sold field only:', withSold);
  console.log('With active field only:', withActive);
  console.log('With both:', withBoth);
  console.log('With neither:', withNeither);
  
  process.exit(0);
}

check();
