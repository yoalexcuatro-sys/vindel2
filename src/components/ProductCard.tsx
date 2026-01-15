'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Heart, Clock, Package, Star, Sparkles, CheckCircle, AlertTriangle, MessageCircle, Truck, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { createProductLink } from '@/lib/slugs';
import { useAuth } from '@/lib/auth-context';
import { toggleFavorite } from '@/lib/favorites-service';
import { useUserFavorites } from '@/lib/swr-hooks';

interface Product {
  id: string; // Ensure ID is string for slug generation
  title: string;
  price: number;
  currency?: 'LEI' | 'EUR';
  condition?: string;
  negotiable?: boolean;
  image: string;
  images?: string[];
  thumbImages?: string[]; // Thumbnails for fast loading
  location: string;
  category?: string; // Added for URL generation
  reserved?: boolean;
  publishedAt?: string | Timestamp;
  deliveryType?: 'personal' | 'shipping' | 'both';
}

// Helper para obtener el label y color del estado
const getConditionInfo = (condition?: string): { label: string; color: string; icon: any } | null => {
  if (!condition) return null;
  const conditions: Record<string, { label: string; color: string; icon: any }> = {
    // Valores antiguos (compatibilidad)
    'new': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'like-new': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'good': { label: 'Bună stare', color: 'bg-blue-500 text-white', icon: CheckCircle },
    'fair': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Electronice / Gaming
    'nou-sigilat': { label: 'Sigilat', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-desigilat': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'ca-nou': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'folosit-functional': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    'defect': { label: 'Defect', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // General
    'nou': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'folosit': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Auto-moto
    'accidentat': { label: 'Accidentat', color: 'bg-red-500 text-white', icon: AlertTriangle },
    'pentru-piese': { label: 'Pentru piese', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // Modă / Copii
    'nou-eticheta': { label: 'Nou cu etichetă', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-fara-eticheta': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'vintage': { label: 'Vintage', color: 'bg-amber-600 text-white', icon: Clock },
    // Casă & Grădină
    'renovat': { label: 'Recondiționat', color: 'bg-indigo-500 text-white', icon: Sparkles },
    // Animale
    'disponibil': { label: 'Disponibil', color: 'bg-green-500 text-white', icon: CheckCircle },
    'rezervat': { label: 'Rezervat', color: 'bg-yellow-500 text-white', icon: Clock },
  };
  return conditions[condition] || null;
};

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

// Cache global del tema - NO leer localStorage aquí para evitar hydration mismatch
let cachedTheme: number | null = null;

function ProductCardComponent({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: favoriteIds, mutate: mutateFavorites } = useUserFavorites(user?.uid || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  // Siempre iniciar con tema 1 para evitar hydration mismatch
  const [theme, setTheme] = useState(1);
  
  // Check if product is favorited
  const isFavorited = favoriteIds?.includes(product.id) || false;
  
  // Handle favorite toggle
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login or show message
      router.push('/login');
      return;
    }
    
    setIsFavoriteLoading(true);
    try {
      const newIsFavorited = await toggleFavorite(user.uid, product.id);
      // Update local cache optimistically
      if (newIsFavorited) {
        mutateFavorites([...(favoriteIds || []), product.id], false);
      } else {
        mutateFavorites(favoriteIds?.filter(id => id !== product.id) || [], false);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [user, product.id, favoriteIds, mutateFavorites, router]);
  
  // Cargar tema de localStorage después del mount (evita hydration mismatch)
  useEffect(() => {
    const loadTheme = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_card_theme');
        if (saved) {
          cachedTheme = parseInt(saved);
          setTheme(cachedTheme);
        }
      }
    };
    
    // Cargar tema inicial
    loadTheme();
    
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  // Use images array if exists, otherwise single image
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || '/placeholder.jpg'];
  
  // Use thumbImages for fast loading, fallback to original
  const allThumbs = product.thumbImages && product.thumbImages.length > 0
    ? product.thumbImages
    : allImages;
  
  const imageCount = allImages.length;

  // Throttle mouse move - ahora 100ms para mejor rendimiento
  const lastUpdateRef = useRef(0);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (imageCount <= 1) return;
    
    // Throttle: solo actualizar cada 100ms
    const now = Date.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.min(Math.floor(percentage * imageCount), imageCount - 1);
    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
    }
  }, [imageCount, currentImageIndex]);

  const handleMouseEnter = useCallback(() => {
    if (imageCount > 1) setIsHovering(true);
  }, [imageCount]);

  const handleMouseLeave = useCallback(() => {
    setCurrentImageIndex(0);
    setIsHovering(false);
  }, []);

  // Precargar otras imágenes cuando el mouse entra (usa thumbs si hay)
  const preloadImagesRef = useRef(false);
  const handlePreloadImages = useCallback(() => {
    if (preloadImagesRef.current || allImages.length <= 1) return;
    preloadImagesRef.current = true;
    // Preload thumbs first (faster), then large images
    allThumbs.slice(1).forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, [allThumbs, allImages.length]);

  const ImageCarousel = ({ heightClass = "h-56", priority = false }: { heightClass?: string; priority?: boolean }) => (
    <div 
      className={`relative ${heightClass} w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { handleMouseEnter(); handlePreloadImages(); }}
      onMouseLeave={handleMouseLeave}
    >
        {/* Todas las imágenes renderizadas, controladas por opacity/visibility */}
        {allThumbs.map((thumb, idx) => (
          <Image
            key={idx}
            src={thumb}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-cover pointer-events-none transition-opacity duration-150 ${
              currentImageIndex === idx ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
            }`}
            style={{ objectPosition: 'center 30%' }}
            priority={idx === 0 && priority}
            quality={60}
          />
        ))}

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

        {/* Badge de condición */}
        {!product.reserved && getConditionInfo(product.condition) && (
          <div className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold rounded-md flex items-center gap-1 pointer-events-none z-10 ${getConditionInfo(product.condition)?.color}`}>
            {(() => {
              const Icon = getConditionInfo(product.condition)?.icon;
              return Icon ? <Icon className="w-3 h-3" /> : null;
            })()}
            {getConditionInfo(product.condition)?.label}
          </div>
        )}
    </div>
  );

  // THEME 4: Structured Pro (Watch Style)
  if (theme === 4) {
    return (
      <Link href={createProductLink(product)} prefetch={false} className="block h-full">
        <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
           <div className="flex p-3 gap-3 flex-1">
              <div className="w-24 h-24 relative rounded-md overflow-hidden shrink-0">
                 <ImageCarousel heightClass="h-full" />
              </div>
              <div className="flex-1 flex flex-col min-w-0 justify-between">
                 <div>
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 pr-2 group-hover:text-teal-600 transition-colors">{product.title}</h4>
                        <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`shrink-0 transition-colors ${isFavorited ? 'text-red-500' : 'text-slate-300 hover:text-red-500'}`}>
                          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate opacity-75">Electronics › Generic</div>
                 </div>
                 <div className="mt-2">
                    <span className="block text-base font-bold text-slate-900">{product.price} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
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
       <Link href={createProductLink(product)} prefetch={false} className="block h-full">
         <div className="group bg-white hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-300 h-full flex flex-col">
            <div className="aspect-[5/4] rounded-xl overflow-hidden relative mb-3 ring-1 ring-black/5">
                 <ImageCarousel heightClass="h-full" />
                 <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm z-20 transition-all group-hover:scale-110 ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                 </button>
            </div>
            <div className="px-1 flex-1 flex flex-col">
                 <div className="flex justify-between items-start">
                     <h4 className="font-medium text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-teal-600">{product.title}</h4>
                     <p className="font-bold text-gray-900 text-base whitespace-nowrap ml-2">{product.price} {product.currency === 'EUR' ? '€' : 'Lei'}</p>
                 </div>
                 <p className="text-sm text-gray-500 mt-1">Stare bună • Verificat</p>
            </div>
         </div>
       </Link>
    );
  }

  // THEME 6: Social Connect (Vinted Style) - Sin carrusel
  if (theme === 6) {
    return (
      <Link href={createProductLink(product)} prefetch={false} className="block h-full"> 
        <div className="group bg-transparent h-full flex flex-col cursor-pointer">
            <div className="relative mb-2">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative ring-1 ring-black/5">
                    {/* Imagen única sin carrusel */}
                    <img
                      src={allImages[0]}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: 'center 30%' }}
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Badge 1/N */}
                    {imageCount > 1 && (
                      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full z-20 pointer-events-none">
                         <span className="text-[10px] font-semibold text-white/90">
                            1 / {imageCount}
                         </span>
                      </div>
                    )}
                </div>
            </div>
            
            <div className="px-1 flex flex-col">
                <div className="flex justify-between items-start mb-0.5">
                   <h4 className="text-base font-bold text-gray-900">{product.price} {product.currency === 'EUR' ? '€' : 'Lei'}</h4>
                   <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`p-1 -mr-1 rounded-full hover:bg-gray-100 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-900'}`}>
                     <Heart className={`w-5 h-5 stroke-[1.5] ${isFavorited ? 'fill-current' : ''}`} />
                   </button>
                </div>
                
                <h3 className="text-slate-500 text-sm leading-tight mb-2 truncate font-normal">
                  {product.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                     {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? (
                       <Truck className="w-3.5 h-3.5 text-purple-500" />
                     ) : (
                       <Users className="w-3.5 h-3.5" />
                     )}
                    <span className={`truncate ${product.deliveryType === 'shipping' || product.deliveryType === 'both' ? 'text-purple-500 font-medium' : ''}`}>
                      {product.deliveryType === 'shipping' ? 'Livrare disponibilă' : 
                       product.deliveryType === 'both' ? 'Livrare disponibilă' : 
                       'Predare personală'}
                    </span>
                </div>
            </div>
        </div>
      </Link>
    );
  }
  // THEME 7: Auto/Imobiliare (Details & Tags)
  if (theme === 7) {
    return (
      <Link href={createProductLink(product)} prefetch={false} className="block h-full"> 
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
                     <h4 className="text-base font-bold text-gray-900 mb-1">{product.price} {product.currency === 'EUR' ? '€' : 'Lei'}</h4>
                   </div>
                   <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                     <Heart className={`w-6 h-6 stroke-2 ${isFavorited ? 'fill-current' : ''}`} />
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
      <Link href={createProductLink(product)} prefetch={false} className="block h-full">
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
                <span className="font-bold text-[#13C1AC] text-base">{product.price} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
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
      <Link href={createProductLink(product)} prefetch={false} className="block h-full">
        <div className="group bg-white rounded-xl overflow-hidden border-2 border-gray-100 hover:border-[#13C1AC] hover:shadow-lg transition-all duration-300 cursor-pointer relative hover:-translate-y-1 h-full flex flex-col">
          <div className="relative h-56 w-full shrink-0">
            <ImageCarousel heightClass="h-full" />
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
              <p className="text-base font-bold text-[#13C1AC]">{product.price.toLocaleString()} <span className="text-xs font-medium text-gray-500">{product.currency === 'EUR' ? '€' : 'Lei'}</span></p>
              {product.negotiable && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-violet-500 text-white flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Negociabil
                </span>
              )}
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

  // DEFAULT (THEME 1: Elegant Teal Border Style) - Sin carrusel
  return (
    <div className="relative h-full">
        <Link href={createProductLink(product)} prefetch={false} className="block h-full">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-[#13C1AC] relative h-full flex flex-col">
                <div className="relative">
                    <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                        {/* Imagen única sin carrusel */}
                        <img
                          src={allImages[0]}
                          alt={product.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ objectPosition: 'center 30%' }}
                          loading="lazy"
                          decoding="async"
                        />
                        
                        {/* Badge Reservat */}
                        {product.reserved && (
                            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 text-white text-xs font-semibold rounded-lg backdrop-blur-sm z-20">
                                Reservat
                            </div>
                        )}
                        
                        {/* Contador de fotos */}
                        {imageCount > 1 && (
                            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg z-20 font-medium">
                                1 / {imageCount}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                    {/* Precio */}
                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {product.price.toLocaleString()} {product.currency === 'EUR' ? '€' : 'Lei'}
                    </h4>
                    
                    {/* Título */}
                    <h3 className="text-gray-700 text-sm leading-snug line-clamp-2 group-hover:text-[#13C1AC] transition-colors">
                        {product.title}
                    </h3>
                    
                    {/* Ubicación */}
                    <div className="mt-auto pt-3">
                        <span className="text-sm text-gray-400">{product.location}</span>
                    </div>
                </div>
            </div>
        </Link>
        
        {/* Botón de favoritos FUERA del Link */}
        <button 
          className={`absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'} ${isFavoriteLoading ? 'opacity-50' : ''}`}
          onClick={handleFavoriteClick}
          disabled={isFavoriteLoading}
        >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
    </div>
  );
}

// Memoized export to prevent unnecessary re-renders
export default memo(ProductCardComponent, (prevProps, nextProps) => {
  // Comparación profunda pero eficiente
  const prev = prevProps.product;
  const next = nextProps.product;
  return prev.id === next.id &&
         prev.price === next.price &&
         prev.title === next.title &&
         prev.reserved === next.reserved &&
         prev.condition === next.condition &&
         prev.image === next.image;
});
