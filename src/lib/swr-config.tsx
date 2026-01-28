'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// ============================================
// CACHE UTILITIES
// ============================================

const CACHE_PREFIX = 'vindu-cache-';
const CACHE_VERSION = 'v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos de TTL global

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  version: string;
}

// Función para sincronizar SWR cache -> sessionStorage
export function persistToStorage(key: string, data: unknown) {
  if (typeof window === 'undefined' || !data) return;
  
  // Solo persistir claves importantes
  const persistKeys = [
    'home-products', 
    'product-', 
    'user-profile-',
    'my-products-',      // Productos del usuario (perfil)
    'favorites-',        // IDs de favoritos
    'favorite-products-', // Productos favoritos completos
    'notifications-',    // Notificaciones
  ];
  const shouldPersist = persistKeys.some(pk => key.startsWith(pk));
  
  if (!shouldPersist) return;
  
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded - limpiar entradas viejas
    try {
      const keys = Object.keys(sessionStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .sort();
      // Eliminar las 5 entradas más antiguas
      keys.slice(0, 5).forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }
}

// Función para leer del caché persistido
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    
    const entry: CacheEntry<T> = JSON.parse(raw);
    
    // Verificar versión y TTL
    if (entry.version !== CACHE_VERSION || Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

// Verificar si hay caché válido
export function hasValidCachedData(key: string): boolean {
  return getFromStorage(key) !== null;
}

// Invalidar caché específico
export function invalidateCache(key: string) {
  if (typeof window === 'undefined') return;
  
  try {
    // Invalidar entradas que coincidan con el patrón
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(`${CACHE_PREFIX}${key}`))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
}

// Limpiar todo el caché
export function clearAllCache() {
  if (typeof window === 'undefined') return;
  
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
}

// ============================================
// CONFIGURACIÓN GLOBAL DE SWR
// ============================================

const swrConfig = {
  // Comportamiento de revalidación
  revalidateOnFocus: false,          // No revalidar al volver a la pestaña
  revalidateOnReconnect: true,       // Revalidar al reconectar
  revalidateIfStale: true,           // Revalidar datos stale en background
  
  // Deduplicación y throttling
  dedupingInterval: 30000,           // 30s entre peticiones duplicadas
  focusThrottleInterval: 60000,      // 1 min throttle para focus
  
  // Manejo de errores
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  
  // Comportamiento de datos
  keepPreviousData: true,            // Mantener datos mientras se recarga
  suspense: false,                   // No usar Suspense
  
  // Callback para persistir datos automáticamente
  onSuccess: (data: unknown, key: string) => {
    persistToStorage(key, data);
  },
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

export default swrConfig;
