import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  startAfter,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from './products-service';

// ============================================
// FETCHERS
// ============================================

// Helper: Verificar si un producto está aprobado (o auto-aprobado)
function isProductApproved(product: Product): boolean {
  // Aprobado explícitamente
  if (product.status === 'approved') return true;
  
  // Rechazado = no mostrar
  if (product.status === 'rejected') return false;
  
  // Productos antiguos sin status se consideran aprobados
  if (!product.status) return true;
  
  // Si está pending con pendingUntil, verificar si pasó el tiempo
  if (product.status === 'pending' && product.pendingUntil) {
    const now = new Date();
    const pendingUntil = product.pendingUntil.toDate();
    return now >= pendingUntil; // Auto-aprobado si pasó el tiempo
  }
  
  // Pending sin pendingUntil (producto viejo) = no mostrar hasta aprobar manualmente
  if (product.status === 'pending' && !product.pendingUntil) {
    return false;
  }
  
  return false;
}

// Fetcher para productos home (destacados/recientes) - solo aprobados
async function fetchHomeProducts(): Promise<Product[]> {
  // Intentar obtener de caché local primero para carga instantánea
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem('home-products-cache');
    if (cached) {
      try {
        const cachedProducts = JSON.parse(cached);
        // Revalidar en background pero devolver caché inmediatamente
        fetchHomeProductsFromFirebase().then(products => {
          sessionStorage.setItem('home-products-cache', JSON.stringify(products));
        }).catch(() => {});
        return cachedProducts;
      } catch {
        // Si hay error parseando, continuar con fetch normal
      }
    }
  }
  
  const products = await fetchHomeProductsFromFirebase();
  
  // Guardar en caché local
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('home-products-cache', JSON.stringify(products));
    } catch {
      // Ignorar errores de quota
    }
  }
  
  return products;
}

// Fetch desde Firebase sin caché
async function fetchHomeProductsFromFirebase(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('sold', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(40)
  );
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  // Filtrar solo aprobados o auto-aprobados
  return products.filter(isProductApproved).slice(0, 20);
}

// Fetcher para un producto individual con caché local
async function fetchProduct(id: string): Promise<Product | null> {
  // Intentar obtener de caché local primero
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(`product-cache-${id}`);
    if (cached) {
      // Revalidar en background pero devolver caché inmediatamente
      getDoc(doc(db, 'products', id)).then(snapshot => {
        if (snapshot.exists()) {
          sessionStorage.setItem(`product-cache-${id}`, JSON.stringify({ id: snapshot.id, ...snapshot.data() }));
        }
      });
      return JSON.parse(cached);
    }
  }
  
  const docRef = doc(db, 'products', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  
  const product = { id: snapshot.id, ...snapshot.data() } as Product;
  
  // Guardar en caché local
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`product-cache-${id}`, JSON.stringify(product));
  }
  
  return product;
}

// Fetcher para productos de un usuario
async function fetchUserProducts(userId: string): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('sellerId', '==', userId),
    orderBy('publishedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

// Tipo para perfil de usuario público
interface UserProfile {
  id: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  location?: string;
  rating?: number;
  reviewsCount?: number;
  createdAt?: any;
}

// Fetcher para perfil de usuario
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as UserProfile;
}

// Fetcher para búsqueda con filtros
async function fetchSearchProducts(params: {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}): Promise<Product[]> {
  const constraints: QueryConstraint[] = [
    where('sold', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(30)
  ];

  if (params.category) {
    constraints.unshift(where('category', '==', params.category));
  }

  const q = query(collection(db, 'products'), ...constraints);
  const snapshot = await getDocs(q);
  let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  // Filtros client-side para mayor flexibilidad
  if (params.query) {
    const searchLower = params.query.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }

  if (params.minPrice) {
    products = products.filter(p => p.price >= params.minPrice!);
  }

  if (params.maxPrice) {
    products = products.filter(p => p.price <= params.maxPrice!);
  }

  if (params.location) {
    products = products.filter(p => 
      p.location.toLowerCase().includes(params.location!.toLowerCase())
    );
  }

  return products;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para productos del home
 * Caché: sessionStorage + SWR para carga instantánea
 */
export function useHomeProducts() {
  // Intentar obtener datos iniciales de sessionStorage
  const getFallbackData = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('home-products-cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return undefined;
  };

  return useSWR('home-products', fetchHomeProducts, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 60000,        // 1 minuto entre peticiones iguales
    refreshInterval: 300000,        // Refresca cada 5 min en background
    keepPreviousData: true,         // Mantiene datos mientras recarga
    fallbackData: getFallbackData(),
  });
}

/**
 * Hook para un producto individual
 * Caché agresiva para carga instantánea
 */
export function useProduct(id: string | null) {
  return useSWR(
    id ? `product-${id}` : null,
    () => id ? fetchProduct(id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000,     // 2 min entre peticiones iguales
      revalidateIfStale: false,     // No revalidar datos stale
      keepPreviousData: true,       // Mantener datos previos mientras carga
    }
  );
}

/**
 * Hook para productos de un usuario
 */
export function useUserProducts(userId: string | null) {
  return useSWR(
    userId ? `user-products-${userId}` : null,
    () => userId ? fetchUserProducts(userId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

/**
 * Hook para perfil de usuario público
 */
export function useUserProfile(userId: string | null) {
  return useSWR(
    userId ? `user-profile-${userId}` : null,
    () => userId ? fetchUserProfile(userId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,     // 2 min
    }
  );
}

/**
 * Hook para búsqueda con filtros
 */
export function useSearchProducts(params: {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
} | null) {
  const key = params ? `search-${JSON.stringify(params)}` : null;
  
  return useSWR(
    key,
    () => params ? fetchSearchProducts(params) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,       // Mantiene resultados anteriores mientras busca
    }
  );
}

/**
 * Prefetch de producto (llamar en hover para carga instantánea)
 */
export function prefetchProduct(id: string) {
  // Precarga el producto en caché SWR
  const key = `product-${id}`;
  fetchProduct(id).then(data => {
    // SWR automáticamente usa este dato cuando se llame useProduct
    if (typeof window !== 'undefined') {
      (window as any).__SWR_CACHE__?.set(key, data);
    }
  });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Invalidar caché (útil después de crear/editar producto)
 */
export function invalidateProductsCache() {
  if (typeof window !== 'undefined') {
    // Forzar revalidación de productos home
    const event = new CustomEvent('swr-invalidate', { detail: 'home-products' });
    window.dispatchEvent(event);
  }
}
