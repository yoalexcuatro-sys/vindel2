'use client';

import { useEffect, useState, useRef } from 'react';
import { Tag } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/products-service';
import { useHomeProducts } from '@/lib/swr-hooks';

// Precargar imágenes de los primeros productos para carga instantánea
function preloadProductImages(products: Product[], count: number = 10) {
  if (typeof window === 'undefined') return;
  
  products.slice(0, count).forEach(product => {
    const img = new window.Image();
    img.src = product.images?.[0] || product.image;
  });
}

export default function ProductGrid() {
  const { data: products, isLoading, isValidating } = useHomeProducts();
  const [currentTheme, setCurrentTheme] = useState(1);
  const [visibleCount, setVisibleCount] = useState(35);
  const preloadedRef = useRef(false);
  
  // Estados para animación - solo aplicar en primera carga real
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasAnimated = useRef(false);
  
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
    setVisibleCount(prev => prev + 35);
  };

  // Usar productos de SWR - mostrar skeletons solo mientras carga sin datos
  const showSkeletons = isLoading && !products;
  const displayProducts = products;
  const visibleProducts = displayProducts?.slice(0, visibleCount) || [];
  const hasMoreProducts = displayProducts && displayProducts.length > visibleCount;

  // Skeletons para carga - igual que en el buscador
  const renderSkeletons = () => (
    <>
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-4 sm:mb-6 md:mb-8 px-1">
        <div>
          <div className="h-5 sm:h-6 md:h-7 w-32 sm:w-40 md:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-0.5 sm:h-1 w-16 bg-[#13C1AC]/30 rounded-full mt-1.5"></div>
        </div>
        <div className="h-4 w-16 sm:w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-gray-100 shadow-sm">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-lg sm:rounded-xl mb-2 sm:mb-3 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-1.5 sm:mb-2 animate-pulse"></div>
            <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/2 mb-2 sm:mb-3 animate-pulse"></div>
            <div className="flex justify-between items-center pt-1 sm:pt-2">
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 sm:h-8 bg-gray-100 rounded w-12 sm:w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4 md:py-6 bg-gray-50">
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
          {/* Header - Mobile optimized */}
          <div className="flex justify-between items-end mb-4 sm:mb-6 md:mb-8 px-1">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#13C1AC] tracking-tight">Anunțuri recente</h2>
                <span className={`text-[#13C1AC]/70 font-medium text-xs sm:text-sm md:text-base ${isValidating ? 'revalidating' : ''}`}>
                  {displayProducts.length} găsite
                </span>
              </div>
              <div className="h-0.5 sm:h-1 w-16 sm:w-full max-w-[150px] bg-[#13C1AC] rounded-full mt-1 opacity-80"></div>
            </div>
            <a href="/search" className="text-[#13C1AC] text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 active:opacity-70">
              Vezi toate
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
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
            <div className="mt-4 sm:mt-6 text-center pb-2">
              <button 
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#13C1AC] text-[#13C1AC] font-semibold rounded-full hover:bg-[#13C1AC] hover:text-white transition-all active:scale-95 text-sm sm:text-base"
              >
                <span>Încarcă mai multe anunțuri</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* Ver todos - cuando ya no hay más para cargar */}
          {!hasMoreProducts && displayProducts && displayProducts.length >= 20 && (
            <div className="mt-4 sm:mt-6 text-center pb-2">
              <a 
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#13C1AC] text-white font-semibold rounded-full hover:bg-[#0da896] transition-all active:scale-95 text-sm sm:text-base"
              >
                <span>Vezi toate anunțurile</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
