'use client';

import { Heart, Share2, Eye, Flag, MessageCircle, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Tag, Gauge, Ruler, Calendar, Hash, Car, CircleDot, Package, Settings, Zap, Thermometer, Clock, CheckCircle, Info, X, Home, Bed, Bath, Building, Building2, Sofa, Waves, ParkingCircle, Trees, Star, Sparkles, AlertTriangle, Truck, Users, ChevronDown, ChevronUp, User, Phone, Mail, Globe } from 'lucide-react';
import Image from 'next/image';
import Avatar from '@/components/Avatar';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, Product, incrementProductViews } from '@/lib/products-service';
import { getOrCreateConversation, sendMessage, findExistingConversation } from '@/lib/messages-service';
import { Timestamp } from 'firebase/firestore';
import { toggleFavorite } from '@/lib/favorites-service';
import { useAuth } from '@/lib/auth-context';
import ProductCard from '@/components/ProductCard';
import { createReport, REPORT_REASONS, hasUserReported } from '@/lib/reports-service';
import { extractIdFromSlug } from '@/lib/slugs';
import { useProduct, useUserProducts, useUserProfile, useUserFavorites } from '@/lib/swr-hooks';
import { formatPublicName } from '@/lib/messages';

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

// Helper para tiempo relativo
const getRelativeTime = (publishedAt?: Timestamp | { seconds: number; nanoseconds: number }): string => {
  if (!publishedAt) return 'Azi';
  let date: Date;
  if ('seconds' in publishedAt) {
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

// Helper para formatear precios con separador de miles (12900 -> 12.900)
const formatPrice = (price: number): string => {
  return price.toLocaleString('ro-RO');
};

// Interfaz para BusinessDetails
interface BusinessDetailsProps {
  sellerProfile: {
    businessName?: string;
    cui?: string;
    nrRegistruComert?: string;
    adresaSediu?: string;
    oras?: string;
    judet?: string;
    codPostal?: string;
    tara?: string;
    reprezentantLegal?: string;
    telefonFirma?: string;
    emailFirma?: string;
    website?: string;
    accountType?: string;
  };
}

function BusinessDetails({ sellerProfile }: BusinessDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasBusinessData = sellerProfile.businessName || sellerProfile.cui || 
    sellerProfile.nrRegistruComert || sellerProfile.adresaSediu || 
    sellerProfile.telefonFirma || sellerProfile.emailFirma || sellerProfile.website;
  
  if (!hasBusinessData) return null;
  
  const fullAddress = [
    sellerProfile.adresaSediu,
    sellerProfile.oras,
    sellerProfile.judet && `Jud. ${sellerProfile.judet}`,
    sellerProfile.codPostal,
    sellerProfile.tara
  ].filter(Boolean).join(', ');
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Date Firmă</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">Informații despre vânzător</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {sellerProfile.businessName && (
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Denumire</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{sellerProfile.businessName}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.cui && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">CUI</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{sellerProfile.cui}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.nrRegistruComert && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Nr. Registru Comerț</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{sellerProfile.nrRegistruComert}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.reprezentantLegal && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Reprezentant Legal</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{sellerProfile.reprezentantLegal}</p>
              </div>
            </div>
          )}
          
          {fullAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Sediu Social</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{fullAddress}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.telefonFirma && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Telefon</p>
                <a href={`tel:${sellerProfile.telefonFirma}`} className="text-xs sm:text-sm font-medium text-[#13C1AC] hover:underline">
                  {sellerProfile.telefonFirma}
                </a>
              </div>
            </div>
          )}
          
          {sellerProfile.emailFirma && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                <a href={`mailto:${sellerProfile.emailFirma}`} className="text-xs sm:text-sm font-medium text-[#13C1AC] hover:underline">
                  {sellerProfile.emailFirma}
                </a>
              </div>
            </div>
          )}
          
          {sellerProfile.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Website</p>
                <a 
                  href={sellerProfile.website.startsWith('http') ? sellerProfile.website : `https://${sellerProfile.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs sm:text-sm font-medium text-[#13C1AC] hover:underline"
                >
                  {sellerProfile.website}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper para obtener info de condición
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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const productId = params?.id ? extractIdFromSlug(params.id as string) : null;
  
  // SWR para producto - carga instantánea si está en caché
  const { data: product, isLoading: loading } = useProduct(productId);
  
  // SWR para productos del vendedor - solo cargar cuando tengamos el producto
  const { data: allSellerProducts } = useUserProducts(product?.sellerId || null);
  const sellerProducts = allSellerProducts?.filter(p => p.id !== product?.id).slice(0, 5) || [];
  
  // SWR para perfil del vendedor - usar datos del producto mientras tanto
  const { data: sellerProfile } = useUserProfile(product?.sellerId || null);
  const sellerAvatar = sellerProfile?.photoURL || product?.seller?.avatar;
  
  // SWR para favoritos del usuario
  const { data: favoriteIds, mutate: mutateFavorites } = useUserFavorites(user?.uid || null);
  const isFavorited = productId ? favoriteIds?.includes(productId) || false : false;
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasTrackedView = useRef(false);
  
  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [checkingConversation, setCheckingConversation] = useState(false);
  
  // Quick message options
  const quickMessages = [
    'Bună, mă interesează anunțul tău. Este încă disponibil?',
    'Bună! Care este prețul final? Acceptă negociere?',
    'Bună! Aș dori să văd produsul. Când ne putem întâlni?',
    'Bună! Poți trimite mai multe poze cu produsul?'
  ];
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: product?.title || 'Anunț Vindu.ro',
      text: `${product?.title} - ${product?.price?.toLocaleString('ro-RO')} ${product?.currency === 'EUR' ? '€' : 'Lei'}`,
      url: window.location.href,
    };
    
    try {
      // Try native share (mobile)
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (err) {
      // If share fails, try clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {
        console.error('Could not share or copy');
      }
    }
  };

  // Handle Facebook share - always use production URL
  const handleShareFacebook = () => {
    // Replace localhost with production URL for Facebook
    let shareUrl = window.location.href;
    if (shareUrl.includes('localhost')) {
      shareUrl = shareUrl.replace(/http:\/\/localhost:\d+/, 'https://vindu.ro');
    }
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400,noopener,noreferrer');
  };
  
  // Handle report submit
  const handleReportSubmit = async () => {
    if (!reportReason) return;
    
    setReportLoading(true);
    try {
      // Check if already reported
      if (user) {
        const alreadyReported = await hasUserReported(product?.id || '', user.uid);
        if (alreadyReported) {
          alert('Ai raportat deja acest anunț.');
          setShowReportModal(false);
          return;
        }
      }
      
      await createReport({
        targetId: product?.id || '',
        targetType: 'product',
        reason: reportReason,
        description: reportDescription,
        reporterId: user?.uid,
        reporterEmail: user?.email || undefined,
        productTitle: product?.title,
        productImage: product?.images?.[0] || product?.image,
        sellerId: product?.sellerId, // Para notificar al vendedor
      });
      
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason('');
        setReportDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Eroare la trimiterea raportului. Încearcă din nou.');
    } finally {
      setReportLoading(false);
    }
  };

  // Handle favorite toggle
  const handleFavoriteClick = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!productId) return;
    
    setIsFavoriteLoading(true);
    try {
      const newIsFavorited = await toggleFavorite(user.uid, productId);
      if (newIsFavorited) {
        mutateFavorites([...(favoriteIds || []), productId], false);
      } else {
        mutateFavorites(favoriteIds?.filter(id => id !== productId) || [], false);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [user, productId, favoriteIds, mutateFavorites, router]);

  // Calcular imágenes (necesario antes del useEffect)
  const images = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  // Precargar todas las imágenes en segundo plano
  useEffect(() => {
    if (images.length <= 1) return;
    
    // Preload remaining images after first one
    const preloadImages = () => {
      images.slice(1).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    };
    
    // Delay slightly to not block first paint
    const timer = setTimeout(preloadImages, 100);
    return () => clearTimeout(timer);
  }, [images]);

  useEffect(() => {
    // Force scroll to top when entering the page to ensure full visibility
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Dynamic Title for SEO & UX
    if (product) {
      document.title = `${product.title} | Vindu`;
      
      // Incrementar visitas únicas
      if (!hasTrackedView.current && product.sellerId !== user?.uid) {
        hasTrackedView.current = true;
        incrementProductViews(product.id, user?.uid).catch(console.error);
      }
    }
  }, [product, user?.uid]);

  if (loading) {
    return (
        <div className="bg-gray-50 min-h-screen pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Skeleton Breadcrumb */}
            <div className="flex mb-6 gap-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                {/* Image Skeleton */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                  <div className="p-4 flex gap-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
                
                {/* Description Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="space-y-6">
                {/* Price Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-12 w-full bg-[#13C1AC]/20 rounded-xl animate-pulse"></div>
                </div>

                {/* Seller Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anunț negăsit</h1>
            <Link href="/" className="text-[#13C1AC] hover:underline">
                Înapoi la pagina principală
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 animate-fadeInUp">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1 hover:text-[#13C1AC] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Înapoi</span>
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column: Images & Description */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                
                {/* Image Gallery - Ultra Fast */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fadeInUp animate-delay-100">
                  {/* Main Image */}
                  <div 
                    className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-100 cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  >
                    {/* First image always visible and eager loaded */}
                    <img 
                      src={images[0]} 
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ display: currentImageIndex === 0 ? 'block' : 'none' }}
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                    />
                    {/* Other images loaded in background */}
                    {images.slice(1).map((src, idx) => (
                      <img 
                        key={idx + 1}
                        src={src} 
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ display: idx + 1 === currentImageIndex ? 'block' : 'none' }}
                        loading="eager"
                        decoding="async"
                      />
                    ))}
                    
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
                          }}
                          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
                          }}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all"
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick();
                        }}
                        disabled={isFavoriteLoading}
                        className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 hover:bg-white text-gray-600'} ${isFavoriteLoading ? 'opacity-50' : ''}`}
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShare(); }}
                        className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all ${shareSuccess ? 'bg-green-500 text-white' : 'bg-white/90 hover:bg-white text-gray-600'}`}
                        title="Copiază link"
                      >
                        {shareSuccess ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShareFacebook(); }}
                        className="p-1.5 sm:p-2 rounded-full shadow-md transition-all bg-[#1877F2] hover:bg-[#166FE5] text-white"
                        title="Distribuie pe Facebook"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Promoted badge */}
                    {isProductPromoted(product) && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#13C1AC] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-lg animate-pulse-slow flex items-center gap-1.5">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                        Promovat
                      </div>
                    )}
                    
                    {/* Views counter - hidden on mobile */}
                    <div className="hidden sm:flex absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium items-center gap-1">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {product.views || 0}
                    </div>
                  </div>

                  {/* Thumbnails - click or hover to change */}
                  {images.length > 1 && (
                    <div className="flex gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-gray-50 border-t border-gray-100 overflow-x-auto scrollbar-none">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          onMouseEnter={() => setCurrentImageIndex(idx)}
                          className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                            currentImageIndex === idx 
                              ? 'border-[#13C1AC]' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Imagine ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 animate-fadeInUp animate-delay-200">
                     <div className="flex items-center justify-between mb-3 sm:mb-4">
                       <h2 className="description-text text-lg sm:text-xl font-semibold text-gray-900">Descriere</h2>
                       <span className="flex items-center gap-1.5 text-sm text-gray-500">
                         <Clock className="h-4 w-4" />
                         {getRelativeTime(product.publishedAt)}
                       </span>
                     </div>
                     <p className="description-text text-sm sm:text-base text-gray-600 whitespace-pre-line leading-relaxed">
                        {product.description}
                     </p>
                     
                     {/* Separator and footer */}
                     <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                          <div className="flex items-center gap-2 sm:gap-4">
                            {/* Ref Badge */}
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg">
                              <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{product.id.toString().slice(0, 8)}</span>
                            </div>
                            
                            {/* Report Button */}
                            <button 
                              onClick={() => setShowReportModal(true)}
                              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <Flag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Raportează</span>
                            </button>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">Activ</span>
                          </div>
                        </div>
                     </div>
                </div>

                {/* Detalii / Caracteristici Card */}
                {product.customFields && Object.keys(product.customFields).length > 0 && (
                  <div className="relative rounded-xl shadow-sm overflow-hidden description-text animate-fadeInUp animate-delay-300">
                    {/* Fondo con ondas elegante */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50">
                      <svg className="absolute bottom-0 left-0 w-full h-24 text-[#13C1AC]/5" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
                      </svg>
                      <svg className="absolute top-0 right-0 w-full h-20 text-[#13C1AC]/5 rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,69.3C480,85,600,107,720,101.3C840,96,960,64,1080,58.7C1200,53,1320,75,1380,85.3L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"/>
                      </svg>
                    </div>
                    
                    {/* Grid tabla simple */}
                    <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {Object.entries(product.customFields)
                        .filter(([key, value]) => {
                          // Skip technical state fields (shown separately)
                          if (key === 'stareTehnica' || key === 'stare') return false;
                          // Skip if value is empty, null, undefined, or falsy string
                          if (value === undefined || value === null || value === '') return false;
                          if (typeof value === 'string' && (value.trim() === '' || value === '0')) return false;
                          // Skip boolean false values (not selected checkboxes)
                          if (typeof value === 'boolean' && !value) return false;
                          // Skip 0 values that don't make sense
                          if (typeof value === 'number' && value === 0) return false;
                          return true;
                        })
                        .sort(([keyA], [keyB]) => {
                          // Ordenar: marca primero, luego model, después el resto
                          const order = ['marca', 'marcaAnvelopa', 'marcaJanta', 'model', 'tip', 'tipMoto', 'tipAnvelopa', 'tipJanta'];
                          const indexA = order.indexOf(keyA);
                          const indexB = order.indexOf(keyB);
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return 0;
                        })
                        .map(([key, value], idx, arr) => {
                        const fieldLabels: Record<string, string> = {
                          // Auto
                          'marca': 'Marcă', 'model': 'Model', 'anFabricatie': 'An fabricație',
                          'km': 'Kilometraj', 'combustibil': 'Combustibil', 'capacitate': 'Capacitate cilindrică',
                          'putere': 'Putere', 'cutie': 'Cutie de viteze', 'tractiune': 'Tracțiune',
                          'caroserie': 'Caroserie', 'culoare': 'Culoare', 'nrUsi': 'Număr uși',
                          'normaEuro': 'Normă poluare', 'vin': 'Serie șasiu (VIN)',
                          'inmatriculat': 'Înmatriculat RO', 'serviceBook': 'Carte service',
                          'primaInmatriculare': 'Prima înmatriculare',
                          // Moto
                          'tipMoto': 'Tip',
                          // Anvelope
                          'tipAnvelopa': 'Tip anvelopă', 'marcaAnvelopa': 'Marcă',
                          'latime': 'Lățime', 'inaltime': 'Înălțime profil', 'diametru': 'Diametru jantă',
                          'dimensiuneCompleta': 'Dimensiune completă', 'indiceIncarcatura': 'Indice de încărcătură',
                          'indiceViteza': 'Indice viteză', 'dotAnvelopa': 'DOT (data fabricație)', 'uzura': 'Uzură',
                          'bucati': 'Bucăți', 'runflat': 'Run Flat', 'ranforsat': 'Ranforsat (XL)',
                          'tipVehicul': 'Tip vehicul',
                          // Jante
                          'tipJanta': 'Tip jantă', 'marcaJanta': 'Marcă jantă', 'diametruJanta': 'Diametru',
                          'latimeJanta': 'Lățime (J)', 'et': 'ET (Offset)', 'pcd': 'PCD (găuri)',
                          'diametruCentral': 'Diametru central', 'stareJanta': 'Stare', 'bucatiJante': 'Bucăți',
                          'cuAnvelope': 'Cu anvelope', 'marcaAuto': 'Compatibil marcă', 'modelCompatibil': 'Modele compatibile',
                          // Piese
                          'categoriePiesa': 'Categorie piesă', 'tipPiesa': 'Tip piesă',
                          'compatibilitate': 'Compatibilitate', 'modelAuto': 'Model auto',
                          'codPiesa': 'Cod piesă / OEM', 'garantie': 'Garanție', 'producator': 'Producător',
                          // Imobiliare
                          'tipProprietate': 'Tip proprietate', 'suprafata': 'Suprafață',
                          'camere': 'Număr camere', 'bai': 'Băi', 'etaj': 'Etaj',
                          'anConstructie': 'An construcție', 'mobilat': 'Mobilat', 'parcare': 'Parcare',
                          'balcon': 'Balcon', 'terasa': 'Terasă', 'gradina': 'Grădină',
                          // Electronice
                          'stare': 'Stare', 'marime': 'Mărime',
                          // Transport/Utilaje
                          'tipTransport': 'Tip transport', 'tipUtilaj': 'Tip utilaj', 'oreFunc': 'Ore funcționare',
                          'tipRulota': 'Tip', 'locuri': 'Număr locuri', 'tipBarca': 'Tip', 'lungime': 'Lungime', 'motor': 'Motorizare',
                          // Joburi
                          'tipOferta': 'Tip ofertă', 'pozitie': 'Poziție', 'tipContract': 'Tip contract',
                          'nivelExperienta': 'Experiență', 'salariu': 'Salariu',
                        };
                        
                        const getLabel = (fieldKey: string): string => {
                          return fieldLabels[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        };
                        
                        const getIcon = (fieldKey: string) => {
                          const k = fieldKey.toLowerCase();
                          // Auto
                          if (k === 'km') return <Gauge className="w-3.5 h-3.5" />;
                          if (k === 'combustibil') return <Zap className="w-3.5 h-3.5" />;
                          if (k === 'putere' || k === 'capacitate') return <Gauge className="w-3.5 h-3.5" />;
                          if (k === 'cutie') return <Settings className="w-3.5 h-3.5" />;
                          if (k.includes('an') || k === 'primainmatriculare') return <Calendar className="w-3.5 h-3.5" />;
                          if (k.includes('marca') || k === 'model' || k === 'producator') return <Tag className="w-3.5 h-3.5" />;
                          if (k.includes('culoare')) return <CircleDot className="w-3.5 h-3.5" />;
                          if (k.includes('caroserie') || k.includes('tractiune') || k === 'tipmoto') return <Car className="w-3.5 h-3.5" />;
                          if (k === 'nrusi' || k.includes('usi')) return <Home className="w-3.5 h-3.5" />;
                          if (k === 'vin' || k.includes('cod')) return <Hash className="w-3.5 h-3.5" />;
                          if (k.includes('inmatriculat') || k === 'servicebook') return <CheckCircle className="w-3.5 h-3.5" />;
                          // Imobiliare
                          if (k.includes('camere')) return <Bed className="w-3.5 h-3.5" />;
                          if (k.includes('suprafata')) return <Ruler className="w-3.5 h-3.5" />;
                          if (k === 'bai') return <Bath className="w-3.5 h-3.5" />;
                          if (k === 'etaj') return <Building className="w-3.5 h-3.5" />;
                          if (k === 'mobilat') return <Sofa className="w-3.5 h-3.5" />;
                          if (k === 'parcare') return <ParkingCircle className="w-3.5 h-3.5" />;
                          if (k === 'gradina' || k === 'terasa') return <Trees className="w-3.5 h-3.5" />;
                          // Anvelope/Jante
                          if (k.includes('anvelopa') || k.includes('janta') || k.includes('diametru') || k.includes('latime') || k.includes('inaltime')) return <CircleDot className="w-3.5 h-3.5" />;
                          if (k === 'bucati' || k === 'bucatijante') return <Package className="w-3.5 h-3.5" />;
                          if (k === 'uzura' || k === 'starejanta') return <Info className="w-3.5 h-3.5" />;
                          // Default
                          return <Info className="w-3.5 h-3.5" />;
                        };
                        
                        // Calcular bordes
                        const cols = 4; // en desktop
                        const isLastInRow = (idx + 1) % cols === 0;
                        const totalRows = Math.ceil(arr.length / cols);
                        const currentRow = Math.floor(idx / cols);
                        const isLastRow = currentRow === totalRows - 1;
                        
                        return (
                          <div 
                            key={key} 
                            className={`px-2.5 sm:px-4 py-2.5 sm:py-3.5 
                              ${!isLastInRow ? 'border-r border-gray-200/50' : ''} 
                              ${!isLastRow ? 'border-b border-gray-200/50' : ''}
                            `}
                          >
                            <div className="flex items-center gap-1 sm:gap-1.5 text-[#13C1AC] text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                              {getIcon(key)}
                              <span className="text-gray-400 truncate">{getLabel(key)}</span>
                            </div>
                            <div className="text-gray-800 font-semibold text-xs sm:text-sm truncate">{value as string}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Fila separada para Stare tehnica - con badges elegantes */}
                    {(product.customFields.stareTehnica || product.customFields.stare) && (
                      <div className="relative border-t border-gray-200/50 px-2.5 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 text-[#13C1AC] text-[10px] sm:text-xs mb-2">
                          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-gray-400">Stare tehnică</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {((product.customFields.stareTehnica || product.customFields.stare) as string)
                            .split(',')
                            .map((item, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-700 text-xs sm:text-sm font-medium rounded-full"
                              >
                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {item.trim().replace(/-/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Información básica cuando no hay customFields */}
                {(!product.customFields || Object.keys(product.customFields).length === 0) && (
                  <div className="relative rounded-xl shadow-sm overflow-hidden description-text">
                    {/* Fondo con ondas elegante */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50">
                      <svg className="absolute bottom-0 left-0 w-full h-24 text-[#13C1AC]/5" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
                      </svg>
                      <svg className="absolute top-0 right-0 w-full h-20 text-[#13C1AC]/5 rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,69.3C480,85,600,107,720,101.3C840,96,960,64,1080,58.7C1200,53,1320,75,1380,85.3L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"/>
                      </svg>
                    </div>
                    <div className="relative grid grid-cols-2 md:grid-cols-4">
                      <div className="px-4 py-3.5 border-r border-gray-100/50 border-b md:border-b-0">
                        <div className="text-gray-400 text-xs mb-0.5">Categorie</div>
                        <div className="text-gray-800 font-semibold text-sm">{product.category}</div>
                      </div>
                      {product.subcategory && (
                        <div className="px-4 py-3.5 border-r border-gray-100/50 border-b md:border-b-0">
                          <div className="text-gray-400 text-xs mb-0.5">Subcategorie</div>
                          <div className="text-gray-800 font-semibold text-sm">{product.subcategory}</div>
                        </div>
                      )}
                      <div className="px-4 py-3.5 border-r border-gray-100/50">
                        <div className="text-gray-400 text-xs mb-0.5">Locație</div>
                        <div className="text-gray-800 font-semibold text-sm">{product.location}</div>
                      </div>
                      <div className="px-4 py-3.5">
                        <div className="text-gray-400 text-xs mb-0.5">Predare</div>
                        <div className={`font-semibold text-sm flex items-center gap-1.5 ${product.deliveryType === 'shipping' || product.deliveryType === 'both' ? 'text-purple-600' : 'text-gray-800'}`}>
                          {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? <Truck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          {product.deliveryType === 'shipping' ? 'Livrare' : 
                           product.deliveryType === 'both' ? 'Personal + Livrare' : 
                           'Predare personală'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Right Column: Price & Seller Info */}
            <div className="space-y-4 sm:space-y-6">
                
                {/* Price Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 animate-fadeInUp animate-delay-100">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <h1 className="description-text text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex-1 mr-4 line-clamp-2">
                            {product.title}
                        </h1>
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-3">
                        {formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'lei'}
                    </div>
                    
                    {/* Condition & Negotiable Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {/* Condition badge */}
                        {getConditionInfo(product.condition) ? (() => {
                          const conditionInfo = getConditionInfo(product.condition);
                          const Icon = conditionInfo?.icon;
                          return (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${conditionInfo?.color}`}>
                              {Icon && <Icon className="w-3 h-3" />}
                              {conditionInfo?.label}
                            </span>
                          );
                        })() : product.condition && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-gray-500 text-white">
                            <CheckCircle className="w-3 h-3" />
                            {product.condition}
                          </span>
                        )}
                        
                        {/* Category badge if no condition */}
                        {!product.condition && product.category && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-[#13C1AC] text-white">
                            <Tag className="w-3 h-3" />
                            {product.subcategory || product.category}
                          </span>
                        )}
                        
                        {/* Negotiable badge */}
                        {product.negotiable && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-violet-500 text-white">
                            <MessageCircle className="w-3 h-3" />
                            Negociabil
                          </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={async () => {
                            if (!user) {
                                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                                return;
                            }
                            if (product && user.uid !== product.sellerId) {
                                setCheckingConversation(true);
                                try {
                                    // Check if conversation already exists for this product
                                    const existingConvId = await findExistingConversation(
                                        user.uid,
                                        product.sellerId,
                                        product.id
                                    );
                                    
                                    if (existingConvId) {
                                        // Go directly to existing conversation
                                        router.push(`/messages?conversation=${existingConvId}`);
                                    } else {
                                        // Show modal for first message
                                        setShowChatModal(true);
                                    }
                                } catch (error) {
                                    console.error('Error checking conversation:', error);
                                    setShowChatModal(true);
                                } finally {
                                    setCheckingConversation(false);
                                }
                            }
                        }}
                        disabled={user?.uid === product?.sellerId || checkingConversation}
                        className={`w-full font-bold py-2.5 sm:py-3 px-4 rounded-full transition-colors mb-2 sm:mb-3 flex items-center justify-center text-sm sm:text-base ${
                            user?.uid === product?.sellerId 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#13C1AC] text-white hover:bg-[#10a593] shadow-lg shadow-teal-500/30'
                        }`}
                    >
                        {checkingConversation ? (
                            <>
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Se verifică...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                {user?.uid === product?.sellerId ? 'Tu anuncio' : 'Chat'}
                            </>
                        )}
                    </button>
                    
                    {/* Phone Button - Only show if seller has phone and showPhone is explicitly true */}
                    {sellerProfile?.phone && sellerProfile?.settings?.showPhone === true && user?.uid !== product?.sellerId ? (
                      <a 
                        href={`tel:${sellerProfile.phone}`}
                        className="w-full bg-[#E5F9F6] text-[#13C1AC] font-bold py-2.5 sm:py-3 px-4 rounded-full hover:bg-[#d0f5f0] transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sellerProfile.phone}
                      </a>
                    ) : user?.uid === product?.sellerId ? (
                      <button 
                        disabled
                        className="w-full bg-gray-100 text-gray-400 font-bold py-2.5 sm:py-3 px-4 rounded-full cursor-not-allowed text-sm sm:text-base"
                      >
                        Tu anuncio
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-[#E5F9F6] text-[#13C1AC]/50 font-bold py-2.5 sm:py-3 px-4 rounded-full cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefon ascuns
                      </button>
                    )}
                </div>

                {/* Seller Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fadeInUp animate-delay-200">
                    <Link href={`/user/${product.seller.id}`} className="flex items-center mb-3 sm:mb-4 group cursor-pointer">
                        <div className="relative mr-3 sm:mr-4">
                          <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden ring-[3px] sm:ring-4 ring-[#13C1AC]/30 ${sellerAvatar ? '' : 'bg-[#13C1AC] flex items-center justify-center'}`}>
                            {sellerAvatar ? (
                              <img src={sellerAvatar} alt={formatPublicName(product.seller.name)} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                            ) : (
                              <span className="text-lg sm:text-2xl font-bold text-white">{(product.seller.name || 'U')[0].toUpperCase()}</span>
                            )}
                          </div>
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#13C1AC] transition-colors">{formatPublicName(product.seller.name)}</h3>
                            <div className="flex items-center text-xs sm:text-sm">
                                <div className="flex text-yellow-400 mr-1">
                                    {[...Array(5)].map((_, i) => (
                                         <svg key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(product.seller.rating || 5) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                         </svg>
                                    ))}
                                </div>
                                <span className="text-gray-500">({product.seller.reviews || 0})</span>
                            </div>
                        </div>
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4 mt-3 sm:mt-4 gap-2 sm:gap-0">
                        <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{product.location}</span>
                        </div>
                        <div className="text-[11px] sm:text-sm">
                           Membru din {product.seller.joined || '2024'}
                        </div>
                    </div>
                </div>

                {/* Business Details - Only for business accounts */}
                {sellerProfile?.accountType === 'business' && (
                  <BusinessDetails sellerProfile={sellerProfile} />
                )}

                {/* Safety Tips */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fadeInUp animate-delay-300">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">Sfaturi de siguranță</h3>
                    <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                        <li className="flex items-start">
                            <div className="bg-blue-50 p-0.5 sm:p-1 rounded-full text-blue-500 mr-2 sm:mr-3 mt-0.5">
                                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span>Nu trimite bani înainte de a vedea produsul.</span>
                        </li>
                        <li className="flex items-start">
                             <div className="bg-blue-50 p-0.5 sm:p-1 rounded-full text-blue-500 mr-2 sm:mr-3 mt-0.5">
                                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                             </div>
                            <span>Folosește chat-ul pentru a comunica.</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>

        {/* Chat Modal */}
        {showChatModal && product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowChatModal(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#13C1AC] to-emerald-400 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Trimite mesaj</h3>
                  </div>
                  <button 
                    onClick={() => setShowChatModal(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Product preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
                  {(product.images?.[0] || product.image) && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={product.images?.[0] || product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm font-bold text-[#13C1AC]">
                      {formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'lei'}
                    </p>
                  </div>
                </div>
                
                {/* Quick messages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setChatMessage(msg)}
                      className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
                        chatMessage === msg 
                          ? 'border-[#13C1AC] bg-[#13C1AC]/10 text-[#13C1AC]' 
                          : 'border-gray-200 hover:border-[#13C1AC] hover:text-[#13C1AC]'
                      }`}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                
                {/* Message input */}
                <div className="mb-5">
                  <div className="relative">
                    <textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Scrie mesajul tău aici..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-[#13C1AC]/30 rounded-xl text-sm focus:outline-none focus:border-[#13C1AC] resize-none"
                    />
                    <div className="absolute bottom-3 left-3">
                      <div className="w-6 h-6 bg-[#13C1AC] rounded-md flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowChatModal(false);
                      setChatMessage('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={async () => {
                      if (!user || !product || !chatMessage.trim()) return;
                      
                      setSendingMessage(true);
                      try {
                        const conversationId = await getOrCreateConversation(
                          user.uid,
                          product.sellerId,
                          {
                            [user.uid]: userProfile?.displayName || user.displayName || 'Usuario',
                            [product.sellerId]: product.seller.name
                          },
                          {
                            [user.uid]: userProfile?.photoURL || user.photoURL || '',
                            [product.sellerId]: sellerAvatar || ''
                          },
                          {
                            productId: product.id,
                            productTitle: product.title,
                            productImage: product.images?.[0] || product.image || ''
                          }
                        );
                        
                        // Send the message directly
                        await sendMessage(conversationId, user.uid, chatMessage.trim());
                        
                        // Redirect to conversation
                        router.push(`/messages?conversation=${conversationId}`);
                      } catch (error) {
                        console.error('Error sending message:', error);
                      } finally {
                        setSendingMessage(false);
                      }
                    }}
                    disabled={sendingMessage || !chatMessage.trim()}
                    className="flex-1 px-4 py-3 bg-[#13C1AC] text-white font-bold rounded-xl hover:bg-[#10a593] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Se trimite...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Trimite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Flag className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Raportează anunțul</h3>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {reportSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Mulțumim pentru raport!</h4>
                    <p className="text-sm text-gray-500">Vom analiza anunțul în cel mai scurt timp.</p>
                  </div>
                ) : (
                  <>
                    {/* Product preview */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
                      {product?.images?.[0] && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{product?.title}</p>
                        <p className="text-xs text-gray-500">ID: {product?.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    
                    {/* Reason select */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Motivul raportării *</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="">Selectează un motiv...</option>
                        {REPORT_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>{reason.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Description */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Detalii suplimentare (opțional)</label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Descrie problema în detaliu..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Anulează
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        disabled={!reportReason || reportLoading}
                        className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {reportLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Se trimite...</span>
                          </>
                        ) : (
                          <>
                            <Flag className="w-4 h-4" />
                            <span>Trimite raportul</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* More from seller section */}
        {sellerProducts.length > 0 && (
          <div className="mt-6 sm:mt-10 bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Mai multe de la vânzător</h2>
              <span className="text-xs sm:text-sm text-gray-500 border border-gray-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                {sellerProducts.length} anunțuri
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {sellerProducts.map((item) => (
                 <div key={item.id} className="h-full">
                    <ProductCard product={item} />
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Botón cerrar */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Contador de imágenes */}
          <div className="absolute top-6 left-6 text-white/80 text-sm font-medium">
            {currentImageIndex + 1}/{images.length}
          </div>

          {/* Imagen principal */}
          <div 
            className="flex-1 flex items-center justify-center p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flecha izquierda */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
                }}
                className="absolute left-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* Imagen actual */}
            <div className="relative max-w-5xl w-full h-full max-h-[75vh] flex items-center justify-center">
              <Image
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-contain"
                priority
                quality={75}
              />
            </div>

            {/* Flecha derecha */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
                }}
                className="absolute right-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            )}
          </div>

          {/* Barra inferior con thumbnails, info y chat */}
          <div 
            className="bg-zinc-900 border-t border-white/10 px-4 py-4 md:py-6 pb-8 md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      currentImageIndex === idx 
                        ? 'border-[#13C1AC] ring-2 ring-[#13C1AC]/30' 
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Miniatura ${idx + 1}`} fill sizes="56px" className="object-cover" quality={50} />
                  </button>
                ))}
              </div>
            )}
            
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              {/* Info del vendedor y anuncio */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <Avatar src={sellerAvatar} name={product.seller?.name || 'Utilizator'} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-white font-medium truncate text-lg">{product.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <span>{formatPublicName(product.seller?.name || 'Utilizator')}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                     <span className="text-emerald-400 font-bold text-base">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
                  </div>
                </div>
              </div>

              {/* Botón Chat */}
              <button
                onClick={async () => {
                   setLightboxOpen(false);
                   if (!user) {
                       router.push('/login');
                       return;
                   }
                   if (user.uid === product?.sellerId) return;
                   
                   try {
                       setCheckingConversation(true);
                       const existingConvId = await findExistingConversation(
                           user.uid,
                           product.sellerId || '',
                           product.id
                       );
                       if (existingConvId) {
                           router.push(`/messages?conversation=${existingConvId}`);
                       } else {
                           setShowChatModal(true);
                       }
                   } catch (error) {
                       console.error('Error checking conversation:', error);
                       setShowChatModal(true);
                   } finally {
                       setCheckingConversation(false);
                   }
                }}
                disabled={user?.uid === product?.sellerId || checkingConversation}
                className={`px-6 py-2.5 font-semibold rounded-full transition-colors flex-shrink-0 shadow-lg shadow-teal-900/20 flex items-center gap-2 ${
                    user?.uid === product?.sellerId 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-[#13C1AC] hover:bg-[#0fa895] text-white'
                }`}
              >
                {checkingConversation ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Se verifică...</span>
                    </>
                ) : (
                    <>
                        <MessageCircle className="w-4 h-4" />
                        <span>{user?.uid === product?.sellerId ? 'Anunțul tău' : 'Chat'}</span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
