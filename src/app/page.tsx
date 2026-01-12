import CategoryBar from '@/components/CategoryBar';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="flex-grow relative z-20 bg-gray-50 min-h-screen">
      {/* Promotional Hero */}
      <div className="bg-[#13C1AC] text-white py-8 md:py-12 relative z-20">
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            {/* Abstract Pattern background placeholder */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
               <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.3,82.3,22.9,71.3,34.4C60.3,45.9,49.5,55.3,37.3,62.8C25.1,70.3,11.5,75.9,-0.8,77.3C-13.1,78.7,-25,75.9,-36,69.1C-47,62.3,-57.1,51.5,-66.1,39.1C-75.1,26.7,-83,12.7,-82.6,-1.1C-82.2,-14.9,-73.5,-28.5,-63.3,-40.1C-53.1,-51.7,-41.4,-61.3,-28.9,-69.3C-16.4,-77.3,-3.1,-83.7,5.1,-82.6L12,-81.4L44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
                Dacă nu-l folosești, vinde-l
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto font-medium">
                Cumpără și vinde tot ce vrei, aproape de tine.
            </p>
            
            <div className="max-w-2xl mx-auto">
               <Suspense fallback={<div className="h-14 bg-white rounded-full w-full animate-pulse" />}>
                  <SearchBar variant="hero" />
               </Suspense>
            </div>

            <div className="mt-8"> 
                <button className="bg-white/20 text-white border-2 border-white/40 font-bold py-2 px-6 rounded-full hover:bg-white/30 transition-all text-sm backdrop-blur-sm">
                    Publică un anunț
                </button>
            </div>
         </div>
      </div>
      
      <CategoryBar />
      <ProductGrid />
    </main>
  );
}
