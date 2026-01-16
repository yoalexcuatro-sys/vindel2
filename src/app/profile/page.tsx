'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { deleteProduct, Product } from '@/lib/products-service';
import { createProductLink } from '@/lib/slugs';
import { uploadAvatar } from '@/lib/storage-service';
import { useFavoriteProducts, useMyProducts, useNotifications, invalidateMyProductsCache, invalidateNotificationsCache } from '@/lib/swr-hooks';
import ProductCard from '@/components/ProductCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, Settings, Heart, User, Package, Clock, CheckCircle2, 
  ChevronRight, LayoutGrid, LogOut, BadgeCheck, Pencil, 
  FileText, Download, Megaphone, TrendingUp, Trash2, Building2, 
  Eye, Euro, BarChart3, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Receipt, Activity, Bell, Lock, List, Ban, AlertCircle, Loader2, Camera,
  Flag, ExternalLink, HeadphonesIcon, Globe, Monitor, AlertTriangle
} from 'lucide-react';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '@/lib/notifications-service';
import { subscribeToUserTickets, SupportTicket, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/support-service';

type ViewType = 'dashboard' | 'products' | 'profile' | 'favorites' | 'settings' | 'invoices' | 'promotion' | 'analytics' | 'notifications' | 'support';

// Wrapper component to handle Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfileLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#13C1AC]" />
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, logout, loading: authLoading, profileLoading, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [productFilter, setProductFilter] = useState<'active' | 'pending' | 'sold' | 'rejected'>('active');
  const [favoritesViewMode, setFavoritesViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCardTheme, setSelectedCardTheme] = useState<number>(() => {
    // Cargar tema guardado inmediatamente al inicializar
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_card_theme');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [themeInitialized, setThemeInitialized] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{ show: boolean; reason: string; productTitle: string }>({ show: false, reason: '', productTitle: '' });
  
  // ============================================
  // HOOKS CON CACHÉ SWR - Carga instantánea
  // ============================================
  
  // Productos del usuario con caché persistente
  const { data: products = [], isLoading: productsLoading, mutate: mutateProducts } = useMyProducts(user?.uid || null);
  
  // Favoritos con caché
  const { data: favoriteProducts, isLoading: favoritesLoading } = useFavoriteProducts(user?.uid || null);
  
  // Notificaciones con caché - siempre activo para mantener caché
  const { data: notifications = [], isLoading: notificationsLoading, mutate: mutateNotifications } = useNotifications(user?.uid || null);
  
  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(true);
  
  const isBusiness = userProfile?.accountType === 'business';

  // ============================================
  // PRODUCTOS FILTRADOS CON MEMO - evita recálculos
  // ============================================
  
  const filteredProducts = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      // Pending: tiene status pending Y (tiene pendingUntil válido O no tiene pendingUntil - fue re-enviado)
      const isPending = p.status === 'pending' && (!p.pendingUntil || new Date(p.pendingUntil.seconds * 1000) > now);
      // Approved: status approved, o pending expirado, o sin status
      const isApproved = p.status === 'approved' || (p.status === 'pending' && p.pendingUntil && new Date(p.pendingUntil.seconds * 1000) <= now) || !p.status;
      const isRejected = p.status === 'rejected';
      
      if (productFilter === 'active') return !p.sold && isApproved;
      if (productFilter === 'sold') return p.sold;
      if (productFilter === 'pending') return isPending;
      if (productFilter === 'rejected') return isRejected;
      return false;
    });
  }, [products, productFilter]);

  // Marcar como inicializado después del primer render
  useEffect(() => {
    setThemeInitialized(true);
  }, []);

  // Handle URL param for tab - reacts to URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    
    if (tab === 'notifications') {
      setActiveView('notifications');
      // Force refresh notifications when navigating to this tab
      if (user?.uid) {
        mutateNotifications();
      }
    } else if (tab === 'listings' || view === 'products') {
      setActiveView('products');
    } else if (tab === 'settings') {
      setActiveView('settings');
    } else if (tab === 'favorites') {
      setActiveView('favorites');
    } else if (tab === 'profile') {
      setActiveView('profile');
    } else if (tab === 'support') {
      setActiveView('support');
    }
  }, [searchParams, user?.uid, mutateNotifications]);

  useEffect(() => {
    // Solo guardar si ya se inicializó (evita guardar el valor por defecto)
    if (typeof window !== 'undefined' && themeInitialized) {
        localStorage.setItem('user_card_theme', selectedCardTheme.toString());
        window.dispatchEvent(new Event('themeChange'));
    }
  }, [selectedCardTheme, themeInitialized]);

  // Load support tickets
  useEffect(() => {
    if (!user?.uid) {
      setSupportTickets([]);
      setSupportTicketsLoading(false);
      return;
    }
    
    setSupportTicketsLoading(true);
    const unsubscribe = subscribeToUserTickets(user.uid, (tickets) => {
      setSupportTickets(tickets);
      setSupportTicketsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // ============================================
  // CALLBACKS MEMORIZADOS - evitan re-renders
  // ============================================

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Te rog selectează o imagine validă.');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea este prea mare. Maxim 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoURL = await uploadAvatar(file, user.uid);
      await updateUserProfile({ photoURL });
      alert('Fotografia de profil a fost actualizată!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Nu s-a putut încărca fotografia. Încearcă din nou.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [user, updateUserProfile]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (confirm('Ești sigur că vrei să ștergi acest anunț?')) {
      try {
        await deleteProduct(productId);
        // Actualizar caché local inmediatamente (optimistic update)
        mutateProducts(
          products.filter(p => p.id !== productId),
          { revalidate: false }
        );
        // Invalidar caché para próxima visita
        if (user?.uid) {
          invalidateMyProductsCache(user.uid);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Nu s-a putut șterge anunțul. Încearcă din nou.');
      }
    }
  }, [products, mutateProducts, user?.uid]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (user) {
      await markAllNotificationsAsRead(user.uid);
      mutateNotifications(
        notifications.map(n => ({ ...n, read: true })),
        { revalidate: false }
      );
    }
  }, [user, notifications, mutateNotifications]);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      mutateNotifications(
        notifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ),
        { revalidate: false }
      );
    }
    // Use the link stored in notification (should be /anunturi/... URL)
    if (notification.link) {
      router.push(notification.link);
    }
  }, [notifications, mutateNotifications, router]);

  const handleDeleteNotification = useCallback(async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Evitar que se active el click del contenedor
    try {
      await deleteNotification(notificationId);
      mutateNotifications(
        notifications.filter(n => n.id !== notificationId),
        { revalidate: false }
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, mutateNotifications]);

  // Memoized menu items - evita recreación en cada render
  const menuItems = useMemo(() => [
    { id: 'dashboard', label: 'Panou de control', icon: LayoutGrid },
    ...(isBusiness ? [{ id: 'analytics', label: 'Statistici', icon: BarChart3 }] : []),
    { id: 'products', label: 'Anunțurile mele', icon: Package },
    { id: 'notifications', label: 'Notificări', icon: Bell },
    { id: 'support', label: 'Suport', icon: HeadphonesIcon },
    { id: 'profile', label: 'Datele mele', icon: User },
    { id: 'favorites', label: 'Favorite', icon: Heart },
    { id: 'invoices', label: 'Facturi', icon: FileText },
    { id: 'promotion', label: 'Promovare', icon: Megaphone },
    { id: 'settings', label: 'Setări', icon: Settings },
  ], [isBusiness]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Skeleton */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-center pb-5 border-b border-gray-100">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                  <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                  <div className="h-4 w-24 mx-auto skeleton-shimmer rounded"></div>
                </div>
                <nav className="mt-5 space-y-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                  ))}
                </nav>
              </div>
            </aside>
            {/* Main Content Skeleton */}
            <main className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                <div className="h-4 w-48 skeleton-shimmer rounded"></div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="w-10 h-10 skeleton-shimmer rounded-xl mb-3"></div>
                    <div className="h-7 w-20 skeleton-shimmer rounded mb-2"></div>
                    <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // If no user, redirect to login (handled by ProtectedRoute)
  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <style jsx>{`
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            .skeleton-shimmer {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 1000px 100%;
              animation: shimmer 2s infinite;
            }
          `}</style>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-center pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                    <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                  </div>
                  <nav className="mt-5 space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                    ))}
                  </nav>
                </div>
              </aside>
              <main className="flex-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                  <div className="h-4 w-48 skeleton-shimmer rounded"></div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // If user exists but profile is still loading
  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <style jsx>{`
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            .skeleton-shimmer {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 1000px 100%;
              animation: shimmer 2s infinite;
            }
          `}</style>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-center pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                    <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                    <div className="h-4 w-24 mx-auto skeleton-shimmer rounded"></div>
                  </div>
                  <nav className="mt-5 space-y-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                    ))}
                  </nav>
                </div>
              </aside>
              <main className="flex-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                      <div className="h-4 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div className="h-10 w-32 skeleton-shimmer rounded-xl"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="w-10 h-10 skeleton-shimmer rounded-xl mb-3"></div>
                      <div className="h-7 w-20 skeleton-shimmer rounded mb-2"></div>
                      <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // If user exists and profile loading finished, but no profile found
  if (!userProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md mx-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profil Inexistent</h2>
            <p className="text-gray-500 mb-6">
              Nu am putut găsi profilul tău. Este posibil să fi apărut o eroare la înregistrare.
            </p>
            <button
               onClick={handleLogout}
               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-[#13C1AC] hover:bg-[#0da896]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Deconectează-te
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className={isBusiness ? 'min-h-screen bg-slate-900' : 'min-h-screen bg-gray-50 relative'}>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.4s ease-out forwards; }
        .animate-fadeInScale { animation: fadeInScale 0.4s ease-out forwards; }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
        
        /* Hide scrollbar */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Background Waves for entire page */}
      {!isBusiness && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-64 hidden sm:block">
            <path fill="#13C1AC" fillOpacity="0.05" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-48 hidden sm:block">
            <path fill="#13C1AC" fillOpacity="0.08" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>
      )}

      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-16 z-40">
        {/* User Info Bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile.photoURL ? (
              <Image src={userProfile.photoURL} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#13C1AC] flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{userProfile.displayName || 'Utilizator'}</h2>
              {userProfile.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#13C1AC] font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  Verificat
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/publish"
              className="p-2 bg-[#13C1AC] text-white rounded-full"
            >
              <Package className="w-4 h-4" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-2 pb-2 gap-1 min-w-max">
            {menuItems.map((item) => {
              const unreadCount = item.id === 'notifications' ? notifications.filter(n => !n.read).length : 0;
              const openTicketsCount = item.id === 'support' ? supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ViewType)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeView === item.id
                      ? 'bg-[#13C1AC] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                  {unreadCount > 0 && (
                    <span className="relative flex items-center ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-red-500">
                        {unreadCount}
                      </span>
                    </span>
                  )}
                  {openTicketsCount > 0 && (
                    <span className="relative flex items-center ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-amber-500">
                        {openTicketsCount}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* ===== SIDEBAR (Hidden on mobile) ===== */}
          <aside className="hidden lg:block w-64 shrink-0 animate-fadeInLeft">
            <div className={`rounded-2xl overflow-hidden relative ${isBusiness ? 'bg-slate-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
              
              {/* Decorative Waves Background in Sidebar */}
              <div className="absolute top-0 left-0 right-0 h-28 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,100 C150,140 350,60 500,100 L500,0 L0,0 Z" className={isBusiness ? 'fill-teal-600/30' : 'fill-[#13C1AC]/20'}></path>
                </svg>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,70 C100,110 400,30 500,70 L500,0 L0,0 Z" className={isBusiness ? 'fill-teal-500/20' : 'fill-[#13C1AC]/10'}></path>
                </svg>
              </div>
              
              <div className="p-5 relative z-10">
              {/* Avatar/Logo */}
              <div className={`text-center pb-5 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-100'}`}>
                {isBusiness ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-3 ring-4 ring-white/20 shadow-lg">
                      <Building2 className="w-9 h-9 text-white" />
                    </div>
                    <h2 className="font-bold text-white text-lg">{userProfile.businessName}</h2>
                    <p className="text-slate-400 text-sm mt-1">{userProfile.cui}</p>
                  </>
                ) : (
                  <>
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      {userProfile.photoURL ? (
                        <Image src={userProfile.photoURL} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#13C1AC] flex items-center justify-center ring-4 ring-gray-100 shadow-md">
                          <span className="text-2xl font-bold text-white">
                            {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">{userProfile.displayName || 'Utilizator'}</h2>
                  </>
                )}
                
                {userProfile.verified && (
                  <span className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-semibold ${isBusiness ? 'bg-teal-500/20 text-teal-400' : 'bg-[#13C1AC]/10 text-[#13C1AC] border border-[#13C1AC]/20'}`}>
                    <BadgeCheck className="w-4 h-4" />
                    {isBusiness ? 'Firmă Verificată' : 'Verificat'}
                  </span>
                )}
              </div>

              {/* Menu */}
              <nav className="mt-5 space-y-1">
                {menuItems.map((item) => {
                  const unreadCount = item.id === 'notifications' ? notifications.filter(n => !n.read).length : 0;
                  const openTicketsCount = item.id === 'support' ? supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id as ViewType)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeView === item.id
                          ? 'bg-[#13C1AC] text-white shadow-md shadow-[#13C1AC]/20'
                          : isBusiness 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {unreadCount > 0 && (
                        <span className="relative flex items-center ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-red-500">
                            {unreadCount}
                          </span>
                        </span>
                      )}
                      {openTicketsCount > 0 && (
                        <span className="relative flex items-center ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-amber-500">
                            {openTicketsCount}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
                
                <div className={`pt-4 mt-4 border-t ${isBusiness ? 'border-slate-700' : 'border-gray-100'}`}>
                  <button 
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isBusiness ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    Deconectare
                  </button>
                </div>
              </nav>
              </div>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 min-w-0">
            
            {/* ========== DASHBOARD ========== */}
            {activeView === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Welcome Banner */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fadeInUp ${isBusiness ? 'bg-gradient-to-r from-teal-600 to-teal-500' : 'bg-white border border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className={`text-lg sm:text-2xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Salut, {(userProfile.displayName || 'Utilizator').split(' ')[0]}! 👋
                      </h1>
                      <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${isBusiness ? 'text-teal-100' : 'text-gray-500'}`}>
                        {isBusiness ? 'Iată performanța afacerii tale' : 'Iată un rezumat al activității tale'}
                      </p>
                    </div>
                    <Link 
                      href="/publish"
                      className={`hidden sm:inline-flex px-5 py-2.5 rounded-xl font-semibold transition-colors ${
                        isBusiness ? 'bg-white text-teal-600 hover:bg-teal-50' : 'bg-teal-500 text-white hover:bg-teal-600'
                      }`}
                    >
                      + Adaugă anunț
                    </Link>
                  </div>
                </div>

                {/* Stats Grid - BUSINESS */}
                {isBusiness && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Venituri */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <Euro className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +12.5%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">45.600 lei</p>
                      <p className="text-sm text-slate-400 mt-1">Venituri totale</p>
                    </div>

                    {/* Comenzi */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +8.2%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">156</p>
                      <p className="text-sm text-slate-400 mt-1">Comenzi</p>
                    </div>

                    {/* Vizualizări */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +23.1%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">12.4K</p>
                      <p className="text-sm text-slate-400 mt-1">Vizualizări</p>
                    </div>

                    {/* Conversie */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-400">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-red-400">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          -0.4%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">3.2%</p>
                      <p className="text-sm text-slate-400 mt-1">Rată conversie</p>
                    </div>
                  </div>
                )}

                {/* Stats Grid - PERSONAL */}
                {!isBusiness && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {/* Active Products */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#13C1AC]/5 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-[#13C1AC]/10 rounded-lg text-[#13C1AC]">
                                    <Package className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full uppercase">
                                    Activ
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{products.length}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Anunțuri active</p>
                        </div>
                    </div>

                    {/* Sold */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.stats.sold}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Produse vândute</p>
                        </div>
                    </div>

                    {/* Favorites */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-red-500">
                                    <Heart className="w-4 h-4" />
                                </div>
                                {favoriteProducts && favoriteProducts.length > 0 && (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full uppercase">
                                      Salvate
                                  </span>
                                )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{favoriteProducts?.length || 0}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Favorite salvate</p>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg text-amber-500">
                                    <Star className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                                    Top Seller
                                </span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.rating}</h3>
                                <span className="text-[10px] text-gray-400">/ 5.0</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500">Rating vânzător</p>
                        </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions - Business */}
                {isBusiness && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Export Date</p>
                        <p className="text-sm text-slate-400">Descarcă rapoarte CSV</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveView('promotion')}
                      className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Promovare</p>
                        <p className="text-sm text-slate-400">Crește vizibilitatea</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveView('invoices')}
                      className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Facturare</p>
                        <p className="text-sm text-slate-400">Generează facturi</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Recent Products */}
                <div className={`rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <div className={`flex items-center justify-between p-5 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`font-medium text-base ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Ultimele Anunțuri</h3>
                    <button 
                      onClick={() => setActiveView('products')}
                      className="text-teal-500 text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      Vezi toate <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {products.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {products.slice(0, 5).map((product) => (
                        <div 
                          key={product.id} 
                          onClick={() => router.push(createProductLink(product))}
                          className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 ${
                            isBusiness 
                              ? 'hover:bg-teal-500/10' 
                              : 'hover:bg-[#13C1AC]/5'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-black/5">
                            <img 
                              src={product.image} 
                              alt={product.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-semibold text-sm sm:text-base truncate ${
                                  isBusiness ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {product.title}
                                </h4>
                                {/* Description */}
                                {product.description && (
                                  <p className={`text-xs mt-1 line-clamp-1 ${
                                    isBusiness ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    {product.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {product.category}
                                  </span>
                                  <span className={`w-1 h-1 rounded-full ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></span>
                                  <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {product.location}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-base sm:text-lg ${
                                  isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'
                                }`}>
                                  {product.price} Lei
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                                  product.status === 'approved' 
                                    ? isBusiness ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                    : product.status === 'pending'
                                    ? isBusiness ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                    : isBusiness ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                                }`}>
                                  {product.status === 'approved' ? 'Activ' : product.status === 'pending' ? 'În așteptare' : 'Respins'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            isBusiness ? 'text-slate-500' : 'text-gray-400'
                          }`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isBusiness ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <Package className={`w-8 h-8 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                      </div>
                      <p className={`font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Nu ai anunțuri încă</p>
                      <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Adaugă primul tău anunț</p>
                      <Link href="/publish" className="inline-block mt-4 px-5 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors">
                        Adaugă anunț
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== ANALYTICS ========== */}
            {activeView === 'analytics' && isBusiness && (
              <div className="space-y-6">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Statistici Performanță</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-400 mb-4">Venituri Lunare</h3>
                      <div className="h-40 flex items-end gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 88].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 text-xs text-slate-500">
                        <span>Ian</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mai</span><span>Iun</span>
                        <span>Iul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                      </div>
                    </div>
                    
                    {/* Categories */}
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-400 mb-4">Top Categorii</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Electronice</span>
                            <span className="text-slate-500">45%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: '45%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Auto</span>
                            <span className="text-slate-500">28%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '28%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Casă & Grădină</span>
                            <span className="text-slate-500">18%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '18%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Altele</span>
                            <span className="text-slate-500">9%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: '9%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== PRODUCTS ========== */}
            {activeView === 'products' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] sm:min-h-[600px] relative">
                {/* Decorative Waves */}
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.12"></path>
                  </svg>
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,40 C200,80 500,10 800,50 C1000,70 1100,30 1200,40 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.06"></path>
                  </svg>
                </div>
                
                <div className="p-4 sm:p-8 border-b border-gray-100 relative z-10">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Anunțurile Mele</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Gestionează starea produselor tale</p>
                </div>
                
                {/* Product Status Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide bg-gray-50/30 relative z-10">
                  {[
                    { id: 'active', label: 'Activ', icon: Package, count: products.filter(p => p.status === 'approved' || (!p.status && !p.sold)).length },
                    { id: 'pending', label: 'În așteptare', icon: Clock, count: products.filter(p => p.status === 'pending').length },
                    { id: 'rejected', label: 'Respins', icon: Ban, count: products.filter(p => p.status === 'rejected').length },
                    { id: 'sold', label: 'Vândute', icon: CheckCircle2, count: products.filter(p => p.sold).length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProductFilter(tab.id as any)}
                      className={`flex flex-1 items-center justify-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 transition-all min-w-[80px] sm:min-w-[120px] ${
                        productFilter === tab.id
                          ? 'border-[#13C1AC] text-[#13C1AC] bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      <tab.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2.5 ${productFilter === tab.id ? 'text-[#13C1AC]' : 'text-gray-400'}`} />
                      <span className="truncate">{tab.label}</span>
                      {tab.count > 0 && (tab.id === 'pending' || tab.id === 'rejected') && (
                        <span className="relative flex items-center ml-1.5 sm:ml-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            tab.id === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                          }`}></span>
                          <span className={`relative text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full text-white ${
                            tab.id === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {tab.count}
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Product List */}
                <div className="p-3 sm:p-4 relative z-10">
                  {productsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#13C1AC] mb-3 sm:mb-4" />
                      <p className="text-sm text-gray-500">Se încarcă anunțurile...</p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="space-y-2 sm:space-y-2.5">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-white to-gray-50/50 rounded-lg sm:rounded-xl border border-gray-200/60 hover:border-[#13C1AC]/30 hover:bg-[#13C1AC]/5 transition-all duration-300 group cursor-pointer">
                          {/* Product Image */}
                          <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 relative rounded-lg overflow-hidden ring-1 ring-gray-200 shadow-sm">
                            <img className="h-full w-full object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-300" src={product.image} alt="" />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-[#13C1AC] transition-colors">{product.title}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5">{product.location}</p>
                            {/* Mobile Price */}
                            <p className="sm:hidden text-xs font-bold text-[#13C1AC] mt-1">{product.price} lei</p>
                          </div>

                          {/* Price - Desktop only */}
                          <div className="hidden sm:block flex-shrink-0 text-center px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-sm font-bold text-yellow-700">{product.price} lei</div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            {productFilter === 'active' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E0F2F1] text-[#13C1AC] border border-[#13C1AC]/30">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                Activ
                              </span>
                            )}
                            {productFilter === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                În moderare
                              </span>
                            )}
                            {productFilter === 'rejected' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                                <Ban className="h-2.5 w-2.5 mr-1" />
                                Respins
                              </span>
                            )}
                            {productFilter === 'sold' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                Vândut
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0">
                            {productFilter === 'active' && (
                              <div className="flex items-center gap-0.5 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                                <button 
                                  onClick={() => router.push(`/publish/edit/${product.id}`)}
                                  className="p-2 text-gray-500 hover:text-[#13C1AC] hover:bg-[#E0F2F1] rounded transition-all duration-200" 
                                  title="Editează"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200" title="Șterge">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            {productFilter === 'pending' && (
                              <div className="flex items-center text-[10px] text-gray-400 font-medium italic">
                                <Clock className="h-3 w-3 mr-1 text-amber-500" />
                                Moderare...
                              </div>
                            )}
                            {productFilter === 'rejected' && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setRejectionModal({ 
                                    show: true, 
                                    reason: product.rejectionReason || 'Anunțul nu respectă regulile platformei.', 
                                    productTitle: product.title 
                                  })}
                                  className="flex items-center px-3 py-1.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all duration-200"
                                >
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Motiv
                                </button>
                                <button 
                                  onClick={() => router.push(`/publish/edit/${product.id}`)}
                                  className="flex items-center px-3 py-1.5 text-[10px] font-bold text-[#13C1AC] bg-[#E0F2F1] hover:bg-[#B2DFDB] border border-[#13C1AC]/30 rounded transition-all duration-200"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Editează
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="flex items-center px-3 py-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded transition-all duration-200"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Șterge
                                </button>
                              </div>
                            )}
                            {productFilter === 'sold' && (
                              <button className="px-3 py-1.5 text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-all duration-200">
                                Vezi
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        {productFilter === 'rejected' ? <Ban className="h-10 w-10" /> : <Package className="h-10 w-10" />}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Nu există anunțuri aici</h3>
                      <p className="text-gray-500 mt-1 max-w-sm">Nu ai produse în această categorie momentan.</p>
                      {productFilter === 'active' && (
                        <Link href="/publish" className="mt-6 px-6 py-2.5 bg-[#13C1AC] text-white rounded-full font-bold shadow-md hover:bg-[#0da896] transition-all">
                          Adaugă produs
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== PROFILE ========== */}
            {activeView === 'profile' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Decorative Waves */}
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.12"></path>
                  </svg>
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,40 C200,80 500,10 800,50 C1000,70 1100,30 1200,40 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.06"></path>
                  </svg>
                </div>
                
                <div className="p-4 sm:p-8 border-b border-gray-100 relative z-10">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Datele Mele</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Informații personale și de contact</p>
                </div>
                
                <div className="p-4 sm:p-8 relative z-10">
                  <form className="space-y-6 sm:space-y-8">
                    {/* Section: Public Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="md:col-span-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Profil Public</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Cum te văd alți utilizatori pe platformă.</p>
                        
                        <div className="mt-4 flex justify-center md:justify-start">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                          >
                            {uploadingPhoto ? (
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-100">
                                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#13C1AC]" />
                              </div>
                            ) : userProfile.photoURL ? (
                              <Image src={userProfile.photoURL} alt="Avatar" width={96} height={96} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover group-hover:opacity-75 transition-opacity ring-4 ring-gray-100" />
                            ) : (
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#13C1AC] flex items-center justify-center ring-4 ring-gray-100 group-hover:opacity-75 transition-opacity">
                                <span className="text-xl sm:text-2xl font-bold text-white">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</span>
                              </div>
                            )}
                            {!uploadingPhoto && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full bg-black/40 transition-opacity">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-[#13C1AC] rounded-full p-1 sm:p-1.5 shadow-lg border-2 border-white">
                              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center md:text-left">Click pentru a schimba</p>
                      </div>

                      <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nume utilizator</label>
                          <input type="text" defaultValue={userProfile.displayName || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea rows={3} defaultValue={userProfile.bio || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50" />
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Descriere scurtă care va apărea în profilul tău.</p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Localitate</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <input type="text" defaultValue={userProfile.location || ''} className="block w-full pl-10 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Section: Private Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="md:col-span-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Date Personale</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Informații private pentru gestionarea contului și verificare.</p>
                      </div>

                      <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" defaultValue={userProfile.email || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input type="tel" defaultValue={userProfile.phone || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700">Verificări</label>
                          
                          {/* Email Verification */}
                          <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-white p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 border border-green-100 shadow-sm">
                                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-green-900">Email verificat</p>
                                <p className="text-xs text-green-700 mt-0.5">Adresa ta de email este confirmată.</p>
                              </div>
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-700 bg-white/50 px-3 py-1 rounded-full border border-green-200">
                              <BadgeCheck className="w-3 h-3 mr-1" />
                              Activ
                            </span>
                          </div>

                          {/* Phone Verification */}
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-white p-2 rounded-full mr-4 border border-green-100 shadow-sm">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-green-900">Telefon verificat</p>
                                <p className="text-xs text-green-700 mt-0.5">Numărul tău de mobil este conectat.</p>
                              </div>
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-700 bg-white/50 px-3 py-1 rounded-full border border-green-200">
                              <BadgeCheck className="w-3 h-3 mr-1" />
                              Activ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-4">
                      <button type="button" className="bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors">
                        Anulează
                      </button>
                      <button type="submit" className="bg-teal-500 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-teal-600 shadow-sm transition-colors">
                        Salvează modificările
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========== FAVORITES ========== */}
            {activeView === 'favorites' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">Favoritele Mele ❤️</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Produse pe care le-ai salvat pentru mai târziu.</p>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-lg sm:rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setFavoritesViewMode('grid')}
                      className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${favoritesViewMode === 'grid' ? 'bg-white text-[#13C1AC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vizualizare Grilă"
                    >
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => setFavoritesViewMode('list')}
                      className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${favoritesViewMode === 'list' ? 'bg-white text-[#13C1AC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vizualizare Listă"
                    >
                      <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Favorites Grid/List */}
                <div className="p-4 sm:p-8">
                  {favoritesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#13C1AC]" />
                    </div>
                  ) : favoriteProducts && favoriteProducts.length > 0 ? (
                    favoritesViewMode === 'grid' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {favoriteProducts.map((product) => (
                          <ProductCard key={`${product.id}-theme-${selectedCardTheme}`} product={product} />
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {favoriteProducts.map((product) => (
                          <div 
                            key={product.id} 
                            onClick={() => router.push(createProductLink(product))}
                            className="flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-[#13C1AC]/5 bg-white"
                          >
                            {/* Product Image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-black/5">
                              <img 
                                src={product.image} 
                                alt={product.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                    {product.title}
                                  </h4>
                                  {product.description && (
                                    <p className="text-xs mt-1 line-clamp-1 text-gray-500">
                                      {product.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {product.category}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-xs text-gray-500">
                                      {product.location}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-base sm:text-lg text-[#13C1AC]">
                                    {product.price} €
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Empty state - no favorites yet */
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 text-gray-300">
                        <Heart className="h-8 w-8 sm:h-10 sm:w-10" />
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">Nu ai favorite încă</h3>
                      <p className="text-gray-500 mt-1 max-w-sm text-xs sm:text-sm px-4">Apasă pe inimă pentru a salva produsele care îți plac.</p>
                      <Link href="/" className="mt-4 sm:mt-6 px-5 sm:px-6 py-2 sm:py-2.5 bg-[#13C1AC] text-white rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-[#0ea896] transition-colors">
                        Explorează produse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== INVOICES ========== */}
            {activeView === 'invoices' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Facturi</h2>
                </div>
                
                {/* Empty state - no invoices yet */}
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${isBusiness ? 'bg-slate-700 text-slate-500' : 'bg-gray-50 text-gray-300'}`}>
                    <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <h3 className={`text-base sm:text-lg font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Nu ai facturi încă</h3>
                  <p className={`mt-1 max-w-sm text-xs sm:text-sm px-4 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Facturile pentru tranzacțiile tale vor apărea aici.</p>
                </div>
              </div>
            )}

            {/* ========== PROMOTION ========== */}
            {activeView === 'promotion' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">Promovează-ți Anunțurile</h2>
                      <p className="text-teal-100 text-xs sm:text-base">Vinde de până la 3x mai rapid cu promovare</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { name: 'Zilnic', price: '9.99', period: 'zi', features: ['Top 24h', 'Badge "Promovat"'] },
                    { name: 'Săptămânal', price: '39.99', period: 'săptămână', features: ['Top 7 zile', 'Badge Premium', 'Pagina principală'], popular: true },
                    { name: 'Lunar', price: '99.99', period: 'lună', features: ['Top 30 zile', 'Badge VIP', 'Toate beneficiile'] },
                  ].map((plan, i) => (
                    <div key={i} className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 ${
                      plan.popular 
                        ? isBusiness ? 'bg-slate-900 border-2 border-teal-500' : 'bg-white border-2 border-teal-500'
                        : isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
                    }`}>
                      {plan.popular && (
                        <span className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-teal-500 text-white text-[10px] sm:text-xs font-bold rounded-full">
                          Popular
                        </span>
                      )}
                      <h3 className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
                        <span className={`text-2xl sm:text-3xl font-black ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                        <span className={`text-xs sm:text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}> lei/{plan.period}</span>
                      </div>
                      <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                        {plan.features.map((f, j) => (
                          <li key={j} className={`flex items-center gap-2 text-xs sm:text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-600'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors ${
                        plan.popular 
                          ? 'bg-teal-500 text-white hover:bg-teal-600' 
                          : isBusiness ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        Alege
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== SETTINGS ========== */}
            {activeView === 'settings' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Setări</h2>
                  <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Gestionează preferințele și securitatea contului tău</p>
                </div>
                
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                  
                  {/* ===== ACCOUNT INFORMATION ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Informații Cont
                    </h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Email */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Email
                        </label>
                        <input 
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm ${
                            isBusiness 
                              ? 'bg-slate-700/50 border-slate-600 text-slate-400' 
                              : 'bg-gray-100 border-gray-200 text-gray-500'
                          } cursor-not-allowed`}
                        />
                        <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>
                          Emailul nu poate fi modificat
                        </p>
                      </div>
                      
                      {/* Phone */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Telefon
                        </label>
                        <input 
                          type="tel"
                          defaultValue={userProfile?.phone || ''}
                          placeholder="07XX XXX XXX"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                            isBusiness 
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-[#13C1AC] focus:ring-1 focus:ring-[#13C1AC]' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#13C1AC] focus:ring-1 focus:ring-[#13C1AC]'
                          }`}
                        />
                      </div>

                      {/* Account Type */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Tip cont
                        </label>
                        <div className={`w-full px-4 py-2.5 rounded-lg border text-sm ${
                          isBusiness 
                            ? 'bg-slate-700/50 border-slate-600 text-slate-300' 
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isBusiness 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isBusiness ? '🏢 Business' : '👤 Personal'}
                          </span>
                        </div>
                      </div>

                      {/* Member Since */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Membru din
                        </label>
                        <div className={`w-full px-4 py-2.5 rounded-lg border text-sm ${
                          isBusiness 
                            ? 'bg-slate-700/50 border-slate-600 text-slate-300' 
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                          {userProfile?.createdAt 
                            ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== LANGUAGE & REGION ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Limbă și Regiune
                    </h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Limbă
                        </label>
                        <select className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                          isBusiness 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-[#13C1AC]' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#13C1AC]'
                        }`}>
                          <option value="ro">🇷🇴 Română</option>
                          <option value="en">🇬🇧 English</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                          Monedă preferată
                        </label>
                        <select className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                          isBusiness 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-[#13C1AC]' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#13C1AC]'
                        }`}>
                          <option value="RON">Lei (RON)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* Theme Selection */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 sm:mb-6 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Aspect Card Produs
                    </h3>
                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Alege stilul de afișare pentru anunțurile din platformă.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {/* DESIGN 6: Social Market (Vinted Style) */}
                        <div 
                           onClick={() => setSelectedCardTheme(6)}
                           className={`group border border-gray-100/50 bg-white rounded-xl p-1.5 cursor-pointer transition-all duration-300 ring-2 ${selectedCardTheme === 6 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 6 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-1.5 bg-gray-50">
                                <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full z-20">
                                   <span className="text-[8px] font-semibold text-white/90">1 / 4</span>
                                </div>
                           </div>
                           <div className="px-1">
                                <div className="flex justify-between items-start mb-0.5">
                                   <h4 className="text-sm font-bold text-gray-900">50 €</h4>
                                   <Heart className="w-4 h-4 text-gray-900 stroke-[1.5]" />
                                </div>
                                <h3 className="text-gray-500 text-xs leading-tight truncate font-normal">
                                  iPhone 7 rosa
                                </h3>
                           </div>
                           <div className="mt-2 text-center">
                             <span className="text-xs font-semibold text-[#13C1AC]">Vinted</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#6)</span>
                           </div>
                        </div>

                        {/* DESIGN 7: Auto/Imobiliare (Detail Focused) */}
                        <div 
                           onClick={() => setSelectedCardTheme(7)}
                           className={`group bg-white rounded-xl border border-gray-300 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ring-2 ${selectedCardTheme === 7 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 7 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative aspect-[4/3] bg-gray-100 border-b border-gray-100">
                                <img src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=500&q=80" alt="" className="w-full h-full object-cover" />
                           </div>
                           
                           <div className="p-2.5 flex flex-col">
                                <div className="flex justify-between items-start">
                                   <h4 className="text-base font-extrabold text-gray-900">27.500 €</h4>
                                   <Heart className="w-4 h-4 stroke-2 text-gray-400" />
                                </div>
                                <h3 className="text-gray-800 text-sm font-medium truncate">Audi Q3 2020</h3>
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded mt-1.5 w-fit">Folosit</span>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Auto</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#7)</span>
                           </div>
                        </div>

                        {/* DESIGN 8: Friendly Card (Requested) */}
                        <div 
                           onClick={() => setSelectedCardTheme(8)}
                           className={`group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ring-2 ${selectedCardTheme === 8 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 8 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md text-red-500">
                                  <Heart className="h-3.5 w-3.5 fill-current" />
                                </div>
                           </div>
                           <div className="p-2.5">
                             <h3 className="text-sm font-normal text-gray-900 truncate mb-2">iPhone 14 Pro Max</h3>
                             <div className="flex items-center justify-between">
                               <span className="text-sm font-bold text-gray-900">3.500 <span className="font-normal text-gray-400 text-xs">lei</span></span>
                               <span className="px-2 py-1 bg-[#13C1AC]/10 text-[#13C1AC] font-semibold rounded text-[10px]">Contactează</span>
                             </div>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Shop</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#8)</span>
                           </div>
                        </div>

                        {/* DESIGN 9: Original Classic (vindel23 style) */}
                        <div 
                           onClick={() => setSelectedCardTheme(9)}
                           className={`group bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ring-2 ${selectedCardTheme === 9 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 9 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative h-32 bg-gray-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 text-white text-[10px] font-semibold rounded backdrop-blur-sm">
                                    Reservat
                                </div>
                           </div>
                           <div className="p-2.5">
                             <p className="text-base font-bold text-gray-900 mb-0.5">4.500 Lei</p>
                             <p className="text-xs text-gray-700 truncate">MacBook Air M1</p>
                             <p className="text-[10px] text-gray-400 mt-1.5">București</p>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Clasic</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#9)</span>
                           </div>
                        </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== NOTIFICATIONS PREFERENCES ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Preferințe Notificări
                    </h3>
                    <div className="space-y-3">
                      {[
                        { id: 'msg', label: 'Mesaje noi', desc: 'Primește notificări când primești un mesaj' },
                        { id: 'offers', label: 'Oferte și promoții', desc: 'Informații despre reduceri și campanii' },
                        { id: 'price', label: 'Alertă de preț', desc: 'Notifică-mă când prețul unui produs favorizat scade' },
                        { id: 'news', label: 'Noutăți platformă', desc: 'Funcționalități noi și actualizări' },
                        { id: 'email', label: 'Newsletter email', desc: 'Rezumat săptămânal cu cele mai bune oferte' },
                      ].map((setting) => (
                        <div key={setting.id} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{setting.label}</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>{setting.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={setting.id === 'msg' || setting.id === 'price'} className="sr-only peer" />
                            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13C1AC] ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== PRIVACY ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Confidențialitate
                    </h3>
                    <div className="space-y-3">
                      {[
                        { id: 'profile_visible', label: 'Profil public', desc: 'Permite altor utilizatori să vadă profilul tău' },
                        { id: 'show_phone', label: 'Afișează telefonul', desc: 'Afișează numărul de telefon în anunțuri' },
                        { id: 'show_online', label: 'Status online', desc: 'Arată când ești activ pe platformă' },
                      ].map((setting) => (
                        <div key={setting.id} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{setting.label}</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>{setting.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={setting.id === 'profile_visible'} className="sr-only peer" />
                            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13C1AC] ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== SECURITY ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Securitate
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Change Password */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Parolă</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Ultima modificare: niciodată</p>
                          </div>
                          <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isBusiness 
                              ? 'bg-slate-600 text-white hover:bg-slate-500' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}>
                            Schimbă parola
                          </button>
                        </div>
                      </div>

                      {/* Two Factor Auth */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Autentificare în 2 pași</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Protejează-ți contul cu verificare suplimentară</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isBusiness ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
                            În curând
                          </span>
                        </div>
                      </div>

                      {/* Active Sessions */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Sesiuni active</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Dispozitive conectate la contul tău</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${isBusiness ? 'bg-slate-600/50' : 'bg-white border border-gray-200'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBusiness ? 'bg-slate-500' : 'bg-gray-100'}`}>
                            <Monitor className={`w-5 h-5 ${isBusiness ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Acest dispozitiv</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Activ acum • Chrome pe macOS</p>
                          </div>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== SAVE BUTTON ===== */}
                  <div className="flex justify-end">
                    <button className="px-6 py-2.5 bg-[#13C1AC] text-white rounded-lg text-sm font-semibold hover:bg-[#0fa899] transition-colors shadow-sm">
                      Salvează modificările
                    </button>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== DANGER ZONE ===== */}
                  <div className={`p-4 rounded-xl ${isBusiness ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                    <h3 className="font-semibold text-red-500 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Zonă periculoasă
                    </h3>
                    <p className={`text-sm mb-4 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                      Aceste acțiuni sunt permanente și nu pot fi anulate.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}>
                        Dezactivează contul
                      </button>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                        Șterge contul definitiv
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== NOTIFICATIONS ========== */}
            {activeView === 'notifications' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'} flex justify-between items-center`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Notificări</h2>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className={`text-sm font-medium ${isBusiness ? 'text-teal-400 hover:text-teal-300' : 'text-[#13C1AC] hover:text-[#0da896]'}`}
                    >
                      Marchează toate ca citite
                    </button>
                  )}
                </div>
                
                <div className="divide-y divide-gray-100">
                  {/* Solo mostrar loader si está cargando Y no hay datos en caché */}
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500">Se încarcă notificările...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className={`w-12 h-12 mx-auto mb-3 ${isBusiness ? 'text-slate-600' : 'text-gray-300'}`} />
                      <p className={`font-medium ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Nu ai notificări</p>
                      <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>Vei primi notificări când cineva interacționează cu anunțurile tale.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 sm:p-5 flex gap-4 transition-colors cursor-pointer ${
                          notification.read 
                            ? (isBusiness ? 'bg-slate-800' : 'bg-white') 
                            : (isBusiness ? 'bg-slate-700/50' : 'bg-blue-50/50')
                        } hover:${isBusiness ? 'bg-slate-700' : 'bg-gray-50'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Icon based on type */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'report_received' 
                            ? 'bg-orange-100 text-orange-600' 
                            : notification.type === 'report_resolved'
                            ? 'bg-green-100 text-green-600'
                            : notification.type === 'product_approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : notification.type === 'product_rejected'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {notification.type === 'report_received' && <Flag className="w-5 h-5" />}
                          {notification.type === 'report_resolved' && <CheckCircle2 className="w-5 h-5" />}
                          {notification.type === 'product_approved' && <CheckCircle2 className="w-5 h-5" />}
                          {notification.type === 'product_rejected' && <Ban className="w-5 h-5" />}
                          {notification.type === 'new_message' && <Bell className="w-5 h-5" />}
                          {notification.type === 'system' && <Bell className="w-5 h-5" />}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-semibold text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </p>
                              <p className={`text-sm mt-0.5 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                            </div>
                            {notification.metadata?.productImage && (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <Image 
                                  src={notification.metadata.productImage} 
                                  alt="" 
                                  width={48} 
                                  height={48} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Clock className={`w-3.5 h-3.5 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                              <span className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>
                                {notification.createdAt?.seconds 
                                  ? new Date(notification.createdAt.seconds * 1000).toLocaleDateString('ro-RO', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Acum'
                                }
                              </span>
                              {notification.link && (
                                <>
                                  <span className={`${isBusiness ? 'text-slate-600' : 'text-gray-300'}`}>•</span>
                                  <span className={`text-xs flex items-center gap-1 ${isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'}`}>
                                    Vezi detalii <ExternalLink className="w-3 h-3" />
                                  </span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={(e) => notification.id && handleDeleteNotification(e, notification.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBusiness 
                                  ? 'text-slate-500 hover:text-red-400 hover:bg-slate-700' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Șterge notificarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========== SUPPORT ========== */}
            {activeView === 'support' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Suport</h2>
                  <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                    Contactează echipa de suport sau vezi tichetele tale
                  </p>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  {/* New Ticket CTA */}
                  <Link
                    href="/contact"
                    className={`block p-5 rounded-xl border-2 border-dashed transition-all hover:scale-[1.01] ${
                      isBusiness 
                        ? 'border-slate-600 hover:border-teal-500 bg-slate-700/30' 
                        : 'border-gray-200 hover:border-[#13C1AC] bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBusiness ? 'bg-teal-500/20' : 'bg-[#13C1AC]/10'}`}>
                        <HeadphonesIcon className={`w-6 h-6 ${isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                          Deschide un tichet nou
                        </p>
                        <p className={`text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                          Ai o întrebare sau o problemă? Suntem aici să te ajutăm.
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                  </Link>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/ajutor"
                      className={`p-4 rounded-xl transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Centru de ajutor
                      </p>
                      <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                        Răspunsuri rapide
                      </p>
                    </Link>
                    <Link
                      href="/cum-sa-vinzi"
                      className={`p-4 rounded-xl transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Cum să vinzi
                      </p>
                      <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                        Ghid pentru vânzători
                      </p>
                    </Link>
                  </div>

                  {/* Info */}
                  <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                    <div className="flex items-start gap-3">
                      <Clock className={`w-5 h-5 mt-0.5 ${isBusiness ? 'text-teal-400' : 'text-blue-500'}`} />
                      <div>
                        <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                          Timp mediu de răspuns: &lt; 24 ore
                        </p>
                        <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                          Programul de suport: Luni - Vineri, 9:00 - 18:00
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User's Tickets */}
                  {supportTicketsLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      <p className={`text-sm mt-2 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Se încarcă tichetele...</p>
                    </div>
                  ) : supportTickets.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`font-semibold text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                        Tichetele tale ({supportTickets.length})
                      </h3>
                      {supportTickets.map((ticket) => (
                        <Link
                          key={ticket.id}
                          href={`/suport/${ticket.id}`}
                          className={`block p-4 rounded-xl transition-all hover:scale-[1.01] ${
                            isBusiness 
                              ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600' 
                              : 'bg-white border border-gray-200 hover:border-[#13C1AC]/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className={`font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                              {ticket.subject}
                            </p>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              ticket.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                              ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {STATUS_LABELS[ticket.status]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                              {CATEGORY_LABELS[ticket.category]}
                            </span>
                            <span className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>
                              {ticket.updatedAt.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Modal Motivo de Rechazo */}
      {rejectionModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setRejectionModal({ show: false, reason: '', productTitle: '' })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente rojo */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Anunț Respins</h3>
                  <p className="text-red-100 text-sm truncate max-w-[250px]">{rejectionModal.productTitle}</p>
                </div>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Motivul respingerii:</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{rejectionModal.reason}</p>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <p className="text-xs text-amber-800">
                  <strong>💡 Sugestie:</strong> Poți edita anunțul pentru a-l face conform regulilor și îl poți republica.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setRejectionModal({ show: false, reason: '', productTitle: '' })}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
