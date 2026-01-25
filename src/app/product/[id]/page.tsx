'use client';

import { Heart, Share2, Eye, Flag, MessageCircle, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Tag, Gauge, Ruler, Calendar, Hash, Car, CircleDot, Package, Settings, Zap, Thermometer, Clock, CheckCircle, Info, X, Home, Bed, Bath, Building, Building2, Sofa, Waves, ParkingCircle, Trees, Star, Sparkles, AlertTriangle, Truck, Users, Crown, Globe, Mail, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import { getProduct, getProducts, Product } from '@/lib/products-service';
import { createOrGetConversation } from '@/lib/messages';
import { getOrCreateConversation, sendMessage, findExistingConversation } from '@/lib/messages-service';
import { Timestamp } from 'firebase/firestore';
import { extractIdFromSlug, createProductLink } from '@/lib/slugs';
import Avatar from '@/components/Avatar';
import { createReport, REPORT_REASONS, hasUserReported } from '@/lib/reports-service';
import { useAuth } from '@/lib/auth-context';
import { useUserProfile } from '@/lib/swr-hooks';

// Helper para tiempo relativo
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

// Lazy load ProductCard solo cuando hay productos del vendedor
const ProductCard = dynamic(() => import('@/components/ProductCard'), {
  ssr: true
});

// Helper para formatear precios con separador de miles (12900 -> 12.900)
const formatPrice = (price: number): string => {
  return price.toLocaleString('ro-RO');
};

// Helper para formatear nombre público (Alexandru Bugeag -> Alexandru B.)
const formatPublicName = (name: string): string => {
  if (!name) return 'Utilizator';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
};

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

// Business Details Component
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
  
  // Check if there's any business data to show
  const hasBusinessData = sellerProfile.businessName || sellerProfile.cui || 
    sellerProfile.nrRegistruComert || sellerProfile.adresaSediu || 
    sellerProfile.telefonFirma || sellerProfile.emailFirma || sellerProfile.website;
  
  if (!hasBusinessData) return null;
  
  // Build full address
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
            <h3 className="font-semibold text-gray-900">Date Firmă</h3>
            <p className="text-xs text-gray-500">Informații despre vânzător</p>
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
                <p className="text-xs text-gray-500">Denumire</p>
                <p className="text-sm font-medium text-gray-900">{sellerProfile.businessName}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.cui && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">CUI</p>
                <p className="text-sm font-medium text-gray-900">{sellerProfile.cui}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.nrRegistruComert && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Nr. Registru Comerț</p>
                <p className="text-sm font-medium text-gray-900">{sellerProfile.nrRegistruComert}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.reprezentantLegal && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Reprezentant Legal</p>
                <p className="text-sm font-medium text-gray-900">{sellerProfile.reprezentantLegal}</p>
              </div>
            </div>
          )}
          
          {fullAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Sediu Social</p>
                <p className="text-sm font-medium text-gray-900">{fullAddress}</p>
              </div>
            </div>
          )}
          
          {sellerProfile.telefonFirma && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Telefon</p>
                <a href={`tel:${sellerProfile.telefonFirma}`} className="text-sm font-medium text-[#13C1AC] hover:underline">
                  {sellerProfile.telefonFirma}
                </a>
              </div>
            </div>
          )}
          
          {sellerProfile.emailFirma && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <a href={`mailto:${sellerProfile.emailFirma}`} className="text-sm font-medium text-[#13C1AC] hover:underline">
                  {sellerProfile.emailFirma}
                </a>
              </div>
            </div>
          )}
          
          {sellerProfile.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a 
                  href={sellerProfile.website.startsWith('http') ? sellerProfile.website : `https://${sellerProfile.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#13C1AC] hover:underline"
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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(1);
  
  // SWR para perfil del vendedor (teléfono y configuración)
  const { data: sellerProfile } = useUserProfile(product?.sellerId || product?.seller?.id || null);
  
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
      title: product?.title || 'Anunț Vindel.ro',
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
      shareUrl = shareUrl.replace(/http:\/\/localhost:\d+/, 'https://vindel.ro');
    }
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400,noopener,noreferrer');
  };
  
  // Handle report submit
  const handleReportSubmit = async () => {
    if (!reportReason || !product) return;
    
    setReportLoading(true);
    try {
      // Check if already reported
      if (user) {
        const alreadyReported = await hasUserReported(product.id, user.uid);
        if (alreadyReported) {
          alert('Ai raportat deja acest anunț.');
          setShowReportModal(false);
          return;
        }
      }
      
      console.log('[REPORT-UI] Creating report for product:', product.id);
      console.log('[REPORT-UI] Product sellerId:', product.sellerId);
      console.log('[REPORT-UI] Product seller.id:', product.seller?.id);
      
      await createReport({
        targetId: product.id,
        targetType: 'product',
        reason: reportReason,
        description: reportDescription,
        reporterId: user?.uid,
        reporterEmail: user?.email || undefined,
        productTitle: product.title,
        productImage: product.images?.[0] || product.image,
        productCategory: product.category,
        productLink: createProductLink(product),
        sellerId: product.sellerId || product.seller?.id,
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

  // Precargar imágenes adyacentes para cambio instantáneo
  useEffect(() => {
    if (product && product.images && product.images.length > 1) {
      const preloadAdjacent = () => {
        const prevIdx = currentImageIndex === 0 ? product.images.length - 1 : currentImageIndex - 1;
        const nextIdx = currentImageIndex === product.images.length - 1 ? 0 : currentImageIndex + 1;
        
        // Preload previous and next images
        [prevIdx, nextIdx].forEach((idx) => {
          if (idx !== currentImageIndex) {
            const img = new window.Image();
            img.src = product.images[idx];
          }
        });
      };
      
      // Preload on mount and when image changes
      const timer = setTimeout(preloadAdjacent, 50);
      return () => clearTimeout(timer);
    }
  }, [product, currentImageIndex]);

  useEffect(() => {
    // Force scroll to top when entering the page to ensure full visibility
    window.scrollTo({ top: 0, behavior: 'instant' });

    async function loadProduct() {
      try {
        if (params?.id) {
          const productId = extractIdFromSlug(params.id as string);
          const foundProduct = await getProduct(productId);
          if (foundProduct) {
            // Redirect to canonical URL /anunturi/...
            const canonicalUrl = createProductLink(foundProduct);
            if (!window.location.pathname.startsWith('/anunturi/')) {
              router.replace(canonicalUrl);
              return;
            }
            
            // Debug DETALLADO: ver publishedAt
            console.log('=== DEBUG PRODUCTO ===');
            console.log('ID:', foundProduct.id);
            console.log('Title:', foundProduct.title);
            console.log('publishedAt:', foundProduct.publishedAt);
            console.log('publishedAt type:', typeof foundProduct.publishedAt);
            console.log('Has seconds?:', (foundProduct.publishedAt as any)?.seconds);
            console.log('All keys:', Object.keys(foundProduct));
            console.log('======================');
            setProduct(foundProduct);
            
            // Dynamic Title for SEO & UX
            document.title = `${foundProduct.title} | Vindel`;

            // Obtener otros productos del mismo vendedor (en paralelo, no bloquea)
            getProducts({ sellerId: foundProduct.sellerId }, 6).then(sellerResult => {
              const otherProducts = sellerResult.products.filter(p => p.id !== foundProduct.id).slice(0, 5);
              setSellerProducts(otherProducts);
            });
          }
        }
      } catch (e) {
        console.error("Error loading product", e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params?.id]);

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="relative w-20 h-20">
                {/* Background Ring */}
                <div className="absolute inset-0 border-[6px] border-blue-50/80 rounded-full"></div>
                {/* Spinning Segment */}
                <div className="absolute inset-0 border-[6px] border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Tag className="w-8 h-8 text-[#3B82F6]" style={{ transform: 'rotate(-45deg)' }} />
                </div>
            </div>
            <p className="mt-6 text-slate-400 text-lg font-medium animate-pulse">Se încarcă...</p>
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

  const images = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(newIndex);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center mb-4 sm:mb-6 text-sm text-gray-500">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Images & Description */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Image Gallery - Optimized with navigation */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Main Image Container - adaptive height */}
                  <div 
                      className="relative bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden min-h-[300px] sm:min-h-[400px]"
                      onClick={() => setLightboxOpen(true)}
                  >
                      {/* Current image - adapts to content */}
                      <Image 
                        key={currentImageIndex}
                        src={images[currentImageIndex]} 
                        alt={product.title} 
                        width={800}
                        height={800}
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="w-auto h-auto max-w-full max-h-[70vh] object-contain animate-[fadeIn_0.3s_ease-out]"
                        priority={currentImageIndex === 0}
                        quality={75}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
                      />

                      {/* Navigation arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                          </button>
                        </>
                      )}

                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-600 shadow-md transition-colors"
                        >
                            <Heart className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            className={`p-2 rounded-full shadow-md transition-colors ${shareSuccess ? 'bg-green-500 text-white' : 'bg-white/90 hover:bg-white text-gray-600'}`}
                            title="Copiază link"
                        >
                            {shareSuccess ? <CheckCircle className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleShareFacebook(); }}
                            className="p-2 rounded-full shadow-md transition-colors bg-[#1877F2] hover:bg-[#166FE5] text-white"
                            title="Distribuie pe Facebook"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>
                      </div>
                      
                      {/* Image counter */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md z-10 font-medium">
                          {currentImageIndex + 1}/{images.length}
                        </div>
                      )}
                      
                      {/* Views counter - only show on desktop */}
                      <div className="hidden sm:flex absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md items-center z-10">
                          <Eye className="h-3 w-3 mr-1" />
                          {product.views || 0}
                      </div>
                  </div>

                  {/* Thumbnails bar */}
                  {images.length > 1 && (
                    <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-100 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            currentImageIndex === idx 
                              ? 'border-[#13C1AC] ring-2 ring-[#13C1AC]/20' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image 
                            src={img} 
                            alt={`Foto ${idx + 1}`} 
                            fill 
                            sizes="56px" 
                            className="object-cover"
                            quality={50}
                            loading={idx < 4 ? "eager" : "lazy"}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Card - Below images (mobile only) */}
                <div className="lg:hidden bg-white rounded-xl shadow-sm p-6">
                    <h1 className="description-text text-xl font-bold text-gray-900 mb-2">
                        {product.title}
                    </h1>
                    <div className="text-3xl font-extrabold text-gray-900 mb-3">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</div>
                    
                    {/* Condition & Negotiable Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
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
                        {!product.condition && product.category && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-[#13C1AC] text-white">
                            <Tag className="w-3 h-3" />
                            {product.subcategory || product.category}
                          </span>
                        )}
                        {product.negotiable && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-violet-500 text-white">
                            <MessageCircle className="w-3 h-3" />
                            Negociabil
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(product.publishedAt)}
                        </span>
                    </div>
                    
                    <button 
                        onClick={async () => {
                            if (!user) {
                                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                                return;
                            }
                            if (product && user.uid !== product.seller.id) {
                                setCheckingConversation(true);
                                try {
                                    const existingConvId = await findExistingConversation(
                                        user.uid,
                                        product.sellerId || product.seller.id,
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
                            }
                        }}
                        disabled={user?.uid === product?.seller?.id || checkingConversation}
                        className={`w-full font-bold py-3 px-4 rounded-full transition-colors mb-3 flex items-center justify-center ${
                            user?.uid === product?.seller?.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#13C1AC] text-white hover:bg-[#10a593] shadow-lg shadow-teal-500/30'
                        }`}
                    >
                        {checkingConversation ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Se verifică...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-5 w-5 mr-2" />
                                {user?.uid === product?.seller?.id ? 'Tu anuncio' : 'Chat'}
                            </>
                        )}
                    </button>
                    
                    {sellerProfile?.phone && sellerProfile?.settings?.showPhone === true && user?.uid !== product?.sellerId ? (
                      <a 
                        href={`tel:${sellerProfile.phone}`}
                        className="w-full bg-[#E5F9F6] text-[#13C1AC] font-bold py-3 px-4 rounded-full hover:bg-[#d0f5f0] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sellerProfile.phone}
                      </a>
                    ) : user?.uid === product?.sellerId ? (
                      <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded-full cursor-not-allowed">
                        Tu anuncio
                      </button>
                    ) : (
                      <button disabled className="w-full bg-[#E5F9F6] text-[#13C1AC]/50 font-bold py-3 px-4 rounded-full cursor-not-allowed flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefon ascuns
                      </button>
                    )}
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                     <div className="flex items-center justify-between mb-4">
                       <h2 className="description-text text-xl font-semibold text-gray-900">Descriere</h2>
                       <span className="flex items-center gap-1.5 text-sm text-gray-500">
                         <Clock className="h-4 w-4" />
                         {getRelativeTime(product.publishedAt)}
                       </span>
                     </div>
                     <p className="description-text text-gray-600 whitespace-pre-line leading-relaxed">
                        {product.description}
                     </p>
                     
                     {/* Separator and footer */}
                     <div className="mt-8 border-t border-gray-100 pt-5 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-400">
                           <span>Ref: {product.id.toString().slice(0, 8)}</span>
                           <span className="mx-2">•</span>
                           <span className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" /> {getRelativeTime(product.publishedAt)}
                           </span>
                           <span className="mx-2">•</span>
                           <button 
                              onClick={() => setShowReportModal(true)}
                              className="flex items-center hover:text-red-500 transition-colors"
                           >
                              <Flag className="h-3.5 w-3.5 mr-1" /> Raportează anunțul
                           </button>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-medium border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Activ
                        </span>
                     </div>
                </div>

                {/* Detalii / Caracteristici Card */}
                {product.customFields && Object.keys(product.customFields).length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden description-text text-[0.9rem]">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-[0.95rem] font-semibold text-gray-900">
                        {product.subcategory || 'Detalii produs'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {Object.entries(product.customFields)
                        .filter(([key, value]) => {
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
                        // Mapeo de IDs a etiquetas legibles
                        const fieldLabels: Record<string, string> = {
                          // Auto
                          'marca': 'Marcă',
                          'model': 'Model',
                          'anFabricatie': 'An fabricație',
                          'km': 'Kilometraj',
                          'combustibil': 'Combustibil',
                          'capacitate': 'Capacitate cilindrică',
                          'putere': 'Putere',
                          'cutie': 'Cutie de viteze',
                          'tractiune': 'Tracțiune',
                          'caroserie': 'Caroserie',
                          'culoare': 'Culoare',
                          'nrUsi': 'Număr uși',
                          'normaEuro': 'Normă poluare',
                          'vin': 'Serie șasiu (VIN)',
                          'inmatriculat': 'Înmatriculat RO',
                          'serviceBook': 'Carte service',
                          'primaInmatriculare': 'Prima înmatriculare',
                          'stareTehnica': 'Stare tehnică',
                          // Moto
                          'tipMoto': 'Tip',
                          // Anvelope
                          'tipAnvelopa': 'Tip anvelopă',
                          'marcaAnvelopa': 'Marcă',
                          'latime': 'Lățime',
                          'inaltime': 'Înălțime profil',
                          'diametru': 'Diametru jantă',
                          'dimensiuneCompleta': 'Dimensiune',
                          'indiceIncarcatura': 'Indice încărcătură',
                          'indiceViteza': 'Indice viteză',
                          'dotAnvelopa': 'DOT',
                          'uzura': 'Uzură',
                          'bucati': 'Bucăți',
                          'runflat': 'Run Flat',
                          'ranforsat': 'Ranforsat',
                          'tipVehicul': 'Tip vehicul',
                          // Jante
                          'tipJanta': 'Tip jantă',
                          'marcaJanta': 'Marcă jantă',
                          'diametruJanta': 'Diametru',
                          'latimeJanta': 'Lățime',
                          'et': 'ET (Offset)',
                          'pcd': 'PCD (găuri)',
                          'diametruCentral': 'Diametru central',
                          'stareJanta': 'Stare',
                          'bucatiJante': 'Bucăți',
                          'cuAnvelope': 'Cu anvelope',
                          'marcaAuto': 'Marcă auto',
                          'modelCompatibil': 'Modele compatibile',
                          // Piese
                          'categoriePiesa': 'Categorie',
                          'tipPiesa': 'Tip piesă',
                          'compatibilitate': 'Compatibilitate',
                          'modelAuto': 'Model auto',
                          'codPiesa': 'Cod piesă / OEM',
                          'garantie': 'Garanție',
                          'producator': 'Producător',
                          // Imobiliare
                          'tipProprietate': 'Tip proprietate',
                          'camere': 'Număr camere',
                          'suprafata': 'Suprafață',
                          'etaj': 'Etaj',
                          'anConstructie': 'An construcție',
                          'mobilat': 'Mobilat',
                          'bai': 'Băi',
                          'parcare': 'Parcare',
                          'perioadaInchiriere': 'Perioadă',
                          'perioadaMinima': 'Perioadă minimă',
                          'tipCamera': 'Tip cameră',
                          'baieProprie': 'Baie proprie',
                          // Telefoane
                          'stareEcran': 'Stare ecran',
                          'stareBaterie': 'Stare baterie',
                          'memorieInterna': 'Memorie internă',
                          'memorieRAM': 'Memorie RAM',
                          'reteleMobile': 'Rețele mobile',
                          'incarcatorOriginal': 'Încărcător original',
                          'cutieOriginala': 'Cutie originală',
                          'durataBaterie': 'Durată baterie',
                          // Electronice
                          'diagonala': 'Diagonală',
                          'rezolutie': 'Rezoluție',
                          'tipDisplay': 'Tip display',
                          'procesor': 'Procesor',
                          'placaVideo': 'Placă video',
                          'stocare': 'Stocare',
                          'tipStorare': 'Tip stocare',
                          // PC Gaming - General
                          'tip': 'Tip produs',
                          'tipPC': 'Tip produs',
                          'specificatii': 'Specificații',
                          'componenta': 'Componentă',
                          // PC Complet
                          'procesorPC': 'Procesor',
                          'placaVideoPC': 'Placă video',
                          'ramPC': 'RAM',
                          'stocarePC': 'Stocare',
                          'placaBazaPC': 'Placă de bază',
                          'sursaPC': 'Sursa',
                          'carcasaPC': 'Carcasă',
                          // GPU
                          'marcaGPU': 'Marcă GPU',
                          'modelGPU': 'Model GPU',
                          'producatorGPU': 'Producător',
                          'vramGPU': 'VRAM',
                          'tipVRAM': 'Tip VRAM',
                          // CPU
                          'marcaCPU': 'Marcă CPU',
                          'modelCPU': 'Model CPU',
                          'generatie': 'Generație',
                          'nuclee': 'Nuclee/Fire',
                          'frecventa': 'Frecvență',
                          'socket': 'Socket',
                          'coolerInclus': 'Cooler inclus',
                          // Motherboard
                          'producatorMB': 'Producător',
                          'modelMB': 'Model',
                          'socketMB': 'Socket',
                          'chipset': 'Chipset',
                          'formatMB': 'Format',
                          'sloturiRAM': 'Sloturi RAM',
                          'tipRAM': 'Tip RAM suportat',
                          // RAM
                          'marcaRAM': 'Marcă RAM',
                          'modelRAM': 'Model RAM',
                          'capacitateRAM': 'Capacitate',
                          'configuratie': 'Configurație',
                          'tipRAMkit': 'Tip RAM',
                          'frecventaRAM': 'Frecvență',
                          'latenta': 'Latență (CL)',
                          // SSD
                          'marcaSSD': 'Marcă SSD',
                          'modelSSD': 'Model SSD',
                          'capacitateSSD': 'Capacitate',
                          'tipSSD': 'Tip SSD',
                          'vitezaCitire': 'Viteză citire',
                          'vitezaScriere': 'Viteză scriere',
                          // HDD
                          'marcaHDD': 'Marcă HDD',
                          'modelHDD': 'Model HDD',
                          'capacitateHDD': 'Capacitate',
                          'tipHDD': 'Tip HDD',
                          'rpm': 'RPM',
                          'cache': 'Cache',
                          // PSU
                          'marcaPSU': 'Marcă sursa',
                          'modelPSU': 'Model sursa',
                          'puterePSU': 'Putere',
                          'certificare': 'Certificare',
                          'modular': 'Tip cabluri',
                          'conectorGPU': 'Conector GPU',
                          // Case
                          'marcaCarcasa': 'Marcă carcasă',
                          'modelCarcasa': 'Model carcasă',
                          'formatCarcasa': 'Format',
                          'culoareCarcasa': 'Culoare',
                          'panou': 'Panou lateral',
                          'ventilatoareIncluse': 'Ventilatoare',
                          // Cooler
                          'marcaCooler': 'Marcă cooler',
                          'modelCooler': 'Model cooler',
                          'tipCooler': 'Tip cooler',
                          'socketCooler': 'Socket compatibil',
                          'tdp': 'TDP suportat',
                          // Monitor
                          'marcaMonitor': 'Marcă monitor',
                          'modelMonitor': 'Model monitor',
                          'diagonalaMonitor': 'Diagonală',
                          'rezolutieMonitor': 'Rezoluție',
                          'panouMonitor': 'Tip panou',
                          'rataRefresh': 'Rată refresh',
                          'timpRaspuns': 'Timp răspuns',
                          'adaptive': 'Adaptive Sync',
                          // Keyboard
                          'marcaTastatura': 'Marcă tastatură',
                          'modelTastatura': 'Model tastatură',
                          'tipSwitch': 'Tip switch',
                          'layout': 'Layout',
                          'conectare': 'Conectare',
                          // Mouse
                          'marcaMouse': 'Marcă mouse',
                          'modelMouse': 'Model mouse',
                          'senzor': 'Senzor',
                          'dpiMax': 'DPI max',
                          'greutateMouse': 'Greutate',
                          'conectareMouse': 'Conectare',
                          // Headset
                          'marcaCasti': 'Marcă căști',
                          'modelCasti': 'Model căști',
                          'tipCasti': 'Tip căști',
                          'conectareCasti': 'Conectare',
                          'sunetSurround': 'Sunet surround',
                          'microfon': 'Microfon',
                          // Chair
                          'marcaScaun': 'Marcă scaun',
                          'modelScaun': 'Model scaun',
                          'materialScaun': 'Material',
                          'greutateMax': 'Greutate max',
                          // Gaming
                          'platforma': 'Platformă',
                          'format': 'Format',
                          'titlu': 'Titlu',
                          'tipAccesoriu': 'Tip accesoriu',
                          'versiune': 'Versiune',
                          'titluJoc': 'Titlu joc',
                          'completitudine': 'Completitudine',
                          // Job
                          'tipOferta': 'Tip ofertă',
                          'pozitie': 'Poziție',
                          'tipContract': 'Tip contract',
                          'nivelExperienta': 'Experiență',
                          'salariu': 'Salariu',
                          // Generic
                          'stare': 'Stare',
                          'marime': 'Mărime',
                          'material': 'Material',
                          'dimensiune': 'Dimensiune',
                          'greutate': 'Greutate',
                          'varsta': 'Vârstă',
                          'sex': 'Sex',
                          'rasa': 'Rasă',
                          'vaccin': 'Vaccinat',
                        };
                        
                        const getLabel = (fieldKey: string): string => {
                          return fieldLabels[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        };
                        
                        const getIcon = (fieldKey: string) => {
                          const k = fieldKey.toLowerCase();
                          // Auto - específicos primero
                          if (k === 'km') return <Gauge className="w-4 h-4" />;
                          if (k === 'combustibil') return <Zap className="w-4 h-4" />;
                          if (k === 'putere') return <Gauge className="w-4 h-4" />;
                          if (k === 'cutie') return <Settings className="w-4 h-4" />;
                          if (k === 'tractiune') return <Car className="w-4 h-4" />;
                          if (k === 'caroserie') return <Car className="w-4 h-4" />;
                          if (k === 'capacitate') return <Gauge className="w-4 h-4" />;
                          if (k === 'model') return <Tag className="w-4 h-4" />;
                          // Inmobiliaria
                          if (k.includes('camere') || k.includes('dormitor') || k.includes('habitacion')) return <Bed className="w-4 h-4" />;
                          if (k.includes('suprafata') || k.includes('superficie') || k.includes('mp') || k.includes('metri')) return <Ruler className="w-4 h-4" />;
                          if (k.includes('etaj') || k.includes('piso') || k.includes('floor')) return <Building className="w-4 h-4" />;
                          if (k.includes('an') || k.includes('constructie') || k.includes('year') || k.includes('data')) return <Calendar className="w-4 h-4" />;
                          if (k.includes('mobilat') || k.includes('mobilier') || k.includes('amueblado')) return <Sofa className="w-4 h-4" />;
                          if (k.includes('bai') || k.includes('baie') || k.includes('baño')) return <Bath className="w-4 h-4" />;
                          if (k.includes('parcare') || k.includes('parking') || k.includes('garaj')) return <ParkingCircle className="w-4 h-4" />;
                          if (k.includes('piscina') || k.includes('pool')) return <Waves className="w-4 h-4" />;
                          if (k.includes('gradina') || k.includes('jardin') || k.includes('teren')) return <Trees className="w-4 h-4" />;
                          // Auto
                          if (k.includes('marca') || k.includes('brand')) return <Tag className="w-4 h-4" />;
                          if (k.includes('tip') || k.includes('type')) return <Settings className="w-4 h-4" />;
                          if (k.includes('latime') || k.includes('inaltime') || k.includes('dimensiune') || k.includes('marime')) return <Ruler className="w-4 h-4" />;
                          if (k.includes('diametru') || k.includes('inch')) return <CircleDot className="w-4 h-4" />;
                          if (k.includes('viteza') || k.includes('speed')) return <Gauge className="w-4 h-4" />;
                          if (k.includes('dot')) return <Calendar className="w-4 h-4" />;
                          if (k.includes('uzura') || k.includes('stare')) return <Thermometer className="w-4 h-4" />;
                          if (k.includes('bucati') || k.includes('cantitate')) return <Package className="w-4 h-4" />;
                          if (k.includes('vehicul') || k.includes('auto')) return <Car className="w-4 h-4" />;
                          if (k.includes('runflat') || k.includes('ranforsat')) return <CheckCircle className="w-4 h-4" />;
                          if (k.includes('indice')) return <Hash className="w-4 h-4" />;
                          if (k.includes('culoare')) return <CircleDot className="w-4 h-4" />;
                          return <Info className="w-4 h-4" />;
                        };
                        return (
                          <div 
                            key={key} 
                            className={`px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors
                              ${idx % 2 === 0 ? 'md:border-r border-gray-100' : ''}
                              ${idx < arr.length - 2 ? 'border-b border-gray-100' : ''}
                              ${idx === arr.length - 2 ? 'border-b md:border-b-0 border-gray-100' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-[#13C1AC]">
                                {getIcon(key)}
                              </div>
                              <span className="text-gray-500">
                                {getLabel(key)}
                              </span>
                            </div>
                            <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                              {value as string}
                            </span>
                          </div>
                        );
                      })}
                      {/* Publicat - siempre al final */}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-gray-500">Publicat</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {getRelativeTime(product.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Información básica cuando no hay customFields */}
                {(!product.customFields || Object.keys(product.customFields).length === 0) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden description-text text-[0.9rem]">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-[0.95rem] font-semibold text-gray-900">
                        Detalii produs
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors md:border-r border-gray-100 border-b">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]"><Tag className="w-4 h-4" /></div>
                          <span className="text-gray-500">Categorie</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {product.category}
                        </span>
                      </div>
                      {product.subcategory && (
                        <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="text-[#13C1AC]"><Settings className="w-4 h-4" /></div>
                            <span className="text-gray-500">Subcategorie</span>
                          </div>
                          <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                            {product.subcategory}
                          </span>
                        </div>
                      )}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors md:border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]"><MapPin className="w-4 h-4" /></div>
                          <span className="text-gray-500">Locație</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {product.location}
                        </span>
                      </div>
                      {/* Metoda de predare */}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors md:border-r border-gray-100 border-b">
                        <div className="flex items-center gap-3">
                          <div className={product.deliveryType === 'shipping' || product.deliveryType === 'both' ? 'text-purple-500' : 'text-[#13C1AC]'}>
                            {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <span className="text-gray-500">Predare</span>
                        </div>
                        <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${
                          product.deliveryType === 'shipping' || product.deliveryType === 'both' 
                            ? 'text-purple-600 border border-purple-300 bg-purple-50' 
                            : 'text-gray-900 border border-[#13C1AC]/30 bg-[#13C1AC]/5'
                        }`}>
                          {product.deliveryType === 'shipping' ? 'Livrare disponibilă' : 
                           product.deliveryType === 'both' ? 'Personal + Livrare' : 
                           'Predare personală'}
                        </span>
                      </div>
                      {/* Publicat */}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]"><Clock className="w-4 h-4" /></div>
                          <span className="text-gray-500">Publicat</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {getRelativeTime(product.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Right Column: Price & Seller Info */}
            <div className="space-y-6">
                
                {/* Price Card - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="description-text text-xl md:text-2xl font-bold text-gray-900 flex-1 mr-4">
                            {product.title.length > 45 ? product.title.substring(0, 45) + '...' : product.title}
                        </h1>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900 mb-3">{formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}</div>
                    
                    {/* Condition & Negotiable Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
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
                        
                        {/* Time badge */}
                        <span className="px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(product.publishedAt)}
                        </span>
                    </div>
                    
                    <button 
                        onClick={async () => {
                            if (!user) {
                                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                                return;
                            }
                            if (product && user.uid !== product.seller.id) {
                                setCheckingConversation(true);
                                try {
                                    // Check if conversation already exists for this product
                                    const existingConvId = await findExistingConversation(
                                        user.uid,
                                        product.sellerId || product.seller.id,
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
                        disabled={user?.uid === product?.seller?.id || checkingConversation}
                        className={`w-full font-bold py-3 px-4 rounded-full transition-colors mb-3 flex items-center justify-center ${
                            user?.uid === product?.seller?.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#13C1AC] text-white hover:bg-[#10a593] shadow-lg shadow-teal-500/30'
                        }`}
                    >
                        {checkingConversation ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Se verifică...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-5 w-5 mr-2" />
                                {user?.uid === product?.seller?.id ? 'Tu anuncio' : 'Chat'}
                            </>
                        )}
                    </button>
                    
                    {/* Phone Button - Only show if seller has phone and showPhone is explicitly true */}
                    {sellerProfile?.phone && sellerProfile?.settings?.showPhone === true && user?.uid !== product?.sellerId ? (
                      <a 
                        href={`tel:${sellerProfile.phone}`}
                        className="w-full bg-[#E5F9F6] text-[#13C1AC] font-bold py-3 px-4 rounded-full hover:bg-[#d0f5f0] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sellerProfile.phone}
                      </a>
                    ) : user?.uid === product?.sellerId ? (
                      <button 
                        disabled
                        className="w-full bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded-full cursor-not-allowed"
                      >
                        Tu anuncio
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-[#E5F9F6] text-[#13C1AC]/50 font-bold py-3 px-4 rounded-full cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefon ascuns
                      </button>
                    )}
                </div>

                {/* Seller Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <Link href={`/user/${product.seller.id}`} className="flex items-center mb-4 group cursor-pointer">
                        <div className="mr-4 group-hover:opacity-90 transition-opacity relative">
                            <div className={`h-16 w-16 rounded-full overflow-hidden ring-4 ring-[#13C1AC]/30 ${product.seller.avatar ? '' : 'bg-gradient-to-br from-[#13C1AC] to-emerald-500 flex items-center justify-center'}`}>
                              {product.seller.avatar ? (
                                <img src={product.seller.avatar} alt={formatPublicName(product.seller.name)} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl font-bold text-white">{(product.seller.name || 'U')[0].toUpperCase()}</span>
                              )}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            {/* VIP Badge - shown when product is promoted */}
                            {product.promoted && product.promotionEnd && (
                              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#13C1AC] to-emerald-500 rounded-full p-1 shadow-lg border-2 border-white">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#13C1AC] transition-colors">{formatPublicName(product.seller.name)}</h3>
                              {/* VIP Text Badge */}
                              {product.promoted && product.promotionEnd && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white text-[10px] font-bold rounded-full">
                                  <Crown className="w-2.5 h-2.5" />
                                  Promovat
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-sm">
                                <div className="flex text-yellow-400 mr-1">
                                    {[...Array(5)].map((_, i) => (
                                         <svg key={i} className={`h-4 w-4 ${i < Math.floor(product.seller.rating || 5) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                         </svg>
                                    ))}
                                </div>
                                <span className="text-gray-500">({product.seller.reviews || 0})</span>
                            </div>
                        </div>
                    </Link>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {product.location}
                        </div>
                        <div>
                           Membru din {product.seller.joined || '2024'}
                        </div>
                    </div>
                </div>

                {/* Business Details - Only for business accounts */}
                {sellerProfile?.accountType === 'business' && (
                  <BusinessDetails sellerProfile={sellerProfile} />
                )}

                {/* Safety Tips */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Sfaturi de siguranță</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start">
                            <div className="bg-blue-50 p-1 rounded-full text-blue-500 mr-3 mt-0.5">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span>Nu trimite bani înainte de a vedea produsul.</span>
                        </li>
                        <li className="flex items-start">
                             <div className="bg-blue-50 p-1 rounded-full text-blue-500 mr-3 mt-0.5">
                                <MessageCircle className="h-4 w-4" />
                             </div>
                            <span>Folosește chat-ul pentru a comunica.</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>

        {/* More from seller section */}
        {sellerProducts.length > 0 && (
          <div className="mt-10 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mai multe de la vânzător</h2>
              <span className="text-sm text-gray-500 border border-gray-200 px-3 py-1 rounded-full">
                {sellerProducts.length} anunțuri
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sellerProducts.map((item, index) => (
                 <div 
                   key={`${item.id}-theme-${currentTheme}`} 
                   className="h-full"
                  
                 >
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

          {/* Imagen principal - only load current and adjacent */}
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

            {/* Single current image - optimized loading */}
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
                  <Avatar src={product.seller.avatar} name={product.seller.name} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-white font-medium truncate text-lg">{product.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <span>{formatPublicName(product.seller.name)}</span>
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
                   if (user.uid === product?.seller?.id) return;
                   
                   try {
                       setCheckingConversation(true);
                       const existingConvId = await findExistingConversation(
                           user.uid,
                           product.sellerId || product.seller.id,
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
                disabled={user?.uid === product?.seller?.id || checkingConversation}
                className={`px-6 py-2.5 font-semibold rounded-full transition-colors flex-shrink-0 shadow-lg shadow-teal-900/20 flex items-center gap-2 ${
                    user?.uid === product?.seller?.id 
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
                        <span>{user?.uid === product?.seller?.id ? 'Anunțul tău' : 'Chat'}</span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                        product.sellerId || product.seller.id,
                        {
                          [user.uid]: user.displayName || 'Usuario',
                          [product.sellerId || product.seller.id]: product.seller.name
                        },
                        {
                          [user.uid]: user.photoURL || '',
                          [product.sellerId || product.seller.id]: product.seller.avatar || ''
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
    </div>
  );
}
