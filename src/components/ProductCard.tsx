'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import { Heart, Clock, Package, Star, Sparkles, CheckCircle, AlertTriangle, MessageCircle, Truck, Users, Crown, Zap, Award } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { createProductLink } from '@/lib/slugs';
import { useAuth } from '@/lib/auth-context';
import { toggleFavorite } from '@/lib/favorites-service';
import { useUserFavorites } from '@/lib/swr-hooks';
import { PromotionType } from '@/lib/products-service';

// Helper para formatear tiempo relativo
const getRelativeTime = (publishedAt?: string | Timestamp): string => {
  if (!publishedAt) return 'Azi';
  
  let date: Date;
  if (typeof publishedAt === 'string') {
    date = new Date(publishedAt);
  } else if (publishedAt && 'seconds' in publishedAt) {
    date = new Date(publishedAt.seconds * 1000);
  } else {
    return 'Azi';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMins < 1) return 'Acum';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return diffHours === 1 ? '1 oră' : `${diffHours} ore`;
  if (diffDays < 7) return diffDays === 1 ? 'Ieri' : `${diffDays} zile`;
  if (diffWeeks < 4) return diffWeeks === 1 ? '1 săpt' : `${diffWeeks} săpt`;
  if (diffMonths < 12) return diffMonths === 1 ? '1 lună' : `${diffMonths} luni`;
  return '+1 an';
};

interface Product {
  id: string; // Ensure ID is string for slug generation
  title: string;
  price: number;
  currency?: 'LEI' | 'EUR';
  condition?: string;
  negotiable?: boolean;
  image: string;
  images?: string[];
  location: string;
  category?: string; // Added for URL generation
  reserved?: boolean;
  publishedAt?: string | Timestamp;
  deliveryType?: 'personal' | 'shipping' | 'both';
  // Promotion fields
  promoted?: boolean;
  promotionType?: PromotionType;
  promotionEnd?: Timestamp | { seconds: number };
  seller?: {
    id: string;
    name: string;
    rating?: number;
    reviews?: number;
    avatar?: string;
    joined?: string;
  };
}

// Helper para verificar si el producto está promocionado
const isProductPromoted = (product: Product): boolean => {
  if (!product.promoted || !product.promotionEnd) return false;
  
  const now = new Date();
  let endDate: Date;
  
  if (product.promotionEnd instanceof Timestamp) {
    endDate = product.promotionEnd.toDate();
  } else if (typeof product.promotionEnd === 'object' && 'seconds' in product.promotionEnd) {
    endDate = new Date((product.promotionEnd as any).seconds * 1000);
  } else {
    return false;
  }
  
  return endDate > now;
};

// Helper para obtener el badge de promoción
const getPromotionBadgeInfo = (product: Product): { label: string; color: string; icon: any } | null => {
  if (!isProductPromoted(product)) return null;
  
  const badges: Record<PromotionType, { label: string; color: string; icon: any }> = {
    'zilnic': { label: 'Promovat', color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30', icon: Zap },
    'saptamanal': { label: 'Premium', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30', icon: Award },
    'lunar': { label: 'VIP', color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30', icon: Crown },
  };
  
  return product.promotionType ? badges[product.promotionType] : null;
};

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

// Helper para formatear precios con separador de miles (12900 -> 12.900)
const formatPrice = (price: number): string => {
  return price.toLocaleString('ro-RO');
};

// Cache global del tema para evitar leer localStorage en cada card
let cachedTheme: number | null = null;
const getTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user_card_theme');
    cachedTheme = saved ? parseInt(saved) : 1;
    return cachedTheme;
  }
  return cachedTheme ?? 1;
};

function ProductCardComponent({ product, priority = false, showConditionInPrice = false }: { product: Product; priority?: boolean; showConditionInPrice?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: favoriteIds, mutate: mutateFavorites } = useUserFavorites(user?.uid || null);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  // Initialize theme from localStorage immediately to prevent flash
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_card_theme');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  
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
  
  // Load theme on mount and listen for changes
  useEffect(() => {
    const loadTheme = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_card_theme');
        const newTheme = saved ? parseInt(saved) : 1;
        cachedTheme = newTheme;
        setTheme(newTheme);
      }
    };
    
    // Load immediately on mount
    loadTheme();
    
    // Listen for changes from settings
    const handleThemeChange = () => {
      loadTheme();
    };
    
    window.addEventListener('themeChange', handleThemeChange);
    
    // Also listen for storage changes (cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user_card_theme') {
        loadTheme();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Use images array if exists, otherwise single image
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : product.image || '/placeholder.jpg';

  const ImageCarousel = ({ heightClass = "h-56" }: { heightClass?: string }) => (
    <div className={`relative ${heightClass} w-full overflow-hidden bg-gray-100`}>
        {/* Imagen única optimizada */}
        <Image
          src={mainImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
          className="object-cover object-center"
          style={{ objectPosition: 'center 30%' }}
          priority={priority}
          quality={50}
        />

        {product.reserved && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-md backdrop-blur-sm pointer-events-none">
                Reservat
            </div>
        )}

        {/* Badge de promoción - top right - visible on hover */}
        {getPromotionBadgeInfo(product) && (
          <div className={`absolute top-2 right-2 p-1.5 rounded-lg flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${getPromotionBadgeInfo(product)?.color}`}>
            {(() => {
              const Icon = getPromotionBadgeInfo(product)?.icon;
              return Icon ? <Icon className="w-4 h-4" /> : null;
            })()}
          </div>
        )}

        {/* Badge de condición - ocultar si showConditionInPrice está activo */}
        {!showConditionInPrice && !product.reserved && getConditionInfo(product.condition) && (
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
                        <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`shrink-0 transition-colors ${isFavorited ? 'text-red-500' : 'text-slate-300 hover:text-red-500'}`}>
                          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate opacity-75">Electronics › Generic</div>
                 </div>
                 <div className="mt-2">
                    <span className="block text-base font-bold text-slate-900">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
                 </div>
              </div>
           </div>
           <div className="px-3 py-2 bg-slate-50 flex justify-between items-center text-[11px] text-slate-500 border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{getRelativeTime(product.publishedAt)}</span>
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
                 <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm z-20 transition-all group-hover:scale-110 ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                 </button>
            </div>
            <div className="px-1 flex-1 flex flex-col">
                 <div className="flex justify-between items-start">
                     <h4 className="font-medium text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-teal-600">{product.title}</h4>
                     <p className="font-bold text-gray-900 text-base whitespace-nowrap ml-2">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</p>
                 </div>
                 <p className="text-sm text-gray-500 mt-1">Stare bună</p>
            </div>
         </div>
       </Link>
    );
  }

  // THEME 6: Social Connect (Vinted Style) - Sin carrusel
  if (theme === 6) {
    return (
      <div className="relative h-full">
        <Link href={createProductLink(product)} className="block h-full"> 
          <div className="group bg-transparent h-full flex flex-col cursor-pointer">
            <div className="relative mb-2">
                <div className="aspect-[4/5] rounded-xl overflow-hidden relative ring-1 ring-black/5 group-hover:ring-2 group-hover:ring-[#13C1AC]/40 transition-all duration-300">
                    {/* Imagen única sin carrusel */}
                    <Image
                      src={mainImage}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: 'center 30%' }}
                      priority={priority}
                      quality={50}
                    />
                    {/* Badge de promoción - visible on hover */}
                    {getPromotionBadgeInfo(product) && (
                      <div className={`absolute top-2 right-2 p-1.5 rounded-lg flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${getPromotionBadgeInfo(product)?.color}`}>
                        {(() => {
                          const Icon = getPromotionBadgeInfo(product)?.icon;
                          return Icon ? <Icon className="w-4 h-4" /> : null;
                        })()}
                      </div>
                    )}
                </div>
            </div>
            
            <div className="px-1 flex flex-col">
                <div className="flex justify-between items-start mb-0.5">
                   <div className="flex items-center gap-2">
                     <h4 className="text-base font-bold text-gray-900">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</h4>
                     {showConditionInPrice && getConditionInfo(product.condition) && (
                       <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${getConditionInfo(product.condition)?.color}`}>
                         {getConditionInfo(product.condition)?.label}
                       </span>
                     )}
                   </div>
                   <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`p-1 -mr-1 rounded-full hover:bg-gray-100 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-900'}`}>
                     <Heart className={`w-5 h-5 stroke-[1.5] ${isFavorited ? 'fill-current' : ''}`} />
                   </button>
                </div>
                
                <h3 className="text-slate-500 text-sm leading-tight mb-2 truncate font-normal">
                  {product.title}
                </h3>
                
                {/* Ubicación y tiempo */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1 truncate">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{product.location}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(product.publishedAt)}
                  </span>
                </div>
                
                <div className={`flex items-center gap-1.5 text-xs ${
                  product.deliveryType === 'shipping' || product.deliveryType === 'both' 
                    ? 'text-purple-500' 
                    : 'text-slate-400'
                }`}>
                     {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? (
                       <Truck className="w-3.5 h-3.5" />
                     ) : (
                       <Users className="w-3.5 h-3.5" />
                     )}
                    <span className="truncate">
                      {product.deliveryType === 'shipping' ? 'Livrare disponibilă' : 
                       product.deliveryType === 'both' ? 'Ambele opțiuni' : 
                       'Predare personală'}
                    </span>
                </div>
            </div>
          </div>
        </Link>
      </div>
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
                     <h4 className="text-base font-bold text-gray-900 mb-1">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</h4>
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

  // THEME 8: Compact Card (User Requested) - Sin carrusel
  if (theme === 8) {
    const conditionData = getConditionInfo(product.condition);
    const CondIcon = conditionData?.icon;
    
    return (
      <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative h-full flex flex-col ring-1 ring-gray-100/50">
          <div className="relative p-2 pb-0">
             <div className="aspect-square relative overflow-hidden rounded-xl ring-1 ring-gray-100">
                <Image
                  src={product.images?.[0] || product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  quality={75}
                />
                {/* Badge de promoción - visible on hover */}
                {getPromotionBadgeInfo(product) && (
                  <div className={`absolute top-2 right-2 p-1.5 rounded-lg flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${getPromotionBadgeInfo(product)?.color}`}>
                    {(() => {
                      const Icon = getPromotionBadgeInfo(product)?.icon;
                      return Icon ? <Icon className="w-4 h-4" /> : null;
                    })()}
                  </div>
                )}
             </div>
          </div>
          
          <div className="p-4 flex flex-col flex-1">
             <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors tracking-tight">{product.title}</h4>
             <p className="text-xs text-slate-500 mb-4">Postat de {product.seller?.name || 'Utilizator'}</p>
             
             <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#13C1AC] text-base">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
                  {showConditionInPrice && conditionData && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${conditionData.color}`}>
                      {conditionData.label}
                    </span>
                  )}
                </div>
                <span className="bg-gray-100 text-gray-600 text-[11px] font-medium px-4 py-2 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    Vezi Detalii
                </span>
             </div>
          </div>
        </div>
      </Link>
    );
  }

  // THEME 10: OLX Style (Clean & Professional)
  if (theme === 10) {
    // Helper para formatear fecha completa
    const formatFullDate = (publishedAt?: string | Timestamp): string => {
      if (!publishedAt) return '';
      let date: Date;
      if (typeof publishedAt === 'string') {
        date = new Date(publishedAt);
      } else if (publishedAt && 'seconds' in publishedAt) {
        date = new Date(publishedAt.seconds * 1000);
      } else {
        return '';
      }
      const day = date.getDate();
      const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // Formatear precio con decimales estilo OLX (3572.12 -> "3 572,12")
    const formatOLXPrice = (price: number): string => {
      return price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ' ');
    };

    return (
      <Link href={createProductLink(product)} className="block h-full">
        <div className="group bg-white h-full flex flex-col cursor-pointer rounded-lg shadow-sm border border-gray-100">
          {/* Image - esquinas redondeadas arriba */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg">
            <Image
              src={mainImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              className="object-cover object-center"
              priority={priority}
              quality={60}
            />
            {/* Badge de promoción en esquina superior derecha */}
            {getPromotionBadgeInfo(product) && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${getPromotionBadgeInfo(product)?.color}`}>
                {getPromotionBadgeInfo(product)?.label}
              </div>
            )}
          </div>
          
          {/* Content - con padding */}
          <div className="p-3 pt-3 flex flex-col flex-1">
            {/* Title + Heart - exactamente como OLX */}
            <div className="flex items-start gap-2 mb-2">
              <h3 className="flex-1 text-[15px] font-semibold text-slate-700 leading-tight line-clamp-2">
                {product.title}
              </h3>
              <button 
                onClick={handleFavoriteClick} 
                disabled={isFavoriteLoading} 
                className={`shrink-0 mt-0.5 transition-colors ${isFavorited ? 'text-red-500' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} strokeWidth={1.5} />
              </button>
            </div>
            
            {/* Price - grande y en negrita */}
            <p className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">
              {formatOLXPrice(product.price)} <span className="text-[18px]">{product.currency === 'EUR' ? '€' : 'lei'}</span>
            </p>
            
            {/* Location - color teal */}
            <p className="text-[#009999] text-sm mb-0.5">
              {product.location}
            </p>
            
            {/* Date */}
            <p className="text-slate-400 text-sm">
              {formatFullDate(product.publishedAt)}
            </p>
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
            {product.reserved && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded-md backdrop-blur-sm">
                Reservat
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-[#13C1AC]">{formatPrice(product.price)} <span className="text-xs font-medium text-gray-500">{product.currency === 'EUR' ? '€' : 'Lei'}</span></p>
              {showConditionInPrice && getConditionInfo(product.condition) && (
                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${getConditionInfo(product.condition)?.color}`}>
                  {getConditionInfo(product.condition)?.label}
                </span>
              )}
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
                {getRelativeTime(product.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // DEFAULT (THEME 1: Vinted Style) - Similar al Theme 6
  const defaultConditionData = getConditionInfo(product.condition);
  
  return (
    <div className="relative h-full">
      <Link href={createProductLink(product)} className="block h-full"> 
        <div className="group bg-transparent h-full flex flex-col cursor-pointer">
          <div className="relative mb-2">
              <div className="aspect-[4/5] rounded-xl overflow-hidden relative ring-1 ring-black/5 group-hover:ring-2 group-hover:ring-[#13C1AC]/40 transition-all duration-300">
                  {/* Imagen única sin carrusel */}
                  <Image
                    src={mainImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: 'center 30%' }}
                    priority={priority}
                    quality={50}
                  />
                  {/* Badge de promoción - visible on hover */}
                  {getPromotionBadgeInfo(product) && (
                    <div className={`absolute top-2 right-2 p-1.5 rounded-lg flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${getPromotionBadgeInfo(product)?.color}`}>
                      {(() => {
                        const Icon = getPromotionBadgeInfo(product)?.icon;
                        return Icon ? <Icon className="w-4 h-4" /> : null;
                      })()}
                    </div>
                  )}
                  {/* Badge Reservat */}
                  {product.reserved && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded-md backdrop-blur-sm z-20">
                          Reservat
                      </div>
                  )}
              </div>
          </div>
          
          <div className="px-1 flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                 <h4 className="text-base font-bold text-gray-900">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</h4>
                 <button onClick={handleFavoriteClick} disabled={isFavoriteLoading} className={`p-1 -mr-1 rounded-full hover:bg-gray-100 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
                   <Heart className={`w-5 h-5 stroke-[1.5] ${isFavorited ? 'fill-current' : ''}`} />
                 </button>
              </div>
              
              <h3 className="text-slate-500 text-sm leading-tight mb-2 truncate font-normal">
                {product.title}
              </h3>
              
              {/* Ubicación y tiempo */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{product.location}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {getRelativeTime(product.publishedAt)}
                </span>
              </div>
              
              {/* Tipo de entrega */}
              <div className={`flex items-center gap-1.5 text-xs ${
                product.deliveryType === 'shipping' || product.deliveryType === 'both' 
                  ? 'text-purple-500' 
                  : 'text-slate-400'
              }`}>
                   {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? (
                     <Truck className="w-3.5 h-3.5" />
                   ) : (
                     <Users className="w-3.5 h-3.5" />
                   )}
                  <span className="truncate">
                    {product.deliveryType === 'shipping' ? 'Livrare disponibilă' : 
                     product.deliveryType === 'both' ? 'Ambele opțiuni' : 
                     'Predare personală'}
                  </span>
              </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Memoized export to prevent unnecessary re-renders
// Note: Theme changes are handled via useState inside the component
export default memo(ProductCardComponent);
