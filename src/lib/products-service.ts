import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  location: string;
  description: string;
  condition: string;
  category: string;
  subcategory?: string;
  customFields?: Record<string, string>;
  views: number;
  reserved: boolean;
  sold: boolean;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    avatar: string;
    joined: string;
  };
  publishedAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProductInput = Omit<Product, 'id' | 'publishedAt' | 'updatedAt' | 'views' | 'reserved' | 'sold'>;

const PRODUCTS_COLLECTION = 'products';

// Create a new product
export async function createProduct(productData: ProductInput): Promise<string> {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    views: 0,
    reserved: false,
    sold: false,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Get a single product by ID
export async function getProduct(productId: string): Promise<Product | null> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

// Update a product
export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a product
export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

// Increment product views
export async function incrementProductViews(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const currentViews = docSnap.data().views || 0;
    await updateDoc(docRef, { views: currentViews + 1 });
  }
}

// Get all products with optional filters
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sellerId?: string;
  searchQuery?: string;
  excludeSold?: boolean;
}

export interface ProductsResult {
  products: Product[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function getProducts(
  filters: ProductFilters = {},
  pageSize: number = 20,
  lastDocument?: QueryDocumentSnapshot<DocumentData>
): Promise<ProductsResult> {
  let q = query(collection(db, PRODUCTS_COLLECTION));

  // Apply filters
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.subcategory) {
    q = query(q, where('subcategory', '==', filters.subcategory));
  }
  if (filters.location) {
    q = query(q, where('location', '==', filters.location));
  }
  if (filters.condition) {
    q = query(q, where('condition', '==', filters.condition));
  }
  if (filters.sellerId) {
    q = query(q, where('sellerId', '==', filters.sellerId));
  }
  if (filters.excludeSold !== false) {
    q = query(q, where('sold', '==', false));
  }

  // Order by date
  q = query(q, orderBy('publishedAt', 'desc'));

  // Pagination
  if (lastDocument) {
    q = query(q, startAfter(lastDocument));
  }
  q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more

  const querySnapshot = await getDocs(q);
  const products: Product[] = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  let index = 0;

  querySnapshot.forEach((doc) => {
    if (index < pageSize) {
      products.push({ id: doc.id, ...doc.data() } as Product);
      lastDoc = doc;
    }
    index++;
  });

  // Apply client-side filters that Firestore doesn't support well
  let filteredProducts = products;
  
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
  }
  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }

  return {
    products: filteredProducts,
    lastDoc,
    hasMore: querySnapshot.size > pageSize,
  };
}

// Get products by user
export async function getUserProducts(userId: string): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('sellerId', '==', userId),
    orderBy('publishedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const products: Product[] = [];

  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });

  return products;
}

// Get recent products
export async function getRecentProducts(count: number = 12): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('sold', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(count)
  );

  const querySnapshot = await getDocs(q);
  const products: Product[] = [];

  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });

  return products;
}

// Mark product as sold
export async function markProductAsSold(productId: string): Promise<void> {
  await updateProduct(productId, { sold: true });
}

// Toggle product reserved status
export async function toggleProductReserved(productId: string): Promise<void> {
  const product = await getProduct(productId);
  if (product) {
    await updateProduct(productId, { reserved: !product.reserved });
  }
}
