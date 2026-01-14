'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/products-service';
import { useHomeProducts } from '@/lib/swr-hooks';

export default function ProductGrid() {
  const { data: products, isLoading } = useHomeProducts();
  const [currentTheme, setCurrentTheme] = useState(1);

  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('user_card_theme');
      if (saved) setCurrentTheme(parseInt(saved));
    };
    loadTheme();
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  // Skeletons para carga - Mobile optimized
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
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-gray-100 shadow-sm flex flex-col h-full">
            <div className={`bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 animate-pulse ${currentTheme === 8 || currentTheme === 9 ? 'aspect-video' : 'aspect-[4/3]'}`} />
            <div className="h-3 sm:h-4 bg-gray-100 rounded w-4/5 mb-1.5 sm:mb-2 animate-pulse" />
            <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-3/5 animate-pulse" />
            <div className="mt-auto pt-2 sm:pt-3 flex justify-between items-center">
              <div className="h-4 sm:h-5 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="h-6 sm:h-8 bg-gray-100 rounded w-12 sm:w-16 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4 md:py-6 bg-gray-50">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale { animation: fadeInScale 0.4s ease-out forwards; }
      `}</style>
      {isLoading ? (
        renderSkeletons()
      ) : !products || products.length === 0 ? (
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
        <>
          {/* Header - Mobile optimized */}
          <div className="flex justify-between items-end mb-4 sm:mb-6 md:mb-8 px-1 animate-fadeInUp">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#13C1AC] tracking-tight">Anunțuri recente</h2>
                <span className="text-[#13C1AC]/70 font-medium text-xs sm:text-sm md:text-base">{products.length} găsite</span>
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
          
          {/* Product Grid - Responsive columns - Sin animaciones individuales para mejor rendimiento */}
          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* Load More - Mobile friendly */}
          {products.length >= 12 && (
            <div className="mt-6 sm:mt-8 text-center">
              <a 
                href="/search" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#13C1AC] text-[#13C1AC] font-semibold rounded-full hover:bg-[#13C1AC] hover:text-white transition-all active:scale-95 text-sm sm:text-base"
              >
                <span>Vezi mai multe anunțuri</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
