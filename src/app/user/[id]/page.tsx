'use client';

import { useState, use, useEffect } from 'react';
import { Product } from '@/lib/products-service';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import { MapPin, Star, Calendar, ShieldCheck, Package, Lock, UserPlus, UserMinus, Loader2, TrendingUp, ShoppingBag, Truck, ExternalLink } from 'lucide-react';
import { useUserProducts, useUserProfile, useIsFollowing, useCanViewProfile, invalidateFollowingCache } from '@/lib/swr-hooks';
import { followUser, unfollowUser } from '@/lib/followers-service';
import Avatar from '@/components/Avatar';
import { formatPublicName } from '@/lib/messages';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews'>('selling');
  const [currentTheme, setCurrentTheme] = useState(1);
  const [followLoading, setFollowLoading] = useState(false);
  
  // SWR para productos del usuario - carga instantánea
  const { data: products, isLoading: loading } = useUserProducts(id);
  
  // SWR para perfil del usuario (foto actualizada y settings de privacidad)
  const { data: userProfile, mutate: mutateProfile } = useUserProfile(id);

  // Verificar si el usuario actual sigue a este perfil
  const { data: isFollowingUser, mutate: mutateFollowing } = useIsFollowing(user?.uid || null, id);

  // Verificar si puede ver el perfil
  const { data: canViewData, mutate: mutateCanView } = useCanViewProfile(user?.uid || null, id);

  // Listen for theme changes
  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('user_card_theme');
      if (saved) setCurrentTheme(parseInt(saved));
    };
    loadTheme();
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login?redirect=' + encodeURIComponent(`/user/${id}`);
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(user.uid, id);
      } else {
        await followUser(user.uid, id);
      }
      // Invalidar caches
      await invalidateFollowingCache(user.uid, id);
      mutateFollowing();
      mutateCanView();
      mutateProfile();
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#13C1AC] border-t-transparent"></div>
          <span className="text-sm text-gray-500">Se încarcă...</span>
        </div>
      </div>
    );
  }

  // Verificar si el usuario existe (tiene productos o perfil)
  const hasProducts = products && products.length > 0;
  const hasProfile = userProfile !== null;

  if (!hasProducts && !hasProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Utilizator negăsit</h1>
        <p className="text-gray-500 text-sm text-center">Acest utilizator nu există.</p>
      </div>
    );
  }

  // Get user info from profile or first product
  // Get location from profile or from first product
  const userLocation = userProfile?.location || (hasProducts ? products![0].location : null);
  
  const profileUser = userProfile ? {
    name: userProfile.displayName || 'Usuario',
    avatar: userProfile.photoURL,
    rating: typeof userProfile.rating === 'object' ? ((userProfile.rating as { average?: number })?.average || 0) : (userProfile.rating || 0),
    reviews: typeof userProfile.rating === 'object' ? ((userProfile.rating as { count?: number })?.count || 0) : (userProfile.reviewsCount || 0),
    joined: userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).getFullYear().toString() : '2024',
    followers: userProfile.stats?.followers || 0,
    following: userProfile.stats?.following || 0,
    sales: userProfile.stats?.sales || 0,
    purchases: userProfile.stats?.purchases || 0,
    shipments: userProfile.stats?.shipments || 0,
    location: userLocation
  } : hasProducts ? {
    ...products![0].seller,
    followers: 0,
    following: 0,
    sales: 0,
    purchases: 0,
    shipments: 0,
    location: products![0].location || null
  } : null;

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Utilizator negăsit</h1>
        <p className="text-gray-500 text-sm text-center">Acest utilizator nu există.</p>
      </div>
    );
  }

  // Es el dueño del perfil
  const isOwner = user?.uid === id;

  // Verificar si puede ver el contenido
  const canView = canViewData?.canView ?? true;
  const isProfilePrivate = userProfile?.settings?.profileVisible === false;

  // Filtrar productos no vendidos para mostrar
  const activeProducts = products?.filter(p => !p.sold) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-12">
      {/* Header / Cover - Gradient for premium look */}
      <div className="bg-gradient-to-br from-[#13C1AC] via-[#11b5a1] to-[#0ea693] h-20 sm:h-32 w-full absolute top-14 sm:top-16 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 pt-6 sm:pt-12">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-6">
            {/* Top section - Avatar, Info, Buttons */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <Avatar 
                            src={profileUser.avatar} 
                            name={profileUser.name} 
                            size="xl" 
                            className="border-4 border-white shadow-lg w-20 h-20 sm:w-28 sm:h-28"
                        />
                         <div className="absolute -bottom-1 -right-1 sm:bottom-1 sm:right-1 bg-white rounded-full p-1 shadow-md" title="Perfil verificat">
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#13C1AC] fill-current" />
                         </div>
                    </div>
                    
                    {/* Info */}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatPublicName(profileUser.name)}</h1>
                        
                        {/* Rating & Join date - Compact row on mobile */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start text-[11px] sm:text-sm text-gray-500 gap-2 sm:gap-4 mt-1">
                             <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current mr-0.5 sm:mr-1" />
                                <span className="font-semibold text-yellow-700">{profileUser.rating || 0}</span>
                                <span className="text-yellow-600 ml-0.5">({profileUser.reviews || 0})</span>
                             </div>
                             <div className="flex items-center">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Pe Vindel din</span> {profileUser.joined || '2024'}
                             </div>
                        </div>
                        
                        {/* Followers/Following stats - Compact on mobile */}
                        <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-[11px] sm:text-sm mt-2">
                          <span className="text-gray-600">
                            <strong className="text-gray-900">{profileUser.followers}</strong> urmăritori
                          </span>
                          <span className="text-gray-600">
                            <strong className="text-gray-900">{profileUser.following}</strong> urmărește
                          </span>
                        </div>
                    </div>
                </div>
                
                {/* Buttons - Chat & Follow */}
                {!isOwner && (
                  <div className="mt-3 sm:mt-4 flex gap-2 w-full sm:w-auto">
                       <Link 
                          href={user ? `/messages?user=${id}` : `/login?redirect=/messages?user=${id}`}
                          className="flex-1 sm:flex-none border-2 border-[#13C1AC] text-[#13C1AC] bg-white hover:bg-[#13C1AC]/5 font-semibold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm text-center active:scale-95"
                       >
                          Mesaj
                      </Link>
                       <button 
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`flex-1 sm:flex-none font-semibold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 active:scale-95 ${
                            isFollowingUser 
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200' 
                              : 'bg-[#13C1AC] text-white hover:bg-[#10a593] shadow-md shadow-[#13C1AC]/20'
                          }`}
                       >
                          {followLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFollowingUser ? (
                            <>
                              <UserMinus className="h-4 w-4" />
                              <span>Urmărești</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              <span>Urmărește</span>
                            </>
                          )}
                      </button>
                  </div>
                )}
            </div>
            
            {/* Stats Section - Compact horizontal scroll on mobile */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-6 pb-4 sm:pb-6 border-t border-gray-100 sm:border-t">
              <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {/* Ventas */}
                <div className="flex-shrink-0 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 sm:bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">{profileUser.sales}</span>
                    <span className="text-[10px] sm:text-sm text-gray-500">Vânzări</span>
                  </div>
                </div>
                
                {/* Compras */}
                <div className="flex-shrink-0 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 sm:bg-blue-50 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">{profileUser.purchases}</span>
                    <span className="text-[10px] sm:text-sm text-gray-500">Cumpărări</span>
                  </div>
                </div>
                
                {/* Envíos */}
                <div className="flex-shrink-0 flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-100 sm:bg-purple-50 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">{profileUser.shipments}</span>
                    <span className="text-[10px] sm:text-sm text-gray-500">Livrări</span>
                  </div>
                </div>
                
                {/* Ubicación */}
                {profileUser.location && (
                  <div className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 sm:bg-gray-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                      {typeof profileUser.location === 'string' 
                        ? profileUser.location 
                        : (profileUser.location as { city?: string; name?: string })?.city || (profileUser.location as { city?: string; name?: string })?.name || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Private Profile Notice - Si el perfil es privado y no puede verlo */}
        {!canView && isProfilePrivate && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 mb-3 sm:mb-6 text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Lock className="h-7 w-7 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Profil privat</h2>
            <p className="text-gray-500 text-xs sm:text-base mb-4 max-w-xs mx-auto">
              Urmărește acest utilizator pentru a vedea produsele sale.
            </p>
            {!user && (
              <Link 
                href={`/login?redirect=/user/${id}`}
                className="inline-block bg-[#13C1AC] text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-[#10a593] transition-all text-sm active:scale-95"
              >
                Conectează-te
              </Link>
            )}
          </div>
        )}

        {/* Navigation Tabs - Solo si puede ver */}
        {canView && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-6">
              {/* Tab buttons */}
              <div className="flex border-b border-gray-100">
                  <button 
                      onClick={() => setActiveTab('selling')}
                      className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-center transition-all relative ${
                        activeTab === 'selling' 
                          ? 'text-[#13C1AC]' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      În vânzare
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${
                        activeTab === 'selling' 
                          ? 'bg-[#13C1AC]/10 text-[#13C1AC]' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {activeProducts.length}
                      </span>
                      {activeTab === 'selling' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#13C1AC] rounded-full" />
                      )}
                  </button>
                  <button 
                      onClick={() => setActiveTab('reviews')}
                      className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-center transition-all relative ${
                        activeTab === 'reviews' 
                          ? 'text-[#13C1AC]' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Recenzii
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${
                        activeTab === 'reviews' 
                          ? 'bg-[#13C1AC]/10 text-[#13C1AC]' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {profileUser.reviews || 0}
                      </span>
                      {activeTab === 'reviews' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#13C1AC] rounded-full" />
                      )}
                  </button>
              </div>

              {/* Tab content */}
              <div className="p-2 sm:p-6">
                  {activeTab === 'selling' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                          {activeProducts.map(product => (
                              <ProductCard key={`${product.id}-theme-${currentTheme}`} product={product} />
                          ))}
                           {activeProducts.length === 0 && (
                              <div className="col-span-full text-center py-8 sm:py-10">
                                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-500 text-xs sm:text-sm">Nu are produse în vânzare</p>
                              </div>
                          )}
                      </div>
                  )}

                  {activeTab === 'reviews' && (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                          <Star className="h-10 w-10 sm:h-12 sm:w-12 text-gray-200 mb-2" />
                          <p className="text-gray-500 text-xs sm:text-sm">Nu există recenzii încă</p>
                      </div>
                  )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
