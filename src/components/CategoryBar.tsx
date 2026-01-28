'use client';

import { Home, Car, Briefcase, Heart, Wrench, Smartphone, Shirt, PawPrint, Armchair, Dumbbell, Baby, Plane, Gamepad2, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

const categories = [
  { name: 'Imobiliare', shortName: 'Imobiliare', icon: Home, slug: 'imobiliare', color: '#3b82f6', isNew: true },
  { name: 'Auto & Moto', shortName: 'Auto', icon: Car, slug: 'auto-moto', color: '#ef4444' },
  { name: 'Locuri de muncă', shortName: 'Joburi', icon: Briefcase, slug: 'locuri-de-munca', color: '#a855f7' },
  { name: 'Matrimoniale', shortName: 'Matrimoniale', icon: Heart, slug: 'matrimoniale', color: '#ec4899' },
  { name: 'Servicii', shortName: 'Servicii', icon: Wrench, slug: 'servicii', color: '#f97316' },
  { name: 'Electronice', shortName: 'Electronice', icon: Smartphone, slug: 'electronice', color: '#06b6d4' },
  { name: 'Modă', shortName: 'Modă', icon: Shirt, slug: 'moda', color: '#d946ef' },
  { name: 'Animale', shortName: 'Animale', icon: PawPrint, slug: 'animale', color: '#f59e0b' },
  { name: 'Casă & Grădină', shortName: 'Casă', icon: Armchair, slug: 'casa-gradina', color: '#22c55e' },
  { name: 'Sport', shortName: 'Sport', icon: Dumbbell, slug: 'sport', color: '#6366f1' },
  { name: 'Copii', shortName: 'Copii', icon: Baby, slug: 'copii', color: '#0ea5e9' },
  { name: 'Turism', shortName: 'Turism', icon: Plane, slug: 'turism', color: '#14b8a6' },
  { name: 'Gaming', shortName: 'Jocuri', icon: Gamepad2, slug: 'gaming', color: '#8b5cf6' },
];

export default function CategoryBar() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showAgeModal, setShowAgeModal] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (e: React.MouseEvent, category: typeof categories[0]) => {
    // No special handling needed - all categories go to search
  };

  const handleAgeConfirm = () => {
    setShowAgeModal(false);
    router.push('/search?category=matrimoniale');
  };

  return (
    <>
      {/* Age Verification Modal - Outside the z-0 container */}
      {showAgeModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAgeModal(false)}>
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-pink-600" />
              </div>
              <button 
                onClick={() => setShowAgeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verificare vârstă</h3>
            <p className="text-gray-600 mb-6">
              Pentru a accesa secțiunea Matrimoniale, trebuie să confirmați că aveți cel puțin 18 ani.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAgeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleAgeConfirm}
                className="flex-1 px-4 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors"
              >
                Am peste 18 ani
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 py-3 sm:py-5 relative z-0">
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .category-item {
            animation: fadeInUp 0.3s ease-out forwards;
            opacity: 0;
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Scroll Arrows - Desktop only */}
        <button 
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white shadow-lg rounded-full border border-gray-100 text-gray-500 hover:text-[#13C1AC] hover:border-[#13C1AC] transition-all ${!canScrollLeft && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white shadow-lg rounded-full border border-gray-100 text-gray-500 hover:text-[#13C1AC] hover:border-[#13C1AC] transition-all ${!canScrollRight && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Gradient fade indicators for mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none sm:hidden"></div>
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none sm:hidden"></div>

        {/* Categories Container */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:justify-center px-3 sm:px-6 lg:px-8"
        >
            {categories.map((category, index) => (
                <Link 
                  href={`/search?category=${category.slug}`}
                  key={category.name} 
                  className="category-item flex-shrink-0 cursor-pointer group snap-start"
                  style={{ animationDelay: `${index * 25}ms` }}
                  onClick={(e) => handleCategoryClick(e, category)}
                >
                    {/* Mobile: Modern pill style */}
                    <div className="sm:hidden flex flex-col items-center gap-1.5 min-w-[60px]">
                      <div className="relative">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center group-active:scale-90 transition-all duration-200 shadow-sm"
                          style={{ 
                            backgroundColor: `${category.color}12`,
                            border: `1.5px solid ${category.color}25`
                          }}
                        >
                          <category.icon 
                            className="h-5 w-5 transition-transform group-active:scale-110" 
                            style={{ color: category.color }} 
                            strokeWidth={2}
                          />
                        </div>
                        {category.isNew && (
                          <span className="absolute top-0 -right-1 bg-[#22c55e] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                            Nou
                          </span>
                        )}
                      </div>
                      <span 
                        className="text-[10px] font-semibold text-center leading-tight max-w-[60px] truncate"
                        style={{ color: category.color }}
                      >
                        {category.shortName}
                      </span>
                    </div>
                    
                    {/* Desktop: Icon + Label style */}
                    <div className="hidden sm:flex flex-col items-center w-20 group">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl border border-gray-100 bg-white flex items-center justify-center mb-2 group-hover:border-[#13C1AC] group-hover:bg-[#13C1AC]/5 group-hover:shadow-lg transition-all text-gray-500 group-hover:text-[#13C1AC] shadow-sm group-hover:scale-105">
                            <category.icon className="h-6 w-6" />
                        </div>
                        {category.isNew && (
                          <span className="absolute top-0 -right-2 bg-[#22c55e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                            Nou
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-[#13C1AC] text-center leading-tight transition-colors">{category.name}</span>
                    </div>
                </Link>
            ))}
        </div>
        
      </div>
    </div>
    </>
  );
}
