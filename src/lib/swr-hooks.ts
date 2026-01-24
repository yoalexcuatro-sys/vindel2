import useSWR, { mutate } from 'swr';
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
import { Product, PromotionType, getProduct } from './products-service';
import { 
  hasValidCachedData,
  invalidateCache,
  clearAllCache 
} from './swr-config';

// ============================================
// FETCHERS
// ============================================

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

// Fetcher para productos home - simplificado, el caché lo maneja SWRConfig
async function fetchHomeProducts(): Promise<Product[]> {
  // El caché ahora lo maneja el provider de SWR automáticamente
  // Solo hacemos el fetch real a Firebase
  const products = await fetchHomeProductsFromFirebase();
  return products;
}

// Fetch desde Firebase
async function fetchHomeProductsFromFirebase(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('sold', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(200)
  );
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  // Filtrar solo aprobados o auto-aprobados y ordenar con promocionados primero
  const approvedProducts = products.filter(isProductApproved);
  return sortProductsWithPromotedFirst(approvedProducts).slice(0, 150);
}

// Fetcher para un producto individual - soporta IDs cortos de 8 caracteres
async function fetchProduct(id: string): Promise<Product | null> {
  // Usar getProduct que soporta tanto IDs completos como IDs cortos (8 chars)
  return await getProduct(id);
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
export interface UserProfile {
  id: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  phone?: string;
  location?: string;
  rating?: number | { average?: number; count?: number };
  reviewsCount?: number;
  createdAt?: any;
  // Account type
  accountType?: 'personal' | 'business';
  // Business fields
  businessName?: string;
  cui?: string;
  nrRegistruComert?: string;
  adresaSediu?: string;
  oras?: string;
  judet?: string;
  codPostal?: string;
  tara?: string;
  reprezentantLegal?: string;
  telefonFirma?: string;
  emailFirma?: string;
  website?: string;
  // Privacy settings
  settings?: {
    profileVisible?: boolean;   // Default: true
    showPhone?: boolean;        // Default: true
    showOnline?: boolean;       // Default: true
  };
  // Follow stats
  stats?: {
    followers?: number;
    following?: number;
    selling?: number;
    sold?: number;
    sales?: number;
    purchases?: number;
    shipments?: number;
  };
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

  // Ordenar con productos promocionados primero
  return sortProductsWithPromotedFirst(products);
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para productos del home
 * Caché: sessionStorage + SWR para carga instantánea
 */
export function useHomeProducts() {
  // El cache provider de SWRConfig maneja la persistencia automáticamente
  // Los datos se restauran del sessionStorage al iniciar
  return useSWR('home-products', fetchHomeProducts, {
    revalidateOnFocus: false,
    revalidateOnMount: true,        // Siempre verificar datos frescos
    dedupingInterval: 30000,        // 30s entre peticiones duplicadas
    refreshInterval: 120000,        // Refresca cada 2 min en background
    keepPreviousData: true,         // Mantiene datos mientras recarga (evita flash)
    suspense: false,
  });
}

/**
 * Hook para un producto individual
 * El cache provider persiste automáticamente
 */
export function useProduct(id: string | null) {
  return useSWR(
    id ? `product-${id}` : null,
    () => id ? fetchProduct(id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000,     // 2 min entre peticiones iguales
      revalidateIfStale: true,      // Revalidar en background si está stale
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

// ============================================
// UTILIDADES DE CACHÉ
// ============================================

/**
 * Invalidar caché de productos del home
 * Usar después de crear/editar/eliminar un producto
 */
export async function invalidateProductsCache() {
  // Invalidar en sessionStorage
  invalidateCache('home-products');
  
  // Forzar revalidación en SWR
  await mutate('home-products');
}

/**
 * Invalidar caché de un producto específico
 */
export async function invalidateProductCache(productId: string) {
  invalidateCache(`product-${productId}`);
  await mutate(`product-${productId}`);
}

/**
 * Invalidar caché de perfil de usuario
 * Usar después de actualizar la configuración del perfil
 */
export async function invalidateUserProfileCache(userId: string) {
  invalidateCache(`user-profile-${userId}`);
  await mutate(`user-profile-${userId}`);
}

/**
 * Invalidar todos los caches (logout, cambios mayores)
 */
export function clearCache() {
  clearAllCache();
}

/**
 * Prefetch de un producto (llamar en hover para carga instantánea)
 */
export async function prefetchProduct(id: string) {
  // Precargar en el caché de SWR
  await mutate(`product-${id}`, () => fetchProduct(id), { revalidate: false });
}

// ============================================
// ADMIN HOOKS (con caché persistente)
// ============================================

interface AdminUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  role?: 'user' | 'admin';
  status?: 'active' | 'banned';
  accountType?: 'personal' | 'business';
  phone?: string;
  location?: string;
  companyName?: string;
  promotionEnabled?: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalMessages: number;
  totalViews: number;
  dbStatus: string;
  apiLatency: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    time: string;
  }>;
}

// Fetcher para usuarios del admin
async function fetchAdminUsers(): Promise<AdminUser[]> {
  const q = query(collection(db, 'users'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUser));
}

// Fetcher para estadísticas del admin
async function fetchAdminStats(): Promise<AdminStats> {
  const startTime = performance.now();
  
  const [usersSnap, productsSnap, messagesSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), limit(1000))),
    getDocs(query(collection(db, 'products'), limit(1000))),
    getDocs(query(collection(db, 'conversations'), limit(1000)))
  ]);
  
  const apiLatency = Math.round(performance.now() - startTime);
  
  // Calcular vistas totales
  let totalViews = 0;
  productsSnap.docs.forEach(doc => {
    const data = doc.data();
    totalViews += data.views || 0;
  });
  
  // Actividad reciente
  const recentActivity: AdminStats['recentActivity'] = [];
  
  // Últimos productos (anuncios nuevos)
  const recentProducts = productsSnap.docs
    .filter(doc => doc.data().createdAt)
    .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
    .slice(0, 5);
  
  recentProducts.forEach(doc => {
    const data = doc.data();
    recentActivity.push({
      id: `product-${doc.id}`,
      type: 'product',
      title: data.title || 'Anunț nou',
      time: data.createdAt?.seconds 
        ? new Date(data.createdAt.seconds * 1000).toISOString()
        : new Date().toISOString()
    });
  });
  
  // Últimos usuarios registrados
  const recentUsers = usersSnap.docs
    .filter(doc => doc.data().createdAt)
    .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
    .slice(0, 5);
  
  recentUsers.forEach(doc => {
    const data = doc.data();
    recentActivity.push({
      id: `user-${doc.id}`,
      type: 'user',
      title: data.displayName || data.email?.split('@')[0] || 'Utilizator nou',
      time: data.createdAt?.seconds 
        ? new Date(data.createdAt.seconds * 1000).toISOString()
        : new Date().toISOString()
    });
  });
  
  // Ordenar por tiempo (más reciente primero)
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  
  return {
    totalUsers: usersSnap.size,
    totalProducts: productsSnap.size,
    totalMessages: messagesSnap.size,
    totalViews,
    dbStatus: 'online',
    apiLatency,
    recentActivity: recentActivity.slice(0, 5)
  };
}

// Fetcher para productos del admin (todos, sin filtro de aprobación)
async function fetchAdminProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

/**
 * Hook para usuarios del admin con caché
 */
export function useAdminUsers() {
  return useSWR<AdminUser[]>(
    'admin-users',
    fetchAdminUsers,
    {
      revalidateOnFocus: false,     // No recargar al volver a la pestaña
      revalidateOnReconnect: false, // No recargar al reconectar
      dedupingInterval: 60000,      // Deduplicar llamadas por 1 minuto
      refreshInterval: 0,           // No refrescar automáticamente
      keepPreviousData: true,       // Mantener datos anteriores
    }
  );
}

/**
 * Hook para estadísticas del admin con caché
 */
export function useAdminStats() {
  return useSWR<AdminStats>(
    'admin-stats',
    fetchAdminStats,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,      // Deduplicar por 30 segundos
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );
}

/**
 * Hook para productos del admin con caché
 */
export function useAdminProducts() {
  return useSWR<Product[]>(
    'admin-products',
    fetchAdminProducts,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );
}

/**
 * Invalidar caché del admin
 */
export function invalidateAdminCache() {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('swr-invalidate', { detail: 'admin' });
    window.dispatchEvent(event);
  }
}

// ============================================
// FAVORITES HOOKS
// ============================================

import { getUserFavoriteIds } from './favorites-service';
import { getNotifications, Notification } from './notifications-service';

/**
 * Hook para obtener IDs de favoritos del usuario
 * Optimizado: revalida raramente, usa caché agresivo
 */
export function useUserFavorites(userId: string | null) {
  return useSWR<string[]>(
    userId ? `favorites-${userId}` : null,
    () => getUserFavoriteIds(userId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minuto de deduplicación
      revalidateIfStale: false, // No revalidar automáticamente
    }
  );
}

// ============================================
// PROFILE HOOKS (con caché persistente)
// ============================================

/**
 * Hook para productos del usuario actual (perfil)
 * Caché agresivo para navegación instantánea entre tabs
 */
export function useMyProducts(userId: string | null) {
  return useSWR<Product[]>(
    userId ? `my-products-${userId}` : null,
    async () => {
      if (!userId) return [];
      const q = query(
        collection(db, 'products'),
        where('sellerId', '==', userId),
        orderBy('publishedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000,     // 2 min deduplicación
      revalidateIfStale: false,     // Solo revalidar manualmente
      keepPreviousData: true,
    }
  );
}

/**
 * Hook para notificaciones del usuario
 * Con caché agresivo para evitar recargas y destellos
 */
export function useNotifications(userId: string | null, maxCount: number = 30) {
  return useSWR<Notification[]>(
    userId ? `notifications-${userId}` : null,
    () => getNotifications(userId!, maxCount),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,     // No revalidar datos stale automáticamente
      dedupingInterval: 120000,     // 2 min entre peticiones iguales
      refreshInterval: 0,           // No auto-refresh
      keepPreviousData: true,       // Mantener datos anteriores
    }
  );
}

/**
 * Invalidar caché de productos del usuario
 */
export async function invalidateMyProductsCache(userId: string) {
  invalidateCache(`my-products-${userId}`);
  await mutate(`my-products-${userId}`);
}

/**
 * Invalidar caché de notificaciones
 */
export async function invalidateNotificationsCache(userId: string) {
  invalidateCache(`notifications-${userId}`);
  await mutate(`notifications-${userId}`);
}

/**
 * Hook para obtener productos favoritos completos
 */
export function useFavoriteProducts(userId: string | null) {
  const { data: favoriteIds } = useUserFavorites(userId);
  
  return useSWR<Product[]>(
    favoriteIds && favoriteIds.length > 0 ? `favorite-products-${userId}` : null,
    async () => {
      if (!favoriteIds || favoriteIds.length === 0) return [];
      
      // Cargar productos favoritos
      const products: Product[] = [];
      for (const productId of favoriteIds) {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          products.push({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      }
      return products;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000,     // 2 min - más largo para favoritos
      keepPreviousData: true,
    }
  );
}

/**
 * Invalidar caché de favoritos
 */
export async function invalidateFavoritesCache(userId: string) {
  invalidateCache(`favorites-${userId}`);
  invalidateCache(`favorite-products-${userId}`);
  await mutate(`favorites-${userId}`);
  await mutate(`favorite-products-${userId}`);
}

// ============================================
// FOLLOWERS HOOKS
// ============================================

import { isFollowing, canViewProfile } from './followers-service';

/**
 * Hook para verificar si el usuario actual sigue a otro usuario
 */
export function useIsFollowing(followerId: string | null, followedId: string | null) {
  return useSWR<boolean>(
    followerId && followedId ? `following-${followerId}-${followedId}` : null,
    () => followerId && followedId ? isFollowing(followerId, followedId) : false,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
}

/**
 * Hook para verificar si el usuario actual puede ver un perfil
 */
export function useCanViewProfile(viewerId: string | null, profileOwnerId: string | null) {
  return useSWR<{ canView: boolean; reason: 'public' | 'owner' | 'follower' | 'private' }>(
    profileOwnerId ? `can-view-profile-${viewerId || 'anon'}-${profileOwnerId}` : null,
    () => profileOwnerId ? canViewProfile(viewerId, profileOwnerId) : { canView: false, reason: 'private' as const },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
}

/**
 * Invalidar caché de seguimiento
 */
export async function invalidateFollowingCache(followerId: string, followedId: string) {
  invalidateCache(`following-${followerId}-${followedId}`);
  invalidateCache(`can-view-profile-${followerId}-${followedId}`);
  await mutate(`following-${followerId}-${followedId}`);
  await mutate(`can-view-profile-${followerId}-${followedId}`);
}
