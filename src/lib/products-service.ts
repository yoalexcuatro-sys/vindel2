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
  documentId,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  deleteField,
  increment,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { createNotification } from './notifications-service';

// Tipos de promoción disponibles
export type PromotionType = 'zilnic' | 'saptamanal' | 'lunar';

export interface Product {
  id: string;
  title: string;
  price: number;
  currency?: 'LEI' | 'EUR';
  negotiable?: boolean;
  image: string;
  images: string[];
  // Thumbnails (400px) for fast loading in lists
  thumbImages?: string[];
  location: string;
  description: string;
  condition: string;
  category: string;
  subcategory?: string;
  customFields?: Record<string, string>;
  deliveryType?: 'personal' | 'shipping' | 'both';
  views: number;
  reserved: boolean;
  sold: boolean;
  status: 'pending' | 'approved' | 'rejected'; // Estado de moderación
  pendingUntil?: Timestamp; // Auto-aprobación después de este tiempo
  rejectionReason?: string; // Motivo de rechazo si aplica
  // Campos de promoción
  promoted?: boolean;
  promotionType?: PromotionType;
  promotionStart?: Timestamp;
  promotionEnd?: Timestamp;
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
  lastEditedAt?: Timestamp; // Track when user last edited (24h restriction)
}

// ProductInput omite campos que se generan automáticamente
export type ProductInput = Omit<Product, 'id' | 'publishedAt' | 'updatedAt' | 'views' | 'reserved' | 'sold' | 'status' | 'pendingUntil' | 'rejectionReason'>;

const PRODUCTS_COLLECTION = 'products';

// Helper: verificar si un producto está activamente promocionado
function isActivelyPromoted(product: Product): boolean {
  if (!product.promoted || !product.promotionEnd) return false;
  
  const now = new Date();
  let endDate: Date;
  
  if (product.promotionEnd instanceof Timestamp) {
    endDate = product.promotionEnd.toDate();
  } else if (typeof product.promotionEnd === 'object' && 'seconds' in product.promotionEnd) {
    endDate = new Date((product.promotionEnd as any).seconds * 1000);
  } else {
    return false;
  }
  
  return endDate > now;
}

// Helper: obtener prioridad de promoción (VIP > Premium > Promovat > sin promoción)
function getPromotionPriority(product: Product): number {
  if (!isActivelyPromoted(product)) return 0;
  
  switch (product.promotionType) {
    case 'lunar': return 3;      // VIP - máxima prioridad
    case 'saptamanal': return 2; // Premium
    case 'zilnic': return 1;     // Promovat
    default: return 0;
  }
}

// Helper: ordenar productos con promocionados primero
function sortProductsWithPromotedFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const priorityA = getPromotionPriority(a);
    const priorityB = getPromotionPriority(b);
    
    // Primero por prioridad de promoción (mayor primero)
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }
    
    // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
    const dateA = a.publishedAt instanceof Timestamp ? a.publishedAt.toDate() : new Date((a.publishedAt as any)?.seconds * 1000 || 0);
    const dateB = b.publishedAt instanceof Timestamp ? b.publishedAt.toDate() : new Date((b.publishedAt as any)?.seconds * 1000 || 0);
    
    return dateB.getTime() - dateA.getTime();
  });
}

// Create a new product (starts in pending, auto-approves after 20 min)
export async function createProduct(productData: ProductInput): Promise<string> {
  // Calcular tiempo de auto-aprobación (20 minutos)
  const pendingUntil = new Date(Date.now() + 20 * 60 * 1000); // 20 minutos
  const now = Timestamp.now(); // Usar Timestamp.now() en lugar de serverTimestamp() para disponibilidad inmediata
  
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    views: 0,
    reserved: false,
    sold: false,
    status: 'pending', // Empieza pendiente de moderación
    pendingUntil: Timestamp.fromDate(pendingUntil), // Auto-aprueba después de 20 min
    publishedAt: now,
    updatedAt: now,
  });
  
  // Notificar a los seguidores del vendedor (en background, no bloqueante)
  notifyFollowersOfNewProduct(
    productData.sellerId,
    docRef.id,
    productData.title,
    productData.images?.[0] || productData.image,
    productData.seller?.name || 'Un vendedor'
  ).catch(err => console.error('Error notifying followers:', err));
  
  return docRef.id;
}

// Get a single product by ID (supports full ID or short 8-char ID)
export async function getProduct(productId: string): Promise<Product | null> {
  // 1. Try direct lookup (fastest) - assumes full ID
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }

  // 2. If not found and ID is short (e.g. 8 chars from URL), search by ID prefix
  if (productId.length < 20) { 
      try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where(documentId(), '>=', productId),
            where(documentId(), '<=', productId + '\uf8ff'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const d = querySnapshot.docs[0];
            return { id: d.id, ...d.data() } as Product;
        }
      } catch (e) {
          console.error("Error searching by short ID", e);
      }
  }

  return null;
}

// Update a product
export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
    lastEditedAt: Timestamp.now(),
  });
}

// Delete a product
export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

// Increment product views (only counts unique visitors)
export async function incrementProductViews(productId: string, visitorId?: string): Promise<boolean> {
  // Generar ID único del visitante (userId si está logueado, o fingerprint del navegador)
  const getVisitorFingerprint = (): string => {
    if (typeof window === 'undefined') return '';
    
    // Si hay visitorId (userId), usarlo
    if (visitorId) return visitorId;
    
    // Para visitantes anónimos, crear/obtener un fingerprint único
    try {
      let fingerprint = localStorage.getItem('visitor_fingerprint');
      if (!fingerprint) {
        fingerprint = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitor_fingerprint', fingerprint);
      }
      return fingerprint;
    } catch {
      return 'anon_' + Math.random().toString(36).substring(2);
    }
  };
  
  const fingerprintId = getVisitorFingerprint();
  if (!fingerprintId) return false;
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  try {
    // Verificar si este visitante ya vio este producto
    const viewedKey = `viewed_products`;
    let viewedProducts: Record<string, number> = {};
    
    try {
      viewedProducts = JSON.parse(localStorage.getItem(viewedKey) || '{}');
    } catch {
      viewedProducts = {};
    }
    
    // Si ya lo vio en las últimas 24h, no incrementar
    const lastViewed = viewedProducts[productId];
    if (lastViewed && (now - lastViewed) < twentyFourHours) {
      return false;
    }
    
    // Limpiar entradas antiguas (más de 24h) para evitar que crezca indefinidamente
    const cleanedProducts: Record<string, number> = {};
    let entryCount = 0;
    const maxEntries = 100; // Limitar a 100 productos más recientes
    
    // Ordenar por timestamp y quedarse solo con los más recientes
    const entries = Object.entries(viewedProducts)
      .filter(([, timestamp]) => (now - timestamp) < twentyFourHours)
      .sort((a, b) => b[1] - a[1]) // Más recientes primero
      .slice(0, maxEntries - 1); // Dejar espacio para el nuevo
    
    for (const [id, timestamp] of entries) {
      cleanedProducts[id] = timestamp;
      entryCount++;
    }
    
    // Añadir el producto actual
    cleanedProducts[productId] = now;
    
    // Guardar en localStorage con manejo de errores
    try {
      localStorage.setItem(viewedKey, JSON.stringify(cleanedProducts));
    } catch (e) {
      // Si falla por quota, limpiar todo y empezar de nuevo
      localStorage.removeItem(viewedKey);
      localStorage.setItem(viewedKey, JSON.stringify({ [productId]: now }));
    }
    
    // Incrementar contador en Firestore solo si hay usuario autenticado
    const auth = getAuth();
    if (auth.currentUser) {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(docRef, { views: increment(1) });
    }
    return true;
  } catch (error) {
    // Silently fail - view increment is not critical
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('View increment skipped:', error instanceof Error ? error.message : 'unknown error');
    }
  }
  
  return false;
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

  // Ordenar con productos promocionados primero
  filteredProducts = sortProductsWithPromotedFirst(filteredProducts);

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

// Helper: Verificar si un producto está efectivamente aprobado
// (aprobado por admin O auto-aprobado por tiempo)
export function isProductApproved(product: Product): boolean {
  if (product.status === 'approved') return true;
  if (product.status === 'rejected') return false;
  
  // Si está pending, verificar si pasó el tiempo de auto-aprobación
  if (product.status === 'pending' && product.pendingUntil) {
    const now = new Date();
    const pendingUntil = product.pendingUntil.toDate();
    return now >= pendingUntil;
  }
  
  // Productos antiguos sin status se consideran aprobados
  if (!product.status) return true;
  
  return false;
}

// Get recent products (solo aprobados o auto-aprobados)
export async function getRecentProducts(count: number = 12): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('sold', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(count * 2) // Traer más para filtrar pending
  );

  const querySnapshot = await getDocs(q);
  const products: Product[] = [];

  querySnapshot.forEach((doc) => {
    const product = { id: doc.id, ...doc.data() } as Product;
    // Solo incluir productos aprobados o auto-aprobados
    if (isProductApproved(product)) {
      products.push(product);
    }
  });

  return products.slice(0, count);
}

// ========== FUNCIONES DE MODERACIÓN ==========

// Aprobar un producto (admin)
export async function approveProduct(productId: string): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, { 
    status: 'approved',
    pendingUntil: deleteField(), // Eliminar el campo
    updatedAt: serverTimestamp()
  });
}

// Rechazar un producto (admin)
export async function rejectProduct(productId: string, reason: string): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, { 
    status: 'rejected',
    rejectionReason: reason,
    pendingUntil: deleteField(), // Eliminar el campo
    updatedAt: serverTimestamp()
  });
}

// Obtener productos pendientes de moderación (para admin)
export async function getPendingProducts(): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('publishedAt', 'asc') // Los más antiguos primero
  );

  const querySnapshot = await getDocs(q);
  const products: Product[] = [];
  const now = new Date();

  querySnapshot.forEach((doc) => {
    const product = { id: doc.id, ...doc.data() } as Product;
    // Solo incluir los que aún no se auto-aprobaron
    if (product.pendingUntil && product.pendingUntil.toDate() > now) {
      products.push(product);
    }
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
/**
 * Notificar a todos los seguidores de un vendedor cuando publica un nuevo producto
 * Esta función se ejecuta en background sin bloquear la creación del producto
 */
async function notifyFollowersOfNewProduct(
  sellerId: string,
  productId: string,
  productTitle: string,
  productImage: string | undefined,
  sellerName: string
): Promise<void> {
  try {
    // Obtener todos los seguidores del vendedor
    const followersQuery = query(
      collection(db, 'followers'),
      where('followedId', '==', sellerId)
    );
    
    const snapshot = await getDocs(followersQuery);
    
    if (snapshot.empty) return;
    
    // Crear notificación para cada seguidor (máximo 100 para evitar sobrecarga)
    const followers = snapshot.docs.slice(0, 100);
    
    const notificationPromises = followers.map(followerDoc => {
      const followerId = followerDoc.data().followerId;
      
      return createNotification({
        userId: followerId,
        type: 'new_product_followed',
        title: 'Anunț nou',
        message: `${sellerName} a publicat un anunț nou: ${productTitle}`,
        link: `/anunturi/_/${productId}`, // Link temporal, se actualizará con categoría real
        metadata: {
          productId,
          productTitle,
          productImage,
          sellerId,
          sellerName
        }
      });
    });
    
    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error('Error notifying followers of new product:', error);
  }
}