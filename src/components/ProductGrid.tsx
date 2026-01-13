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

  // Skeletons para carga
  const renderSkeletons = () => (
    <div className={`grid gap-3 md:gap-4 ${currentTheme === 8 || currentTheme === 9 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col h-full">
          <div className={`bg-gray-100 rounded-xl mb-3 animate-pulse ${currentTheme === 8 || currentTheme === 9 ? 'aspect-video' : 'aspect-[4/3]'}`} />
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="mt-auto pt-3 flex justify-between items-center">
            <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-8 bg-gray-100 rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-[600px]">
      {isLoading ? (
        renderSkeletons()
      ) : !products || products.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nu există produse încă</h2>
          <p className="text-gray-500 mb-6">Fii primul care publică ceva.</p>
          <a href="/publish" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-[#13C1AC] hover:bg-[#0da896]">
            Publică anunț
          </a>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end mb-8 px-1">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-bold text-[#13C1AC] tracking-tight">Anunțuri recente</h2>
                <span className="text-[#13C1AC] font-medium text-base">{products.length} găsite</span>
              </div>
              <div className="h-1 w-full max-w-[150px] bg-[#13C1AC] rounded-full mt-1 opacity-80"></div>
            </div>
            <a href="#" className="text-[#13C1AC] text-sm font-semibold hover:underline mb-2">Vezi toate</a>
          </div>
          <div className={`grid gap-3 md:gap-4 ${currentTheme === 8 || currentTheme === 9 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
