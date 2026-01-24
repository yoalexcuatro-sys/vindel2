'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Tag, Crown, ChevronRight, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product } from '@/lib/products-service';
import { useHomeProducts } from '@/lib/swr-hooks';
import { Timestamp } from 'firebase/firestore';

// Precargar imágenes de los primeros productos para carga instantánea
function preloadProductImages(products: Product[], count: number = 10) {
  if (typeof window === 'undefined') return;
  
  products.slice(0, count).forEach(product => {
    const img = new window.Image();
    img.src = product.images?.[0] || product.image;
  });
}

// Helper: verificar si un producto está activamente promocionado como VIP o Premium
function isPremiumOrVipProduct(product: Product): boolean {
  if (!product.promoted || !product.promotionEnd) return false;
  if (product.promotionType !== 'lunar' && product.promotionType !== 'saptamanal') return false;
  
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

// Función para mezclar array (Fisher-Yates shuffle) con seed basado en tiempo
function shuffleWithSeed(array: Product[], seed: number): Product[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  
  // Generador de números pseudo-aleatorios con seed
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (currentIndex > 0) {
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}

export default function ProductGrid() {
  const { data: products, isLoading, isValidating, error } = useHomeProducts();
  const [currentTheme, setCurrentTheme] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const [visiblePremiumCount, setVisiblePremiumCount] = useState(10);
  const [rotationSeed, setRotationSeed] = useState(() => Math.floor(Date.now() / 60000)); // Cambia cada minuto
  const preloadedRef = useRef(false);
  
  // Detectar móvil y ajustar cantidad inicial
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // En móvil mostrar 100 productos, en desktop 60
      setVisibleCount(mobile ? 100 : 60);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // DEBUG: Log error if any
  useEffect(() => {
    if (error) {
      console.error('useHomeProducts ERROR:', error);
    }
  }, [error]);
  
  // Rotar productos premium cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationSeed(Math.floor(Date.now() / 60000) + Math.random() * 1000);
    }, 30000); // Rota cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  // Estados para animación - solo aplicar en primera carga real
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasAnimated = useRef(false);
  
  // Filtrar y rotar productos VIP y Premium
  const premiumProducts = useMemo(() => {
    if (!products) return [];
    const filtered = products.filter(isPremiumOrVipProduct);
    // Aplicar rotación/shuffle con el seed actual
    return shuffleWithSeed(filtered, rotationSeed);
  }, [products, rotationSeed]);
  
  // Productos normales (excluyendo VIP/Premium para no duplicar)
  const regularProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => !isPremiumOrVipProduct(p));
  }, [products]);
  
  // Activar animación solo la primera vez que llegan productos
  useEffect(() => {
    if (products && products.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      setShouldAnimate(true);
      
      // Limpiar clase de animación después de completar
      const timer = setTimeout(() => setShouldAnimate(false), 400);
      return () => clearTimeout(timer);
    }
  }, [products]);
  
  // Precargar imágenes de primeros productos cuando llegan
  useEffect(() => {
    if (products && products.length > 0 && !preloadedRef.current) {
      preloadedRef.current = true;
      preloadProductImages(products, 10);
    }
  }, [products]);

  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('user_card_theme');
      const newTheme = saved ? parseInt(saved) : 1;
      setCurrentTheme(newTheme);
    };
    loadTheme();
    
    const handleThemeChange = () => {
      loadTheme();
    };
    
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const handleLoadMore = () => {
    // En móvil cargar 60 más, en desktop 60 más
    setVisibleCount(prev => prev + 60);
  };

  // Usar productos de SWR - mostrar skeletons solo mientras carga sin datos
  const showSkeletons = isLoading && !products;
  const displayProducts = regularProducts;
  const visibleProducts = displayProducts?.slice(0, visibleCount) || [];
  const hasMoreProducts = displayProducts && displayProducts.length > visibleCount;



  // Skeletons para carga - igual que en el buscador
  const renderSkeletons = () => (
    <>
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-3 sm:mb-6 md:mb-8 px-1">
        <div>
          <div className="h-5 sm:h-6 md:h-7 w-28 sm:w-40 md:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-0.5 sm:h-1 w-14 sm:w-16 bg-[#13C1AC]/30 rounded-full mt-1.5"></div>
        </div>
        <div className="h-3 sm:h-4 w-14 sm:w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border border-gray-100 shadow-sm">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-lg sm:rounded-xl mb-1.5 sm:mb-3 animate-pulse"></div>
            <div className="h-2.5 sm:h-4 bg-gray-200 rounded w-3/4 mb-1 sm:mb-2 animate-pulse"></div>
            <div className="h-2 sm:h-3 bg-gray-100 rounded w-1/2 mb-1.5 sm:mb-3 animate-pulse"></div>
            <div className="flex justify-between items-center pt-0.5 sm:pt-2">
              <div className="h-3.5 sm:h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-5 sm:h-8 bg-gray-100 rounded w-10 sm:w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4 md:py-6 bg-gray-50 pb-20 md:pb-6">
      <style jsx>{`
        @keyframes cardFadeIn {
          from { 
            opacity: 0;
            transform: translateY(15px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-card { 
          opacity: 0;
          animation: cardFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .revalidating {
          animation: subtle-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      {showSkeletons ? (
        renderSkeletons()
      ) : !displayProducts || displayProducts.length === 0 ? (
        <div className="py-16 sm:py-20 text-center animate-fadeInUp px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nu există produse încă</h2>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Fii primul care publică ceva.</p>
          <a href="/publish" className="inline-flex items-center px-5 py-2.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-full text-white bg-[#13C1AC] hover:bg-[#0da896] active:scale-95 transition-all shadow-lg shadow-[#13C1AC]/20">
            Publică anunț
          </a>
        </div>
      ) : (
        <div>
          {/* ========== SECCIÓN VIP & PREMIUM ========== */}
          {premiumProducts.length > 0 && (
            <div className="mb-6 sm:mb-10">
              {/* Header VIP & Premium */}
              <div className="flex justify-between items-center mb-3 sm:mb-5 px-1">
                <div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                    Anunțuri promovate
                  </h2>
                  <p className="text-[10px] sm:text-sm text-gray-500">Oferte VIP și Premium selectate</p>
                </div>
                <Link 
                  href="/anunturi/premium" 
                  className="flex items-center gap-0.5 sm:gap-1 text-[#13C1AC] hover:text-[#0fa89a] transition-colors text-xs sm:text-sm font-medium"
                >
                  Vezi toate
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
              
              {/* Premium Grid - Same as regular products */}
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                {premiumProducts.slice(0, visiblePremiumCount).map((product, index) => (
                  <div key={`premium-${product.id}`}>
                    <ProductCard product={product} priority={index < 4} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== ANUNȚURI RECENTE ========== */}
          {/* Header - Mobile optimized */}
          <div className="flex justify-between items-end mb-3 sm:mb-6 md:mb-8 px-1">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#13C1AC] tracking-tight">Anunțuri recente</h2>
                <span className={`text-[#13C1AC]/70 font-medium text-[10px] sm:text-sm md:text-base ${isValidating ? 'revalidating' : ''}`}>
                  {displayProducts.length} găsite
                </span>
              </div>
              <div className="h-0.5 sm:h-1 w-14 sm:w-full max-w-[150px] bg-[#13C1AC] rounded-full mt-1 opacity-80"></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Selector */}
              <div className="relative group">
                <button 
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-[10px] sm:text-xs font-medium transition-colors"
                  onClick={() => {
                    const themes = [1, 6, 8, 9, 10];
                    const currentIndex = themes.indexOf(currentTheme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    const newTheme = themes[nextIndex];
                    setCurrentTheme(newTheme);
                    localStorage.setItem('user_card_theme', newTheme.toString());
                    window.dispatchEvent(new Event('themeChange'));
                  }}
                >
                  <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Tema {currentTheme}</span>
                </button>
              </div>
              <a href="/search" className="text-[#13C1AC] text-[10px] sm:text-sm font-semibold hover:underline flex items-center gap-0.5 sm:gap-1 active:opacity-70">
                Vezi toate
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Product Grid - Responsive columns */}
          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
            {visibleProducts.map((product, index) => (
              <div 
                key={`${product.id}-theme-${currentTheme}`}
                className={shouldAnimate ? 'animate-card' : ''}
              >
                <ProductCard product={product} priority={index < 10} />
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMoreProducts && (
            <div className="mt-3 sm:mt-6 text-center pb-2">
              <button 
                onClick={handleLoadMore}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-[#13C1AC] text-[#13C1AC] font-semibold rounded-full hover:bg-[#13C1AC] hover:text-white transition-all active:scale-95 text-xs sm:text-base"
              >
                <span>Încarcă mai multe</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* Ver todos - cuando ya no hay más para cargar */}
          {!hasMoreProducts && displayProducts && displayProducts.length >= 20 && (
            <div className="mt-3 sm:mt-6 text-center pb-2">
              <a 
                href="/search"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#13C1AC] text-white font-semibold rounded-full hover:bg-[#0da896] transition-all active:scale-95 text-xs sm:text-base"
              >
                <span>Vezi toate anunțurile</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
