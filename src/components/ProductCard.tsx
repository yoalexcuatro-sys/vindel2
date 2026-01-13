'use client';

import { useState, useCallback, useEffect } from 'react';
import { Heart, ArrowUpRight, ArrowDownRight, Clock, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { createProductLink } from '@/lib/slugs';
import { mutate } from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string; // Ensure ID is string for slug generation
  title: string;
  price: number;
  image: string;
  images?: string[];
  location: string;
  category?: string; // Added for URL generation
  reserved?: boolean;
  publishedAt?: string | Timestamp;
}

// Helper para verificar si el producto es nuevo (menos de 24 horas)
const isNewProduct = (publishedAt?: string | Timestamp): boolean => {
  if (!publishedAt) return false;
  let publishDate: Date;
  if (publishedAt instanceof Timestamp) {
    publishDate = publishedAt.toDate();
  } else {
    publishDate = new Date(publishedAt);
  }
  const now = new Date();
  const diffHours = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
};

export default function ProductCard({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [theme, setTheme] = useState(1);
  
  // Prefetch producto en hover para carga instantánea
  const prefetchProduct = useCallback(async () => {
    const key = `product-${product.id}`;
    // Precargar en caché SWR
    const docRef = doc(db, 'products', product.id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      mutate(key, { id: snapshot.id, ...snapshot.data() }, false);
    }
  }, [product.id]);
  
  // Load theme preference
  useEffect(() => {
    const loadTheme = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_card_theme');
        if (saved) setTheme(parseInt(saved));
      }
    };
    
    loadTheme();
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  // Use images array if exists, otherwise single image
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || '/placeholder.jpg'];
  const imageCount = allImages.length;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (imageCount <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.min(Math.floor(percentage * imageCount), imageCount - 1);
    setCurrentImageIndex(prev => prev !== newIndex ? newIndex : prev);
  }, [imageCount]);

  const handleMouseEnter = useCallback(() => {
    if (imageCount > 1) setIsHovering(true);
    // Prefetch producto para carga instantánea al hacer click
    prefetchProduct();
  }, [imageCount, prefetchProduct]);

  const handleMouseLeave = useCallback(() => {
    setCurrentImageIndex(0);
    setIsHovering(false);
  }, []);

  const ImageCarousel = ({ heightClass = "h-56" }: { heightClass?: string }) => (
    <div 
      className={`relative ${heightClass} w-full overflow-hidden`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        {/* Primera imagen siempre visible como fondo */}
        <Image
          src={allImages[0]}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover object-center"
          style={{ objectPosition: 'center 30%' }}
          priority
        />
        
        {/* Imagen actual en hover se superpone */}
        {isHovering && currentImageIndex > 0 && allImages[currentImageIndex] && (
          <Image
            src={allImages[currentImageIndex]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover z-[1]"
            style={{ objectPosition: 'center 30%' }}
          />
        )}

        {imageCount > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
            {allImages.slice(0, 5).map((_, idx) => (
              <span 
                key={idx}
                className={`h-0.5 rounded-full transition-all shadow-sm ${
                  idx === currentImageIndex ? 'w-4 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {product.reserved && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-md backdrop-blur-sm pointer-events-none">
                Reservat
            </div>
        )}
        
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-auto" onClick={(e) => { e.preventDefault(); }}>
            <Heart className="h-5 w-5" />
        </button>
    </div>
  );

  // THEME 4: Structured Pro (Watch Style)
  if (theme === 4) {
    return (
      <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
           <div className="flex p-3 gap-3 flex-1">
              <div className="w-24 h-24 relative rounded-md overflow-hidden shrink-0">
                 <ImageCarousel heightClass="h-full" />
              </div>
              <div className="flex-1 flex flex-col min-w-0 justify-between">
                 <div>
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 pr-2 group-hover:text-teal-600 transition-colors">{product.title}</h4>
                        <Heart className="w-5 h-5 text-slate-300 shrink-0 hover:text-red-500 transition-colors" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate opacity-75">Electronics › Generic</div>
                 </div>
                 <div className="mt-2">
                    <span className="block text-xl font-bold text-slate-900">{product.price} Lei</span>
                    <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">Verificat</span>
                 </div>
              </div>
           </div>
           <div className="px-3 py-2 bg-slate-50 flex justify-between items-center text-[11px] text-slate-500 border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Azi, 12:00</span>
                </div>
                <span className="truncate max-w-[50%]">{product.location}</span>
           </div>
        </div>
      </Link>
    );
  }

  // THEME 5: Minimalist Focus
  if (theme === 5) {
     return (
       <Link href={createProductLink(product)} className="block h-full">
         <div className="group bg-white hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-300 h-full flex flex-col">
            <div className="aspect-[5/4] rounded-xl overflow-hidden relative mb-3 ring-1 ring-black/5">
                 <ImageCarousel heightClass="h-full" />
                 <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm z-20 transition-transform group-hover:scale-110">
                    <Heart className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                 </div>
            </div>
            <div className="px-1 flex-1 flex flex-col">
                 <div className="flex justify-between items-start">
                     <h4 className="font-medium text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-teal-600">{product.title}</h4>
                     <p className="font-bold text-gray-900 text-lg whitespace-nowrap ml-2">{product.price} Lei</p>
                 </div>
                 <p className="text-sm text-gray-500 mt-1">Stare bună • Verificat</p>
            </div>
         </div>
       </Link>
    );
  }

  // THEME 6: Social Connect (Vinted Style)
  if (theme === 6) {
    return (
      <Link href={createProductLink(product)} className="block h-full"> 
        <div className="group bg-transparent h-full flex flex-col cursor-pointer">
            <div className="relative mb-2">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative ring-1 ring-black/5">
                    <ImageCarousel heightClass="h-full" />
                    {/* Badge 1/2 */}
                    <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full z-20 pointer-events-none">
                       <span className="text-[10px] font-semibold text-white/90">
                          1 / {imageCount || 1}
                       </span>
                    </div>
                </div>
            </div>
            
            <div className="px-1 flex flex-col">
                <div className="flex justify-between items-start mb-0.5">
                   <h4 className="text-base font-bold text-gray-900">{product.price} Lei</h4>
                   <div className="p-1 -mr-1 rounded-full hover:bg-gray-100 transition-colors">
                     <Heart className="w-5 h-5 text-gray-900 stroke-[1.5]" />
                   </div>
                </div>
                
                <h3 className="text-slate-500 text-sm leading-tight mb-2 truncate font-normal">
                  {product.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                     </svg>
                    <span className="truncate">Predare personală</span>
                </div>
            </div>
        </div>
      </Link>
    );
  }
  // THEME 7: Auto/Imobiliare (Details & Tags)
  if (theme === 7) {
    return (
      <Link href={createProductLink(product)} className="block h-full"> 
        <div className="group bg-white rounded-2xl border border-gray-300 overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[4/3] border-b border-gray-100">
                <ImageCarousel heightClass="h-full" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                    <span className="w-4 h-1 rounded-full bg-white shadow-sm"></span>
                    <span className="w-1.5 h-1 rounded-full bg-white/60 shadow-sm"></span>
                    <span className="w-1.5 h-1 rounded-full bg-white/60 shadow-sm"></span>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start">
                   <div>
                     <h4 className="text-xl font-extrabold text-gray-900 mb-1">{product.price} Lei</h4>
                   </div>
                   <button className="text-gray-400 hover:text-red-500 transition-colors">
                     <Heart className="w-6 h-6 stroke-2" />
                   </button>
                </div>
                
                <h3 className="text-gray-800 text-base font-medium mb-3 line-clamp-1">
                  {product.title}
                </h3>
                
                <div className="mb-4">
                     <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md border border-indigo-100">
                        Folosit
                     </span>
                </div>
                
                <div className="mt-auto pt-3 flex justify-between items-center text-xs text-gray-500">
                     <div className="flex items-center gap-1.5 group-hover:text-gray-700 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate max-w-[100px]">{product.location}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                         <Clock className="w-4 h-4" />
                         <span>3 zile</span>
                     </div>
                </div>
            </div>
        </div>
      </Link>
    );
  }

  // THEME 8: Compact Card (User Requested)
  if (theme === 8) {
    return (
      <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative h-full flex flex-col ring-1 ring-gray-100/50">
          <div className="relative">
             <div className="aspect-video relative overflow-hidden">
                <ImageCarousel heightClass="h-full" />
             </div>
             <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm z-20 pointer-events-none">
                Premium
             </span>
          </div>
          
          <div className="p-4 flex flex-col flex-1">
             <h4 className="font-bold text-gray-900 text-base mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">{product.title}</h4>
             <p className="text-xs text-slate-500 mb-4">Postat de Alex Electronics</p>
             
             <div className="flex items-center justify-between mt-auto">
                <span className="font-bold text-[#13C1AC] text-xl">{product.price} Lei</span>
                <span className="bg-[#0f172a] text-white text-[11px] font-medium px-4 py-2 rounded-lg group-hover:bg-slate-800 transition-colors shadow-sm">
                    Vezi Detalii
                </span>
             </div>
          </div>
        </div>
      </Link>
    );
  }

  // THEME 9: Original Classic (vindel23 style)
  if (theme === 9) {
    return (
      <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white rounded-xl overflow-hidden border-2 border-gray-100 hover:border-[#13C1AC] hover:shadow-lg transition-all duration-300 cursor-pointer relative hover:-translate-y-1 h-full flex flex-col">
          <div className="relative h-56 w-full shrink-0">
            <ImageCarousel heightClass="h-full" />
            {/* Etiqueta Nou - solo aparece las primeras 24h */}
            {isNewProduct(product.publishedAt) && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#13C1AC] text-white text-[10px] font-bold rounded shadow-md z-10">
                Nou
              </div>
            )}
            {/* Círculo verde hover */}
            <div className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 group-hover:bg-[#13C1AC] group-hover:text-white text-gray-400">
              <Heart className="h-5 w-5" />
            </div>
            {product.reserved && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-md backdrop-blur-sm">
                Reservat
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xl font-bold text-[#13C1AC]">{product.price.toLocaleString()} <span className="text-sm font-medium text-gray-500">Lei</span></p>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">Negociabil</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed h-[2.5rem]">{product.title}</p>
            <div className="flex justify-between items-center mt-auto pt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {product.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Azi
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // DEFAULT (THEME 1: Classic Market - Reference Style)
  return (
    <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative h-full flex flex-col ring-1 ring-transparent hover:ring-teal-500/20">
            <div className="relative">
                <div className="aspect-[4/3] relative overflow-hidden">
                    <ImageCarousel heightClass="h-full" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 shadow-sm"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 shadow-sm"></span>
                    </div>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="text-xl font-bold text-gray-900">{product.price} Lei</h4>
                   <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" />
                </div>
                
                <h3 className="text-gray-700 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">{product.title}</h3>
                
                <div className="mt-auto">
                    <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-100 mb-4">
                        Folosit
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-gray-400 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[8px]">📍</span>
                            {product.location}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Azi
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Link>
  );
}
