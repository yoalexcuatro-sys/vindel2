'use client';

import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Shield, Zap } from 'lucide-react';

// Lazy load componentes que no son críticos para First Paint
const CategoryBar = dynamic(() => import('@/components/CategoryBar'), {
  loading: () => <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />,
  ssr: true // Mantener SSR para SEO
});

const ProductGrid = dynamic(() => import('@/components/ProductGrid'), {
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-72 animate-pulse" />
        ))}
      </div>
    </div>
  ),
  ssr: true
});

export default function Home() {
  return (
    <main className="flex-grow relative z-20 bg-gray-50 min-h-screen">
      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-fadeInDown { animation: fadeInDown 0.6s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
        
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Promotional Hero - Enhanced Mobile */}
      <div className="bg-gradient-to-br from-[#13C1AC] via-[#11b5a1] to-[#0ea693] text-white py-6 sm:py-8 md:py-12 relative z-20">
         {/* Animated Background Elements */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating circles for mobile */}
            <div className="absolute top-4 right-4 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl animate-pulse-soft"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl animate-pulse-soft" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 sm:w-20 sm:h-20 bg-white/5 rounded-full blur-xl animate-float hidden sm:block"></div>
            
            {/* Abstract Pattern */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute -right-20 -bottom-20 w-64 h-64 sm:w-96 sm:h-96 opacity-10">
               <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.3,82.3,22.9,71.3,34.4C60.3,45.9,49.5,55.3,37.3,62.8C25.1,70.3,11.5,75.9,-0.8,77.3C-13.1,78.7,-25,75.9,-36,69.1C-47,62.3,-57.1,51.5,-66.1,39.1C-75.1,26.7,-83,12.7,-82.6,-1.1C-82.2,-14.9,-73.5,-28.5,-63.3,-40.1C-53.1,-51.7,-41.4,-61.3,-28.9,-69.3C-16.4,-77.3,-3.1,-83.7,5.1,-82.6L12,-81.4L44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Mobile: Stack layout, Desktop: Center */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 sm:mb-3 leading-tight animate-fadeInDown">
                  Dacă nu-l folosești, vinde-l
              </h1>
              <p className="text-sm sm:text-base md:text-lg opacity-90 mb-4 sm:mb-6 max-w-xl mx-auto font-medium animate-fadeInUp animate-delay-100 px-2">
                  Cumpără și vinde tot ce vrei, aproape de tine.
              </p>
            </div>
            
            {/* Search Bar - Improved Mobile */}
            <div className="max-w-2xl mx-auto animate-scaleIn animate-delay-200 relative z-[100]">
               <Suspense fallback={<div className="h-12 sm:h-14 bg-white/20 rounded-full w-full animate-pulse backdrop-blur-sm" />}>
                  <SearchBar variant="hero" />
               </Suspense>
            </div>
         </div>
         
         {/* Mobile Feature Pills - Horizontal scroll */}
         <div className="mt-6 sm:mt-8 overflow-x-auto scrollbar-hide">
           <div className="flex gap-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto justify-start sm:justify-center min-w-max sm:min-w-0">
             <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
               <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span>Rapid & Simplu</span>
             </div>
             <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
               <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span>Tranzacții Sigure</span>
             </div>
             <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
               <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span>Cele mai bune prețuri</span>
             </div>
           </div>
         </div>
      </div>
      
      <CategoryBar />
      <ProductGrid />
    </main>
  );
}
