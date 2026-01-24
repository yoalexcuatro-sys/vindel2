'use client';

import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Shield, Zap, Sparkles, ArrowRight } from 'lucide-react';

// Lazy load componentes que no son críticos para First Paint
const CategoryBar = dynamic(() => import('@/components/CategoryBar'), {
  loading: () => <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />,
  ssr: true // Mantener SSR para SEO
});

const ProductGrid = dynamic(() => import('@/components/ProductGrid'), {
  loading: () => (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-56 sm:h-72 animate-pulse" />
        ))}
      </div>
    </div>
  ),
  ssr: true
});

export default function Home() {
  return (
    <main className="flex-grow relative min-h-screen">
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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-fadeInDown { animation: fadeInDown 0.6s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
        
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Safe area for mobile notch */
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-area-top { padding-top: env(safe-area-inset-top); }
        }
      `}</style>
      
      {/* Promotional Hero - Ultra Mobile Optimized */}
      <div className="bg-gradient-to-br from-[#13C1AC] via-[#11b5a1] to-[#0ea693] text-white relative z-30">
         {/* Animated Background Elements - Subtle for mobile */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-32 bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 animate-shimmer"></div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6 sm:py-10 md:py-14">
            {/* Mobile-first Hero Content */}
            <div className="text-center space-y-3 sm:space-y-4">
              {/* Main Headline - Compact on mobile */}
              <h1 className="text-[22px] leading-tight sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight animate-fadeInDown">
                  Dacă nu-l folosești,{' '}
                  <span className="relative">
                    vinde-l
                    <svg className="absolute -bottom-1 left-0 w-full h-2 text-white/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 8 Q25 0 50 8 T100 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    </svg>
                  </span>
              </h1>
              
              {/* Subtitle - Hidden on very small screens, visible on larger */}
              <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-md mx-auto font-medium animate-fadeInUp animate-delay-100">
                  Cumpără și vinde tot ce vrei, aproape de tine.
              </p>
            </div>
            
            {/* Search Bar - Optimized for thumb reach on mobile */}
            <div className="mt-5 sm:mt-8 max-w-2xl mx-auto animate-scaleIn animate-delay-200 relative z-[9999]">
               <Suspense fallback={<div className="h-12 sm:h-14 bg-white/20 rounded-full w-full animate-pulse backdrop-blur-sm" />}>
                  <SearchBar variant="hero" />
               </Suspense>
            </div>
            
            {/* Quick Action Button - Mobile only */}
            <div className="mt-4 sm:hidden flex justify-center animate-fadeInUp animate-delay-300">
              <Link 
                href="/publish"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#13C1AC] font-bold text-sm rounded-full shadow-lg shadow-black/10 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Publică anunț
              </Link>
            </div>
         </div>
         
         {/* Mobile Feature Pills - Horizontal scroll with gradient fade */}
         <div className="relative pb-5 sm:pb-6">
           {/* Gradient fades for scroll indication */}
           <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#13C1AC] to-transparent z-10 pointer-events-none sm:hidden"></div>
           <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0ea693] to-transparent z-10 pointer-events-none sm:hidden"></div>
           
           <div className="overflow-x-auto scrollbar-hide">
             <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto justify-start sm:justify-center min-w-max sm:min-w-0 py-1">
               <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium whitespace-nowrap border border-white/10">
                 <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                 <span>Rapid & Simplu</span>
               </div>
               <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium whitespace-nowrap border border-white/10">
                 <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
                 <span>Tranzacții Sigure</span>
               </div>
               <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium whitespace-nowrap border border-white/10">
                 <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" />
                 <span>Cele mai bune prețuri</span>
               </div>
               <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium whitespace-nowrap border border-white/10">
                 <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
                 <span>Mii de anunțuri</span>
               </div>
             </div>
           </div>
         </div>
      </div>
      
      <CategoryBar />
      <div className="bg-gray-50">
        <ProductGrid />
      </div>
    </main>
  );
}
