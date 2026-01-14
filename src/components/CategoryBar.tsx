'use client';

import { Home, Car, Briefcase, Heart, Wrench, Smartphone, Shirt, PawPrint, Armchair, Dumbbell, Baby, Plane, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

const categories = [
  { name: 'Imobiliare', icon: Home, slug: 'imobiliare', color: 'from-blue-500 to-blue-600' },
  { name: 'Auto & Moto', icon: Car, slug: 'auto-moto', color: 'from-red-500 to-red-600' },
  { name: 'Locuri de muncă', icon: Briefcase, slug: 'locuri-de-munca', color: 'from-purple-500 to-purple-600' },
  { name: 'Matrimoniale', icon: Heart, slug: 'matrimoniale', color: 'from-pink-500 to-pink-600' },
  { name: 'Servicii', icon: Wrench, slug: 'servicii', color: 'from-orange-500 to-orange-600' },
  { name: 'Electronice', icon: Smartphone, slug: 'electronice', color: 'from-cyan-500 to-cyan-600' },
  { name: 'Modă', icon: Shirt, slug: 'moda', color: 'from-fuchsia-500 to-fuchsia-600' },
  { name: 'Animale', icon: PawPrint, slug: 'animale', color: 'from-amber-500 to-amber-600' },
  { name: 'Casă & Grădină', icon: Armchair, slug: 'casa-gradina', color: 'from-green-500 to-green-600' },
  { name: 'Sport', icon: Dumbbell, slug: 'sport', color: 'from-indigo-500 to-indigo-600' },
  { name: 'Copii', icon: Baby, slug: 'copii', color: 'from-sky-500 to-sky-600' },
  { name: 'Turism', icon: Plane, slug: 'turism', color: 'from-teal-500 to-teal-600' },
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming', color: 'from-violet-500 to-violet-600' },
];

export default function CategoryBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  return (
    <div className="bg-white border-b border-gray-100 py-4 sm:py-6 relative z-10">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .category-item {
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Scroll Arrows */}
        <button 
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center bg-white shadow-md rounded-full border border-gray-200 text-gray-500 hover:text-[#13C1AC] hover:border-[#13C1AC] transition-all ${!canScrollLeft && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center bg-white shadow-md rounded-full border border-gray-200 text-gray-500 hover:text-[#13C1AC] hover:border-[#13C1AC] transition-all ${!canScrollRight && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Categories Container */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:justify-between pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
            {categories.map((category, index) => (
                <Link 
                  href={`/search?category=${category.slug}`}
                  key={category.name} 
                  className="category-item flex flex-col items-center flex-shrink-0 cursor-pointer group snap-start"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                    {/* Mobile: Compact pill style */}
                    <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 group-hover:border-[#13C1AC] group-hover:bg-[#13C1AC]/5 transition-all group-active:scale-95">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm`}>
                        <category.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-[#13C1AC] whitespace-nowrap">{category.name}</span>
                    </div>
                    
                    {/* Desktop: Icon + Label style */}
                    <div className="hidden sm:flex flex-col items-center w-20">
                      <div className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center mb-2 group-hover:border-[#13C1AC] group-hover:bg-[#13C1AC]/5 group-hover:text-[#13C1AC] transition-all text-gray-500 shadow-sm group-hover:shadow-md group-hover:scale-105">
                          <category.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-[#13C1AC] text-center leading-tight">{category.name}</span>
                    </div>
                </Link>
            ))}
        </div>
        
      </div>
    </div>
  );
}
